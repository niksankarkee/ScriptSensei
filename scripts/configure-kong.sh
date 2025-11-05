#!/bin/bash

# Kong API Gateway Configuration Script
# This script configures Kong routes and services for ScriptSensei microservices

set -e

echo "🔧 Configuring Kong API Gateway..."

KONG_ADMIN_URL="${KONG_ADMIN_URL:-http://localhost:8001}"

# Wait for Kong to be ready
echo "⏳ Waiting for Kong to be ready..."
until curl -s "${KONG_ADMIN_URL}" > /dev/null; do
    echo "  Waiting for Kong Admin API..."
    sleep 2
done
echo "✅ Kong is ready!"

# ===================================
# Configure Services and Routes
# ===================================

echo ""
echo "📝 Creating Services and Routes..."

# 1. Content Service
echo "  - Content Service"
curl -i -X POST "${KONG_ADMIN_URL}/services" \
  --data "name=content-service" \
  --data "url=http://host.docker.internal:8011"

curl -i -X POST "${KONG_ADMIN_URL}/services/content-service/routes" \
  --data "name=content-route" \
  --data "paths[]=/api/v1/scripts" \
  --data "paths[]=/api/v1/templates" \
  --data "paths[]=/api/v1/content"

# 2. Video Processing Service
echo "  - Video Processing Service"
curl -i -X POST "${KONG_ADMIN_URL}/services" \
  --data "name=video-service" \
  --data "url=http://host.docker.internal:8012"

curl -i -X POST "${KONG_ADMIN_URL}/services/video-service/routes" \
  --data "name=video-route" \
  --data "paths[]=/api/v1/videos" \
  --data "paths[]=/api/v1/render"

# 3. Voice Service
echo "  - Voice Service"
curl -i -X POST "${KONG_ADMIN_URL}/services" \
  --data "name=voice-service" \
  --data "url=http://host.docker.internal:8013"

curl -i -X POST "${KONG_ADMIN_URL}/services/voice-service/routes" \
  --data "name=voice-route" \
  --data "paths[]=/api/v1/voices" \
  --data "paths[]=/api/v1/tts" \
  --data "paths[]=/api/v1/voice-cloning"

# 4. Translation Service
echo "  - Translation Service"
curl -i -X POST "${KONG_ADMIN_URL}/services" \
  --data "name=translation-service" \
  --data "url=http://host.docker.internal:8014"

curl -i -X POST "${KONG_ADMIN_URL}/services/translation-service/routes" \
  --data "name=translation-route" \
  --data "paths[]=/api/v1/translate" \
  --data "paths[]=/api/v1/languages"

# 5. Analytics Service
echo "  - Analytics Service"
curl -i -X POST "${KONG_ADMIN_URL}/services" \
  --data "name=analytics-service" \
  --data "url=http://host.docker.internal:8015"

curl -i -X POST "${KONG_ADMIN_URL}/services/analytics-service/routes" \
  --data "name=analytics-route" \
  --data "paths[]=/api/v1/analytics" \
  --data "paths[]=/api/v1/usage" \
  --data "paths[]=/api/v1/metrics"

# 6. Trend Service
echo "  - Trend Service"
curl -i -X POST "${KONG_ADMIN_URL}/services" \
  --data "name=trend-service" \
  --data "url=http://host.docker.internal:8016"

curl -i -X POST "${KONG_ADMIN_URL}/services/trend-service/routes" \
  --data "name=trend-route" \
  --data "paths[]=/api/v1/trends"

# ===================================
# Configure Plugins
# ===================================

echo ""
echo "🔌 Configuring Kong Plugins..."

# 1. CORS Plugin (Global)
echo "  - CORS Plugin"
curl -i -X POST "${KONG_ADMIN_URL}/plugins" \
  --data "name=cors" \
  --data "config.origins=http://localhost:3000" \
  --data "config.methods=GET,POST,PUT,DELETE,OPTIONS" \
  --data "config.headers=Accept,Authorization,Content-Type,X-Request-Id" \
  --data "config.exposed_headers=X-Request-Id" \
  --data "config.credentials=true" \
  --data "config.max_age=3600"

# 2. Rate Limiting Plugin (Global)
echo "  - Rate Limiting Plugin"
curl -i -X POST "${KONG_ADMIN_URL}/plugins" \
  --data "name=rate-limiting" \
  --data "config.minute=100" \
  --data "config.hour=1000" \
  --data "config.policy=local"

# 3. Request Size Limiting
echo "  - Request Size Limiting Plugin"
curl -i -X POST "${KONG_ADMIN_URL}/plugins" \
  --data "name=request-size-limiting" \
  --data "config.allowed_payload_size=100"

# 4. Request/Response Logging
echo "  - HTTP Log Plugin"
curl -i -X POST "${KONG_ADMIN_URL}/plugins" \
  --data "name=file-log" \
  --data "config.path=/tmp/kong-logs.json"

# 5. Prometheus Metrics
echo "  - Prometheus Plugin"
curl -i -X POST "${KONG_ADMIN_URL}/plugins" \
  --data "name=prometheus"

# 6. JWT Authentication (will be configured per route)
echo "  - JWT Plugin (configured per service)"
# Note: JWT will be added to individual services that need authentication

# ===================================
# Configure Clerk JWT Authentication
# ===================================

echo ""
echo "🔐 Configuring Clerk JWT Authentication..."

# Add JWT plugin to protected routes
for service in content-service video-service voice-service translation-service analytics-service; do
  echo "  - Adding JWT to ${service}"
  curl -i -X POST "${KONG_ADMIN_URL}/services/${service}/plugins" \
    --data "name=jwt" \
    --data "config.claims_to_verify=exp"
done

# ===================================
# Health Check Route
# ===================================

echo ""
echo "❤️  Configuring Health Check Route..."

curl -i -X POST "${KONG_ADMIN_URL}/services" \
  --data "name=kong-health" \
  --data "url=http://localhost:8001"

curl -i -X POST "${KONG_ADMIN_URL}/services/kong-health/routes" \
  --data "name=health-route" \
  --data "paths[]=/health"

echo ""
echo "=========================================="
echo "✅ Kong API Gateway configured successfully!"
echo "=========================================="
echo ""
echo "📊 Gateway Information:"
echo "   - Proxy URL: http://localhost:8000"
echo "   - Admin API: http://localhost:8001"
echo ""
echo "🔗 Service Routes:"
echo "   - Content:     http://localhost:8000/api/v1/scripts"
echo "   - Videos:      http://localhost:8000/api/v1/videos"
echo "   - Voices:      http://localhost:8000/api/v1/voices"
echo "   - Translation: http://localhost:8000/api/v1/translate"
echo "   - Analytics:   http://localhost:8000/api/v1/analytics"
echo "   - Trends:      http://localhost:8000/api/v1/trends"
echo ""
echo "🔍 Test the gateway:"
echo "   curl http://localhost:8000/health"
echo ""
echo "📖 View all services:"
echo "   curl http://localhost:8001/services"
echo ""
echo "📖 View all routes:"
echo "   curl http://localhost:8001/routes"
echo ""
