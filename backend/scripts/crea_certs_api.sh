#!/bin/bash
# Genera certificado autofirmado para HTTPS del API REST.
# Uso: ./scripts/crea_certs_api.sh [IP_O_HOST]
# Ejemplo en Oracle Cloud: ./scripts/crea_certs_api.sh 163.176.32.93

set -e

IP="${1:-163.176.32.93}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CERTS_DIR="$(dirname "$SCRIPT_DIR")/certs"
SUBJECT="/C=AR/ST=CABA/L=CABA/O=IoT/OU=API/CN=${IP}"

mkdir -p "$CERTS_DIR"

echo "Generando certificado autofirmado para CN=${IP}..."
openssl req -x509 -nodes -sha256 -newkey rsa:2048 \
  -subj "$SUBJECT" -days 365 \
  -keyout "$CERTS_DIR/api-server.key" \
  -out "$CERTS_DIR/api-server.crt"

chmod 600 "$CERTS_DIR/api-server.key"
chmod 644 "$CERTS_DIR/api-server.crt"

echo ""
echo "Certificados creados en:"
echo "  $CERTS_DIR/api-server.key"
echo "  $CERTS_DIR/api-server.crt"
echo ""
echo "Activar en .env de la VM:"
echo "  API_SSL_ENABLED=true"
echo "  API_HOST=0.0.0.0"
echo "  API_PORT=3000"
