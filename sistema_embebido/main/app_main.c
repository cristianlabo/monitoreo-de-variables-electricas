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

#define V_LOW_REAL            0.001f//50.0f
#define V_HIGH_REAL           226.5f            // tensión nominal real
#define V_LOW_RAW             0.001f// 0.155f  andaba a tope izquierdo pote           // Vrms_sensor a 0 V
#define V_HIGH_RAW            0.449f// 0.76f     andaba a tope izquierdo pote       // Vrms_sensor a 227.9 V
#define P_REF                 1.1// factor de correcion potencia activa

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

float ALPHA = 0.2f;  // ALPHA normal para suavizar
float UMBRAL_CAMBIO = 7.0f;  // Umbral para detectar cambios bruscos (puedes ajustarlo)
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




float calcular_vrms(adc1_channel_t canal_adc, int muestras)
{
    double acc = 0.0;
    float sum2 = 0.0f;
    uint32_t raw;

    // 1. Offset dinámico
    for (int i = 0; i < muestras; ++i) {
        raw  = adc1_get_raw(canal_adc);
        acc += raw_to_volt(raw);
        ets_delay_us(FS_US);
    }
    float offset = acc / muestras;

    // 2. RMS crudo
    for (int i = 0; i < muestras; ++i) {
        raw  = adc1_get_raw(canal_adc);
        float v = raw_to_volt(raw) - offset;
        sum2 += v * v;
        ets_delay_us(FS_US);
    }
    float vrms_raw = sqrtf(sum2 / muestras);

    // 3. Escala lineal calibrada
    float vrms_real = mV * vrms_raw + bV;



    // 4. Media Móvil Simple
    buffer[indice] = vrms_real;  // Guardar la medida actual en el buffer
    indice++;                    // Mover el índice para la siguiente muestra

    // Si el buffer está lleno, volver a empezar en el índice 0
    if (indice >= MEDIA_MUESTRAS) {
        indice = 0;
        buffer_lleno = true;
    }

    // 5. Promediar las muestras guardadas en el buffer (SMA)
    float promedio = 0.0f;
    int muestras_validas = buffer_lleno ? MEDIA_MUESTRAS : indice;  // Si el buffer está lleno, usar todo
    for (int i = 0; i < muestras_validas; ++i) {
        promedio += buffer[i];  // Sumar todas las muestras en el buffer
    }

    ESP_LOGI(TAG, "Valores del Buffer de Tensión:");
    for (int i = 0; i < MEDIA_MUESTRAS; i++) {
        ESP_LOGI(TAG, "Muestra %d: %.2f V", i, buffer[i]);
    }

    promedio /= muestras_validas;  // Calcular el promedio de las muestras

    // 6. Suavizado con EMA (Media Móvil Exponencial)
    // 6. Comparar el valor actual con el promedio para detectar cambios bruscos
    if (fabs(vrms_real - promedio) > UMBRAL_CAMBIO) {
        // Si el cambio es mayor que el umbral, actualizar con el valor actual
        Vrms_filtrado = vrms_real;

        // Limpiar el buffer y reiniciar el índice
        memset(buffer, 0, sizeof(buffer));  // Limpiar el buffer
        indice = 0;  // Reiniciar el índice
        buffer_lleno = false;  // Marcar que el buffer no está lleno
        buffer_lleno_i = false;
        ESP_LOGI(TAG, "Cambio brusco detectado, limpiando buffer.");
    } else {
        // Si no, usar el promedio suavizado
        if (Vrms_filtrado == 0.0f) {
            Vrms_filtrado = promedio;  // Establecer el primer valor de promedio como base
        }
        // 7. Suavizado con EMA (Media Móvil Exponencial)
        Vrms_filtrado = ALPHA * vrms_real + (1.0f - ALPHA) * Vrms_filtrado;
    }

    if(Vrms_filtrado < UMBRAL_TENSION_MEDIBLE)
        Vrms_filtrado = 0;

    return Vrms_filtrado;  // Devolver el valor suavizado
}


float calcular_irms(adc1_channel_t canal_adc, int muestras, float sensibilidad)
{
    double acc = 0.0;
    float sum2 = 0.0f;
    uint32_t raw;

    // 1. Offset dinámico
    for (int i = 0; i < muestras; ++i) {
        raw  = adc1_get_raw(canal_adc);
        acc += raw_to_volt(raw);
        ets_delay_us(FS_US);
    }
    float offset = acc / muestras;

    // 2. RMS crudo
    for (int i = 0; i < muestras; ++i) {
        raw  = adc1_get_raw(canal_adc);
        float v = raw_to_volt(raw) - offset;
        sum2 += v * v;
        ets_delay_us(FS_US);
    }
    float vrms_raw = sqrtf(sum2 / muestras);

    // 3. Convertir voltaje RMS en corriente usando sensibilidad
    float irms = vrms_raw / sensibilidad;

    // 4. Media móvil simple para corriente
    buffer_i[indice_i] = irms;
    indice_i++;

    if (indice_i >= MEDIA_MUESTRAS_I) {
        indice_i = 0;
        buffer_lleno_i = true;
    }

    ESP_LOGI(TAG, "Valores del Buffer de Corriente:");
    for (int i = 0; i < MEDIA_MUESTRAS_I; i++) {
        ESP_LOGI(TAG, "Muestra %d: %.2f A", i, buffer_i[i]);
    }

    float promedio = 0.0f;
    int muestras_validas = buffer_lleno_i ? MEDIA_MUESTRAS_I : indice_i;
    for (int i = 0; i < muestras_validas; ++i) {
        promedio += buffer_i[i];
    }

    promedio /= muestras_validas;

    // 5. Detección de cambios bruscos y limpieza de buffer
    if (fabs(irms - promedio) > UMBRAL_CAMBIO_I) {
        Irms_filtrado = irms;
        memset(buffer_i, 0, sizeof(buffer_i));
        indice_i = 0;
        buffer_lleno_i = false;
        buffer_lleno = false;
        ESP_LOGI(TAG, "Cambio brusco de corriente detectado, limpiando buffer.");
    } else {
        if (Irms_filtrado == 0.0f)
            Irms_filtrado = promedio;
        Irms_filtrado = ALPHA * irms + (1.0f - ALPHA) * Irms_filtrado;
    }

    if (Irms_filtrado < UMBRAL_CORRIENTE_MEDIBLE)
        Irms_filtrado = 0;

    return Irms_filtrado;
}

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


static void http_get_task(void *pvParameters)
{
    mqtt_task_params_t *task_params = (mqtt_task_params_t *)pvParameters;
    esp_mqtt_client_handle_t client = task_params->client;
    
    init_adc();

    // Convertir a voltaje real
   
    
    SSD1306_t dev2;

    i2c_master_init(&dev2, SDA_GPIO, SCL_GPIO, CONFIG_RESET_GPIO);
    ssd1306_init(&dev2, 128, 64);
            

    float vrms = 0;
    float irms = 0;
    float potencia_aparente = 0;
    float potencia_activa = 0;
    float potencia_reactiva = 0;
    float cos_phi = 0.85;
    char buffer[64];   // Buffer de texto para formatear los valores
    



    while(1) {


            potencia_activa = calcular_todo_filtrado(ADC_CHANNEL_VOLTAGE, ADC_CHANNEL_CURRENT, NUM_MUESTRAS, SENSIBILIDAD_CT, &vrms, &irms)*P_REF;
            vrms = calcular_vrms(ADC_CHANNEL_VOLTAGE, NUM_MUESTRAS);
            irms = calcular_irms(ADC_CHANNEL_CURRENT, NUM_MUESTRAS, SENSIBILIDAD_CT);
            potencia_aparente = vrms * irms;

            if(irms < 0.1){
                irms = 0;
                potencia_activa = 0;
                potencia_aparente = 0;
                potencia_reactiva = 0;
            }
                
            
            if(potencia_activa == 0 || potencia_aparente == 0){
                cos_phi = 0.99;
                potencia_reactiva = 0;
            }
            else{

                cos_phi = potencia_activa / potencia_aparente;
                potencia_reactiva = sqrtf( fabsf((potencia_aparente * potencia_aparente) -(potencia_activa * potencia_activa)));

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
