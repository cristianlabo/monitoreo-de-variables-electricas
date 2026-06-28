# 2022-Daiot-Mongo-Node-MQTT

Backend de ejemplo para aplicación IoT con Mongo + Node + MQTT.

## Instalación

1. `cp .env.example .env`
2. Copiar certificados MQTT desde el script de embebidos (`ca.crt`, `client.crt`, `client.key`)
3. `npm install`
4. `npm run dev`

## HTTPS con certificado autofirmado (Oracle Cloud)

Para que el frontend en Vercel (HTTPS) pueda llamar al API sin mixed content:

### 1. Generar certificados en la VM

```bash
cd backend
chmod +x scripts/crea_certs_api.sh
./scripts/crea_certs_api.sh 163.176.32.93
```

### 2. Activar SSL en `.env` de la VM

```env
API_HOST=0.0.0.0
API_PORT=3000
API_SSL_ENABLED=true
API_SSL_KEY_PATH=./certs/api-server.key
API_SSL_CERT_PATH=./certs/api-server.crt
CORS_ORIGINS=https://tu-app.vercel.app,http://localhost:3001
```

### 3. Abrir puerto 3000 en Oracle Cloud Security Group

### 4. Reiniciar el backend

```bash
node index.js
# API Funcionando... en: https://0.0.0.0:3000
```

## Nota sobre certificados autofirmados

El navegador **no confía** en certificados autofirmados para llamadas desde otro dominio (ej. Vercel). Si el front sigue fallando con error de certificado, opciones:

- Usar un dominio con **Let's Encrypt** (certificado válido)
- Mantener el **proxy de Vercel** (`next.config.js` rewrites) que evita el problema en el navegador

El certificado autofirmado sí elimina el error de **mixed content** (HTTP vs HTTPS).
