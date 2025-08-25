#!/bin/bash

if [ ! -e "./data/certbot/conf/options-ssl-nginx.conf" ] || [ ! -e "./data/certbot/conf/ssl-dhparams.pem" ]; then
  echo "### Downloading recommended TLS parameters ..."
  mkdir -p ./data/certbot/conf
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > ./data/certbot/conf/options-ssl-nginx.conf
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > ./data/certbot/conf/ssl-dhparams.pem
  echo
fi
