#!/bin/bash
# Sincroniza backend + certs MQTT a la VM Oracle y reinicia servicios.
# Uso: ./scripts/deploy-vm.sh

set -e

VM_IP="${VM_IP:-163.176.32.93}"
SSH_KEY="${SSH_KEY:-$HOME/Descargas/ssh-key-2026-06-28.key}"
SSH_USER="${SSH_USER:-ubuntu}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Subiendo backend a ${VM_IP}..."
rsync -avz --exclude 'node_modules' --exclude '.env' \
  -e "ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no" \
  "${ROOT}/" "${SSH_USER}@${VM_IP}:~/backend/"

echo "==> Subiendo certs Mosquitto..."
rsync -avz \
  -e "ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no" \
  "${ROOT}/../sistema_embebido/ca.crt" \
  "${ROOT}/../sistema_embebido/server.crt" \
  "${ROOT}/../sistema_embebido/server.key" \
  "${ROOT}/ca.crt" "${ROOT}/client.crt" "${ROOT}/client.key" \
  "${SSH_USER}@${VM_IP}:~/mqtt-certs/"

ssh -i "${SSH_KEY}" "${SSH_USER}@${VM_IP}" bash -s <<REMOTE
set -e
# Mosquitto TLS (mismos certs que el ESP32)
sudo cp ~/mqtt-certs/ca.crt ~/mqtt-certs/server.crt ~/mqtt-certs/server.key /etc/mosquitto/certs/
sudo chown mosquitto:mosquitto /etc/mosquitto/certs/*
sudo chmod 600 /etc/mosquitto/certs/server.key
sudo systemctl restart mosquitto

# Backend certs MQTT
cp ~/mqtt-certs/ca.crt ~/mqtt-certs/client.crt ~/mqtt-certs/client.key ~/backend/

cd ~/backend
chmod +x scripts/crea_certs_api.sh 2>/dev/null || true
./scripts/crea_certs_api.sh ${VM_IP}

grep -q '^API_SSL_ENABLED=' .env || echo 'API_SSL_ENABLED=true' >> .env
sed -i 's/^API_SSL_ENABLED=.*/API_SSL_ENABLED=true/' .env
sed -i 's/^API_HOST=.*/API_HOST=0.0.0.0/' .env
sed -i 's/^MQTT_HOST=.*/MQTT_HOST=localhost/' .env
sed -i 's|^ROUTER_PATH=.*|ROUTER_PATH=/home/ubuntu/backend/routers|' .env
grep -q '^DB_MONGO_NAME=' .env || echo 'DB_MONGO_NAME=test' >> .env

npm install --omit=dev
pm2 restart backend || pm2 start index.js --name backend
pm2 save

echo "=== Estado ==="
sudo systemctl is-active mosquitto
pm2 status
curl -sk -o /dev/null -w "API HTTPS: %{http_code}\n" https://127.0.0.1:3000/prueba/status
REMOTE

echo "==> Listo. ESP32: mqtts://${VM_IP}:8883 | Vercel: proxy /prueba"
