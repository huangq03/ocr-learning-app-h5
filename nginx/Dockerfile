FROM nginx:alpine

RUN apk --no-cache add gettext

COPY nginx.conf /etc/nginx/nginx.conf
COPY substitute.sh /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/substitute.sh
