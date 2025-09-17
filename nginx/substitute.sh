#!/bin/sh
set -e
envsubst '$DOMAIN_NAME' < /etc/nginx/templates/ocr_server.conf > /etc/nginx/conf.d/ocr_server.conf
