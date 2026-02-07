#!/bin/sh
set -e

# Default backend URL if not provided
BACKEND_URL=${BACKEND_URL:-backend}

echo "Configuring nginx with BACKEND_URL=${BACKEND_URL}"

# Pure shell substitution (no envsubst needed)
sed "s|\${BACKEND_URL}|${BACKEND_URL}|g" \
    /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Test nginx configuration
nginx -t

# Start nginx
exec nginx -g 'daemon off;'