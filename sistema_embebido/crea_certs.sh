#!/bin/bash

# -- Set local IP --
IP="163.176.32.93"

SUBJECT_CA="/C=AR/ST=CABA/L=CABA/O=FiUBA/OU=CA/CN=$IP"
SUBJECT_SERVER="/C=AR/ST=CABA/L=CABA/O=FiUBA/OU=Server/CN=$IP"
SUBJECT_CLIENT="/C=AR/ST=CABA/L=CABA/O=FiUBA/OU=Client/CN=$IP"


function generate_CA () {
   echo "$SUBJECT_CA"
   openssl req -x509 -nodes -sha256 -newkey rsa:2048 -subj "$SUBJECT_CA"  -days 365 -keyout ca.key -out ca.crt
}

function generate_server () {
   echo "$SUBJECT_SERVER"
   openssl req -nodes -sha256 -new -subj "$SUBJECT_SERVER" -keyout server.key -out server.csr
   openssl x509 -req -sha256 -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 365
}

function generate_client () {
   echo "$SUBJECT_CLIENT"
   openssl req -new -nodes -sha256 -subj "$SUBJECT_CLIENT" -out client.csr -keyout client.key 
   openssl x509 -req -sha256 -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out client.crt -days 365
}

function copy_keys_to_broker () {
   #broker mosquitto
   cp ca.crt /etc/mosquitto/certs
   cp server.crt /etc/mosquitto/certs
   cp server.key /etc/mosquitto/certs
   #backed
   cp ca.crt /home/cristian/DDA3/TPFINAL/backend
   cp client.crt /home/cristian/DDA3/TPFINAL/backend
   cp client.key /home/cristian/DDA3/TPFINAL/backend
   #esp32
   cp ca.crt ./main/broker_CA.crt
   cp client.crt ./main
   cp client.key ./main
   #reinciamos mosquitto
   systemctl restart mosquitto
}


generate_CA
generate_server
generate_client
copy_keys_to_broker
