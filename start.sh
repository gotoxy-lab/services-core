#!/bin/sh

echo 'preparing envstub'
envsubst '$$PORT $$PROTO_SCHEMA $$PAYMENT_SERVICE_API_SERVER $$PROJECT_SERVICE_API_SERVER $$COMMUNITY_SERVICE_API_SERVER $$ANALYTICS_SERVICE_API_SERVER $$NOTIFICATION_SERVICE_API_SERVER $$CATARSE_MOMENT_SERVICE_API_SERVER $$RECOMMENDER_SERVICE_API_SERVER' < /etc/nginx/conf.d/proxy.template > /etc/nginx/conf.d/default.conf
echo 'done'

openresty -g 'daemon off;'
