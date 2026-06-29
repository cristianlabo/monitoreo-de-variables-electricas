/* MQTT Mutual Authentication Example */

#include <stdio.h>
#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include "esp_wifi.h"
#include "esp_system.h"
#include "nvs_flash.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "protocol_examples_common.h"

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/semphr.h"
#include "freertos/queue.h"

#include "lwip/sockets.h"
#include "lwip/dns.h"
#include "lwip/netdb.h"

#include "esp_log.h"
#include "mqtt_client.h"
#include "cJSON.h"

#include "ssd1306.h"

#include "driver/adc.h"
#include "esp_adc_cal.h"
#include <math.h>


/* topic MQTT */

#define MQTT_TOPIC "/CASA/FRENTE/ENERGIA_ELECTRICA"
#define UBICACION "CASA FRENTE"
#define DEVICE_NAME "ESP32_SCT013_ZMPT101B_ENERGIA_ELECTRICA"
#define DEVICE_ID 1
#define NODO_ID 0


/* Pines I2C */

#define SDA_GPIO GPIO_NUM_21
#define SCL_GPIO GPIO_NUM_22

/* Pines ADC */

#define ADC_CHANNEL_VOLTAGE   ADC1_CHANNEL_7   // GPIO34
#define ADC_CHANNEL_CURRENT   ADC1_CHANNEL_6   // GPIO35
#define ADC_WIDTH             ADC_WIDTH_BIT_12
#define ADC_ATTEN             ADC_ATTEN_DB_12//ADC_ATTEN_DB_12  // hasta ~3.6 V

/* Parámetros de muestreo */
#define NUM_MUESTRAS          1200              // (≃20 ciclos a 50 Hz)
#define MUESTRA_X_SEGUNDOS    20               
#define FS_US                 100              // 10 kHz → 100 µs

/* Offset y escalas */
#define ADC_REF_VOLT          3.3f
#define OFFSET_VOLT           1.65f

/* Calibración 2‑puntos para tensión  (RELLENA con tus datos) */

#define V_LOW_REAL            0.0f
#define V_HIGH_REAL           239.0f            // multimetro de referencia
#define V_LOW_RAW             0.0f
#define V_HIGH_RAW            0.4783f           // vrms_raw medido sin carga a 239 V
#define P_REF                 1.1// factor de correcion potencia activa

/* El SCT013 induce ~1.8 V de lectura fantasma en el ZMPT por cada A de carga */
#define V_CORRECCION_POR_AMP    1.8f

static const float mV = (V_HIGH_REAL - V_LOW_REAL) / (V_HIGH_RAW - V_LOW_RAW);
static const float bV = V_LOW_REAL - mV * V_LOW_RAW;

static const char *TAG = "ADC";

typedef struct {
    esp_mqtt_client_handle_t client;
} mqtt_task_params_t;


static void init_adc() {
    adc1_config_width(ADC_WIDTH);
    adc1_config_channel_atten(ADC_CHANNEL_VOLTAGE, ADC_ATTEN);
    adc1_config_channel_atten(ADC_CHANNEL_CURRENT, ADC_ATTEN);
}

/* ---------------  FUNCIONES  --------------- */


static esp_adc_cal_characteristics_t adc_chars;
static bool adc_char_ok = false;

/* ADC crudo → voltios reales, usando tabla de caracterización */
static inline float raw_to_volt(uint32_t raw)
{
    if (!adc_char_ok) {    // se hace una sola vez
        esp_adc_cal_characterize(ADC_UNIT_1, ADC_ATTEN,ADC_WIDTH, 1100, &adc_chars);
        adc_char_ok = true;
    }
    return esp_adc_cal_raw_to_voltage(raw, &adc_chars) / 1000.0f; // mV→V
}

/* ------------ calcular_vrms() con WARM-UP -------------- */

#define MEDIA_MUESTRAS 10   // cantidad de valores para la media móvil

static float Vrms_filtrado = 0.0f;  // Variable para mantener el valor filtrado de la tensión

static float buffer[MEDIA_MUESTRAS] = {0};  // Buffer para almacenar las muestras
static int indice = 0;                      // Índice para el buffer
static bool buffer_lleno = false;           // Indicador si el buffer está lleno

float ALPHA = 0.55f;              // suavizado corriente / tension en cambios graduales
float UMBRAL_CAMBIO = 1.5f;       // V: seguir cambios de red (carga on/off) en 1-2 ciclos
float ultima_tension = 0.0f;  // Para detectar cambios bruscos

float UMBRAL_TENSION_MEDIBLE = 15.0f;  // Umbral TENSION minimo de medicion


#define SENSIBILIDAD_CT       0.0495//0.0117f            // para corriente (no usado aquí)
#define MEDIA_MUESTRAS_I      10   // Cantidad de muestras para el buffer de corriente
#define UMBRAL_CAMBIO_I       1.0f // Ajustable según sensibilidad del sensor de corriente
#define UMBRAL_CORRIENTE_MEDIBLE 0.05f // Corriente mínima detectable
#define UMBRAL_POTENCIA_MEDIBLE 0.0f // Corriente mínima detectable

static float Irms_filtrado = 0.0f;   // Valor suavizado de corriente
static float buffer_i[MEDIA_MUESTRAS_I] = {0};  // Buffer de corriente
static int indice_i = 0;             // Índice del buffer
static bool buffer_lleno_i = false;  // Indicador de buffer lleno
static float irms_para_corr = 0.0f;  // corriente del ciclo actual para compensar V
static bool reset_v_filtro = false;

static void reset_filtro_vrms(void)
{
    Vrms_filtrado = 0.0f;
    reset_v_filtro = true;
}

/* Buffers para capturar una ventana completa antes de quitar DC (evita error por re-leer ADC) */
static float buf_muestras_v[NUM_MUESTRAS];
static float buf_muestras_i[NUM_MUESTRAS];

static float median3(float a, float b, float c)
{
    if (a > b) { float t = a; a = b; b = t; }
    if (b > c) { float t = b; b = c; c = t; }
    if (a > b) { float t = a; a = b; b = t; }
    return b;
}

/* Quita el DC de la ventana actual (compensa deriva térmica del ZMPT101B) */
static float rms_ac_de_buffer(const float *buf, int muestras, float *dc_out)
{
    double sum = 0.0;
    for (int i = 0; i < muestras; ++i) {
        sum += buf[i];
    }
    float mean = (float)(sum / muestras);
    if (dc_out) {
        *dc_out = mean;
    }
    float sum2 = 0.0f;
    for (int i = 0; i < muestras; ++i) {
        float ac = buf[i] - mean;
        sum2 += ac * ac;
    }
    return sqrtf(sum2 / muestras);
}

float calcular_vrms(adc1_channel_t canal_adc, int muestras)
{
    for (int i = 0; i < muestras; ++i) {
        buf_muestras_v[i] = raw_to_volt(adc1_get_raw(canal_adc));
        ets_delay_us(FS_US);
    }

    float dc_mean = 0.0f;
    float vrms_raw = rms_ac_de_buffer(buf_muestras_v, muestras, &dc_mean);
    float vrms_bruto = mV * vrms_raw + bV;
    float vrms_real = vrms_bruto - V_CORRECCION_POR_AMP * irms_para_corr;
    if (vrms_real < 0.0f) {
        vrms_real = 0.0f;
    }
    ESP_LOGI(TAG, "dc_mean=%.4f V, vrms_raw=%.4f -> vrms_corr=%.1f V (I=%.2f A)",
             dc_mean, vrms_raw, vrms_real, irms_para_corr);

    /* Mediana de 3 ciclos: filtra ruido sin ocultar cambios sostenidos de la red */
    static float v_hist[3] = {0};
    static int v_hi = 0;
    static int v_n = 0;
    if (reset_v_filtro) {
        memset(v_hist, 0, sizeof(v_hist));
        v_hi = 0;
        v_n = 0;
        reset_v_filtro = false;
    }
    v_hist[v_hi] = vrms_real;
    v_hi = (v_hi + 1) % 3;
    if (v_n < 3) {
        v_n++;
    }
    float v_in = vrms_real;
    if (v_n == 3) {
        v_in = median3(v_hist[0], v_hist[1], v_hist[2]);
    }

    if (Vrms_filtrado == 0.0f) {
        Vrms_filtrado = v_in;
    } else if (fabsf(v_in - Vrms_filtrado) > UMBRAL_CAMBIO) {
        Vrms_filtrado = v_in;
        ESP_LOGI(TAG, "Cambio de tension en red: %.1f V", v_in);
    } else {
        Vrms_filtrado = ALPHA * v_in + (1.0f - ALPHA) * Vrms_filtrado;
    }

    if (Vrms_filtrado < UMBRAL_TENSION_MEDIBLE)
        Vrms_filtrado = 0;

    return Vrms_filtrado;
}


float calcular_irms(adc1_channel_t canal_adc, int muestras, float sensibilidad)
{
    for (int i = 0; i < muestras; ++i) {
        buf_muestras_i[i] = raw_to_volt(adc1_get_raw(canal_adc));
        ets_delay_us(FS_US);
    }

    float vrms_raw = rms_ac_de_buffer(buf_muestras_i, muestras, NULL);
    float irms = vrms_raw / sensibilidad;

    buffer_i[indice_i] = irms;
    indice_i++;

    if (indice_i >= MEDIA_MUESTRAS_I) {
        indice_i = 0;
        buffer_lleno_i = true;
    }

    float promedio = 0.0f;
    int muestras_validas = buffer_lleno_i ? MEDIA_MUESTRAS_I : indice_i;
    for (int i = 0; i < muestras_validas; ++i) {
        promedio += buffer_i[i];
    }
    promedio /= muestras_validas;

    if (fabs(irms - promedio) > UMBRAL_CAMBIO_I) {
        Irms_filtrado = irms;
        memset(buffer_i, 0, sizeof(buffer_i));
        indice_i = 0;
        buffer_lleno_i = false;
        ESP_LOGI(TAG, "Cambio brusco de corriente detectado, buffer I reiniciado.");
    } else {
        if (Irms_filtrado == 0.0f)
            Irms_filtrado = promedio;
        Irms_filtrado = ALPHA * irms + (1.0f - ALPHA) * Irms_filtrado;
    }

    if (Irms_filtrado < UMBRAL_CORRIENTE_MEDIBLE)
        Irms_filtrado = 0;

    return Irms_filtrado;
}

/* Potencia activa: misma correccion de V que en Vrms para que P <= S */
static float calcular_potencia_activa(adc1_channel_t canal_v, adc1_channel_t canal_i, int muestras, float sensibilidad_ct, float irms_corr)
{
    for (int n = 0; n < muestras; ++n) {
        buf_muestras_v[n] = raw_to_volt(adc1_get_raw(canal_v));
        buf_muestras_i[n] = raw_to_volt(adc1_get_raw(canal_i));
        ets_delay_us(FS_US);
    }

    double sum_v = 0.0, sum_i = 0.0;
    for (int n = 0; n < muestras; ++n) {
        sum_v += buf_muestras_v[n];
        sum_i += buf_muestras_i[n];
    }
    float mean_v = (float)(sum_v / muestras);
    float mean_i = (float)(sum_i / muestras);

    float sum2_v = 0.0f;
    for (int n = 0; n < muestras; ++n) {
        float ac = buf_muestras_v[n] - mean_v;
        sum2_v += ac * ac;
    }
    float vrms_bruto = mV * sqrtf(sum2_v / muestras);
    float factor_v = 1.0f;
    if (irms_corr > 0.15f && vrms_bruto > 5.0f) {
        float vrms_corr = vrms_bruto - V_CORRECCION_POR_AMP * irms_corr;
        if (vrms_corr > 0.0f) {
            factor_v = vrms_corr / vrms_bruto;
        }
    }

    float suma_p = 0.0f;
    #define RETARDO_MUESTRAS 3
    float buffer_v_delay[RETARDO_MUESTRAS] = {0};
    int indice_delay = 0;

    for (int n = 0; n < muestras; ++n) {
        float v_ac = mV * (buf_muestras_v[n] - mean_v) * factor_v;
        float i_inst = (buf_muestras_i[n] - mean_i) / sensibilidad_ct;

        buffer_v_delay[indice_delay] = v_ac;
        int indice_v_adelantado = (indice_delay + 1) % RETARDO_MUESTRAS;
        float v_delay = buffer_v_delay[indice_v_adelantado];
        indice_delay = (indice_delay + 1) % RETARDO_MUESTRAS;

        suma_p += v_delay * i_inst;
    }

    float p_activa = suma_p / muestras;
    if (p_activa < UMBRAL_POTENCIA_MEDIBLE)
        p_activa = 0;
    return p_activa;
}

#if 0 /* calcular_todo_filtrado: version anterior (revertir si hace falta) */
float calcular_todo_filtrado(adc1_channel_t canal_v, adc1_channel_t canal_i, int muestras, float sensibilidad_ct, float *Vrms_out, float *Irms_out) {
    float acc_v = 0.0, acc_i = 0.0;
    uint32_t raw_v, raw_i;
    float suma_p = 0.0, suma_v2 = 0.0, suma_i2 = 0.0;

    // === 0. Retardo por desfase entre ADCs ===
    #define RETARDO_MUESTRAS 3
    float buffer_v_delay[RETARDO_MUESTRAS] = {0};
    int indice_delay = 0;

    vTaskDelay(pdMS_TO_TICKS(1000));  // Esperar 1 segundo

    // === 1. Offset dinámico ===
    for (int i = 0; i < muestras; ++i) {
        raw_v = adc1_get_raw(canal_v);
        raw_i = adc1_get_raw(canal_i);
        acc_v += raw_to_volt(raw_v);
        acc_i += raw_to_volt(raw_i);
        ets_delay_us(FS_US);
    }

    float offset_v = acc_v / muestras;
    float offset_i = acc_i / muestras;

    // === 2. Medición conjunta con retardo ===
    for (int i = 0; i < muestras; ++i) {
        if (i % 2 == 0) {
            raw_v = adc1_get_raw(canal_v);
            raw_i = adc1_get_raw(canal_i);
        } else {
            raw_i = adc1_get_raw(canal_i);
            raw_v = adc1_get_raw(canal_v);
        }

        float v = mV * (raw_to_volt(raw_v) - offset_v) + bV;
        float i = (raw_to_volt(raw_i) - offset_i) / sensibilidad_ct;

        // Aplicar retardo a la tensión
        buffer_v_delay[indice_delay] = v;
        int indice_v_adelantado = (indice_delay + 1) % RETARDO_MUESTRAS;
        float v_delay = buffer_v_delay[indice_v_adelantado];
        indice_delay = (indice_delay + 1) % RETARDO_MUESTRAS;

        suma_v2 += v * v;
        suma_i2 += i * i;
        suma_p  += v_delay * (i);  // Ajuste: usar tensión "vieja"

        ets_delay_us(FS_US);
    }

    // === 3. Cálculo RMS crudo ===
    float vrms_raw = sqrtf(suma_v2 / muestras);
    float irms_raw = sqrtf(suma_i2 / muestras);
    float p_activa = suma_p / muestras;

    // === 4. Escalado ===
    float vrms_real = vrms_raw;
    float irms_real = irms_raw;

    // === 5. Media móvil ===
    buffer[indice] = vrms_real;
    buffer_i[indice_i] = irms_real;
    indice++;
    indice_i++;

    if (indice >= MEDIA_MUESTRAS) {
        indice = 0;
        buffer_lleno = true;
    }
    if (indice_i >= MEDIA_MUESTRAS_I) {
        indice_i = 0;
        buffer_lleno_i = true;
    }

    float prom_v = 0.0, prom_i = 0.0;
    int validas_v = buffer_lleno ? MEDIA_MUESTRAS : indice;
    int validas_i = buffer_lleno_i ? MEDIA_MUESTRAS_I : indice_i;

    for (int i = 0; i < validas_v; i++) prom_v += buffer[i];
    for (int i = 0; i < validas_i; i++) prom_i += buffer_i[i];
    prom_v /= validas_v;
    prom_i /= validas_i;

    // === 6. Suavizado con EMA ===
    if (fabs(vrms_real - prom_v) > UMBRAL_CAMBIO) {
        Vrms_filtrado = vrms_real;
        memset(buffer, 0, sizeof(buffer));
        indice = 0;
        buffer_lleno = false;
        buffer_lleno_i = false;
        ESP_LOGI(TAG, "Cambio brusco de tensión detectado. Buffer reiniciado.");
    } else {
        if (Vrms_filtrado == 0.0f) Vrms_filtrado = prom_v;
        Vrms_filtrado = ALPHA * vrms_real + (1.0f - ALPHA) * Vrms_filtrado;
    }

    if (fabs(irms_real - prom_i) > UMBRAL_CAMBIO_I) {
        Irms_filtrado = irms_real;
        memset(buffer_i, 0, sizeof(buffer_i));
        indice_i = 0;
        buffer_lleno = false;
        buffer_lleno_i = false;
        ESP_LOGI(TAG, "Cambio brusco de corriente detectado. Buffer reiniciado.");
    } else {
        if (Irms_filtrado == 0.0f) Irms_filtrado = prom_i;
        Irms_filtrado = ALPHA * irms_real + (1.0f - ALPHA) * Irms_filtrado;
    }

    // === 7. Umbral mínimo medible ===
    if (Vrms_filtrado < UMBRAL_TENSION_MEDIBLE) Vrms_filtrado = 0;
    if (Irms_filtrado < UMBRAL_CORRIENTE_MEDIBLE) Irms_filtrado = 0;
    if (p_activa < UMBRAL_POTENCIA_MEDIBLE) p_activa = 0;



    // === 8. Devolver resultados ===
    *Vrms_out = Vrms_filtrado;
    *Irms_out = Irms_filtrado;

    

    return p_activa;
}
#endif

static void http_get_task(void *pvParameters)
{
    mqtt_task_params_t *task_params = (mqtt_task_params_t *)pvParameters;
    esp_mqtt_client_handle_t client = task_params->client;
    
    init_adc();
    vTaskDelay(pdMS_TO_TICKS(500));

    // Convertir a voltaje real
   
    
    SSD1306_t dev2;

    i2c_master_init(&dev2, SDA_GPIO, SCL_GPIO, CONFIG_RESET_GPIO);
    ssd1306_init(&dev2, 128, 64);
            

    float vrms = 0;
    float irms = 0;
    float irms_anterior = 0.0f;
    int ciclos_desde_cambio_carga = 99;
    float cos_phi_estable = 0.99f;
    float potencia_aparente = 0;
    float potencia_activa = 0;
    float potencia_reactiva = 0;
    float cos_phi = 0.85;
    char buffer[64];   // Buffer de texto para formatear los valores
    



    while(1) {


            irms = calcular_irms(ADC_CHANNEL_CURRENT, NUM_MUESTRAS, SENSIBILIDAD_CT);
            if (irms < 0.1f) {
                irms = 0.0f;
            }
            irms_para_corr = irms;
            if (fabsf(irms - irms_anterior) > 0.4f) {
                reset_filtro_vrms();
                ciclos_desde_cambio_carga = 0;
                ESP_LOGI(TAG, "Cambio de carga: I=%.2f A, reinicio filtro V", irms);
            } else if (ciclos_desde_cambio_carga < 10) {
                ciclos_desde_cambio_carga++;
            }
            irms_anterior = irms;

            vrms = calcular_vrms(ADC_CHANNEL_VOLTAGE, NUM_MUESTRAS);
            potencia_aparente = vrms * irms;
            potencia_activa = calcular_potencia_activa(ADC_CHANNEL_VOLTAGE, ADC_CHANNEL_CURRENT, NUM_MUESTRAS, SENSIBILIDAD_CT, irms) * P_REF;

            if (irms < 0.1){
                irms = 0;
                potencia_activa = 0;
                potencia_aparente = 0;
                potencia_reactiva = 0;
            }
                
            
            if(potencia_activa == 0 || potencia_aparente == 0){
                cos_phi = 0.99f;
                potencia_reactiva = 0;
                cos_phi_estable = 0.99f;
            }
            else{
                if (potencia_activa > potencia_aparente) {
                    potencia_activa = potencia_aparente * 0.98f;
                }
                cos_phi = potencia_activa / potencia_aparente;
                if (cos_phi > 1.0f) {
                    cos_phi = 1.0f;
                }
                if (cos_phi < 0.0f) {
                    cos_phi = 0.0f;
                }
                potencia_reactiva = sqrtf(fmaxf(0.0f,
                    (potencia_aparente * potencia_aparente) - (potencia_activa * potencia_activa)));

                /* Durante transicion de carga, no mostrar cos(phi) invalido */
                if (ciclos_desde_cambio_carga < 3) {
                    cos_phi = cos_phi_estable;
                } else {
                    cos_phi_estable = cos_phi;
                }
            }

            // Inicializar I2C y SSD1306
            
            // Mostrar texto en la pantalla OLED
            ssd1306_clear_screen(&dev2, false);
            ssd1306_contrast(&dev2, 0xFF);

            // Línea 0: Tensión
            snprintf(buffer, sizeof(buffer), "Vrms: %.1f V", vrms);
            ssd1306_display_text(&dev2, 0, buffer, strlen(buffer), false);

            // Línea 1: Corriente
            snprintf(buffer, sizeof(buffer), "Irms: %.2f A", irms);
            ssd1306_display_text(&dev2, 1, buffer, strlen(buffer), false);

            // Línea 2: Potencia activa
            snprintf(buffer, sizeof(buffer), "P: %.0f W", potencia_activa);
            ssd1306_display_text(&dev2, 2, buffer, strlen(buffer), false);

            // Línea 3:  Potencia reactiva
            snprintf(buffer, sizeof(buffer), "Q: %.0f  VAR", potencia_reactiva);
            ssd1306_display_text(&dev2, 3, buffer, strlen(buffer), false);

            // Línea 4: Potencia aparente
            snprintf(buffer, sizeof(buffer), "S: %.0f VA", potencia_aparente);
            ssd1306_display_text(&dev2, 4, buffer, strlen(buffer), false);

            // Línea 5: Coseno phi
            snprintf(buffer, sizeof(buffer), "cos(phi):%.2f", cos_phi);
            ssd1306_display_text(&dev2, 5, buffer, strlen(buffer), false);

        
            
            ESP_LOGI(TAG, "Vrms: %.1f V", vrms);
            ESP_LOGI(TAG, "Irms: %.2f A", irms);
            ESP_LOGI(TAG, "P: %.0f W", potencia_activa);
            ESP_LOGI(TAG, "Q: %.0f VAR", potencia_reactiva);
            ESP_LOGI(TAG, "S: %.0f VA", potencia_aparente);
            ESP_LOGI(TAG, "cos(phi):%.2f", cos_phi);
 

            ESP_LOGI(TAG, "MQTT_EVENT_ENVIAR");
            
    
            // Crear un objeto JSON
            cJSON *root = cJSON_CreateObject();
            //cJSON_AddStringToObject(root, "type", "message");
            cJSON_AddNumberToObject(root, "dispositivoId",DEVICE_ID);
            cJSON_AddStringToObject(root, "nombre", DEVICE_NAME);
            cJSON_AddStringToObject(root, "ubicacion", UBICACION);
            cJSON_AddNumberToObject(root, "vrms", vrms);
            cJSON_AddNumberToObject(root, "irms", irms);
            cJSON_AddNumberToObject(root, "potencia_activa", potencia_activa);
            cJSON_AddNumberToObject(root, "potencia_reactiva", potencia_reactiva);
            cJSON_AddNumberToObject(root, "potencia_aparente", potencia_aparente);
            cJSON_AddNumberToObject(root, "cos_phi", cos_phi);
            cJSON_AddNumberToObject(root, "nodoId", NODO_ID);

         
            // Convertir el objeto JSON a una cadena
            const char *json_string = cJSON_Print(root);

            // Publicar el JSON
            esp_mqtt_client_publish(client, MQTT_TOPIC, json_string, 0, 1, 0);

            // Liberar la memoria utilizada por el objeto JSON
            cJSON_Delete(root);
            free((void*)json_string); // cJSON_Print uses malloc
        //} 
        // cada cuento tiempo transmito 
         vTaskDelay(MUESTRA_X_SEGUNDOS * 1000 / portTICK_RATE_MS);
    } 

}






// Set your local broker URI
#define BROKER_URI "mqtts://163.176.32.93:8883"

//static const char *TAG = "MQTTS_EXAMPLE";

extern const uint8_t client_cert_pem_start[] asm("_binary_client_crt_start");
extern const uint8_t client_cert_pem_end[] asm("_binary_client_crt_end");
extern const uint8_t client_key_pem_start[] asm("_binary_client_key_start");
extern const uint8_t client_key_pem_end[] asm("_binary_client_key_end");
extern const uint8_t server_cert_pem_start[] asm("_binary_broker_CA_crt_start");
extern const uint8_t server_cert_pem_end[] asm("_binary_broker_CA_crt_end");



static void log_error_if_nonzero(const char *message, int error_code)
{
    if (error_code != 0) {
        ESP_LOGE(TAG, "Last error %s: 0x%x", message, error_code);
    }
}

/*
 * @brief Event handler registered to receive MQTT events
 *
 *  This function is called by the MQTT client event loop.
 *
 * @param handler_args user data registered to the event.
 * @param base Event base for the handler(always MQTT Base in this example).
 * @param event_id The id for the received event.
 * @param event_data The data for the event, esp_mqtt_event_handle_t.
 */

 
static void mqtt_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data)
{
    ESP_LOGD(TAG, "Event dispatched from event loop base=%s, event_id=%d", base, event_id);
    esp_mqtt_event_handle_t event = event_data;
    esp_mqtt_client_handle_t client = event->client;
    int msg_id;
    switch ((esp_mqtt_event_id_t)event_id) {
    case MQTT_EVENT_CONNECTED:
         {
            ESP_LOGI(TAG, "MQTT_EVENT_CONNECTED");
            break;
        }
    case MQTT_EVENT_DISCONNECTED:
        ESP_LOGI(TAG, "MQTT_EVENT_DISCONNECTED");
        break;

    case MQTT_EVENT_SUBSCRIBED:
        ESP_LOGI(TAG, "MQTT_EVENT_SUBSCRIBED, msg_id=%d", event->msg_id);
        msg_id = esp_mqtt_client_publish(client, "/topic/qos0", "data", 0, 0, 0);
        ESP_LOGI(TAG, "sent publish successful, msg_id=%d", msg_id);
        break;
    case MQTT_EVENT_UNSUBSCRIBED:
        ESP_LOGI(TAG, "MQTT_EVENT_UNSUBSCRIBED, msg_id=%d", event->msg_id);
        break;
    case MQTT_EVENT_PUBLISHED:
        ESP_LOGI(TAG, "MQTT_EVENT_PUBLISHED, msg_id=%d", event->msg_id);
        break;
    case MQTT_EVENT_DATA:
        ESP_LOGI(TAG, "MQTT_EVENT_DATA");
        printf("TOPIC=%.*s\r\n", event->topic_len, event->topic);
        printf("DATA=%.*s\r\n", event->data_len, event->data);
        break;
    case MQTT_EVENT_ERROR:
        ESP_LOGI(TAG, "MQTT_EVENT_ERROR");
        if (event->error_handle->error_type == MQTT_ERROR_TYPE_TCP_TRANSPORT) {
            log_error_if_nonzero("reported from esp-tls", event->error_handle->esp_tls_last_esp_err);
            log_error_if_nonzero("reported from tls stack", event->error_handle->esp_tls_stack_err);
            log_error_if_nonzero("captured as transport's socket errno",  event->error_handle->esp_transport_sock_errno);
            ESP_LOGI(TAG, "Last errno string (%s)", strerror(event->error_handle->esp_transport_sock_errno));

        }
        break;
    default:
        ESP_LOGI(TAG, "Other event id:%d", event->event_id);
        break;
    }
}



static void mqtt_app_start(void)
{
    const esp_mqtt_client_config_t mqtt_cfg = {
        .uri = BROKER_URI,
        .client_cert_pem = (const char *)client_cert_pem_start,
        .client_key_pem = (const char *)client_key_pem_start,
        .cert_pem = (const char *)server_cert_pem_start,
    };

    ESP_LOGI(TAG, "[APP] Free memory: %d bytes", esp_get_free_heap_size());
    esp_mqtt_client_handle_t client = esp_mqtt_client_init(&mqtt_cfg);
    // The last argument may be used to pass data to the event handler, in this example mqtt_event_handler 
    esp_mqtt_client_register_event(client, ESP_EVENT_ANY_ID, mqtt_event_handler, NULL);
    esp_mqtt_client_start(client);

    //ESP_ERROR_CHECK(i2cdev_init());

    mqtt_task_params_t task_params = {
        .client = client
    };

    xTaskCreate(&http_get_task, "http_get_task", 4096,&task_params, 5, NULL);



}



/*

static void http_get_task(void *pvParameters)
{
    //mqtt_task_params_t *task_params = (mqtt_task_params_t *)pvParameters;
    //esp_mqtt_client_handle_t client = task_params->client;

    init_adc();

    // Leer valores del ADC
    int raw_voltage = adc1_get_raw(ADC_CHANNEL_VOLTAGE);
    int raw_current = adc1_get_raw(ADC_CHANNEL_CURRENT);

    // Convertir a voltaje real
    float tension_rms = raw_voltage * 3.3 / 4095;
    float corriente_rms = raw_current * 3.3 / 4095;
    
    SSD1306_t dev2;
    // Inicializar I2C y SSD1306
    i2c_master_init(&dev2, SDA_GPIO, SCL_GPIO, CONFIG_RESET_GPIO);
    ssd1306_init(&dev2, 128, 64);
    
    // Mostrar texto en la pantalla OLED
    ssd1306_clear_screen(&dev2, false);
    ssd1306_contrast(&dev2, 0xFF);

    //float tension_rms = 220.5;
    //float corriente_rms = 1.37;
    float potencia_activa = 300.0;
    float potencia_reactiva = 120.0;
    float cos_phi = 0.85;
    char buffer[64];   // Buffer de texto para formatear los valores

    // Línea 0: Tensión
    snprintf(buffer, sizeof(buffer), "Vrms: %.1f V", tension_rms);
    ssd1306_display_text(&dev2, 0, buffer, strlen(buffer), false);

    // Línea 1: Corriente
    snprintf(buffer, sizeof(buffer), "Irms: %.2f A", corriente_rms);
    ssd1306_display_text(&dev2, 1, buffer, strlen(buffer), false);

    // Línea 2: Potencia activa
    snprintf(buffer, sizeof(buffer), "P: %.1f W", potencia_activa);
    ssd1306_display_text(&dev2, 2, buffer, strlen(buffer), false);

    // Línea 3: Potencia reactiva
    snprintf(buffer, sizeof(buffer), "Q: %.1f var", potencia_reactiva);
    ssd1306_display_text(&dev2, 3, buffer, strlen(buffer), false);

    // Línea 4: Coseno phi
    snprintf(buffer, sizeof(buffer), "cos(phi): %.2f", cos_phi);
    ssd1306_display_text(&dev2, 4, buffer, strlen(buffer), false);

    
    while (1) {
        // Puedes repetir la pantalla OLED o agregar más texto si lo necesitas
        vTaskDelay(1000 / portTICK_RATE_MS);  // Actualizar cada segundo
    }
}

*/

void app_main(void)
{
    ESP_LOGI(TAG, "[APP] Startup..");
    ESP_LOGI(TAG, "[APP] Free memory: %d bytes", esp_get_free_heap_size());
    ESP_LOGI(TAG, "[APP] IDF version: %s", esp_get_idf_version());

    esp_log_level_set("*", ESP_LOG_INFO);
    esp_log_level_set("MQTT_CLIENT", ESP_LOG_VERBOSE);
    esp_log_level_set("TRANSPORT_BASE", ESP_LOG_VERBOSE);
    esp_log_level_set("TRANSPORT", ESP_LOG_VERBOSE);
    esp_log_level_set("OUTBOX", ESP_LOG_VERBOSE);

    ESP_ERROR_CHECK(nvs_flash_init());
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());

    /* This helper function configures Wi-Fi or Ethernet, as selected in menuconfig.
     * Read "Establishing Wi-Fi or Ethernet Connection" section in
     * examples/protocols/README.md for more information about this function.
     */
    ESP_ERROR_CHECK(example_connect());
    mqtt_app_start();
     // Llamar a la función que ahora solo maneja el display
     //http_get_task(NULL);

}
