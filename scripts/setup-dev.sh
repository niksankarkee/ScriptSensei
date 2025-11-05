#!/bin/bash

# ScriptSensei Global - Development Environment Setup Script
# This script sets up the complete local development environment

set -e

echo "🚀 ScriptSensei Global - Development Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker is required but not installed.${NC}" >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}❌ Docker Compose is required but not installed.${NC}" >&2; exit 1; }
command -v go >/dev/null 2>&1 || { echo -e "${RED}❌ Go 1.21+ is required but not installed.${NC}" >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo -e "${RED}❌ Node.js 20+ is required but not installed.${NC}" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo -e "${RED}❌ Python 3.11+ is required but not installed.${NC}" >&2; exit 1; }

echo -e "${GREEN}✅ All prerequisites installed${NC}"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env file with your API keys before proceeding${NC}"
    echo -e "${YELLOW}   Press Enter to continue after editing .env...${NC}"
    read -r
fi

# Start infrastructure services
echo "🐳 Starting infrastructure services with Docker Compose..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check PostgreSQL
echo "🔍 Checking PostgreSQL..."
until docker exec scriptsensei-postgres pg_isready -U scriptsensei > /dev/null 2>&1; do
    echo "  Waiting for PostgreSQL..."
    sleep 2
done
echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

# Check Redis
echo "🔍 Checking Redis..."
until docker exec scriptsensei-redis redis-cli ping > /dev/null 2>&1; do
    echo "  Waiting for Redis..."
    sleep 2
done
echo -e "${GREEN}✅ Redis is ready${NC}"

# Check MongoDB
echo "🔍 Checking MongoDB..."
until docker exec scriptsensei-mongodb mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; do
    echo "  Waiting for MongoDB..."
    sleep 2
done
echo -e "${GREEN}✅ MongoDB is ready${NC}"

# Check RabbitMQ
echo "🔍 Checking RabbitMQ..."
until docker exec scriptsensei-rabbitmq rabbitmq-diagnostics -q ping > /dev/null 2>&1; do
    echo "  Waiting for RabbitMQ..."
    sleep 2
done
echo -e "${GREEN}✅ RabbitMQ is ready${NC}"

# Run database migrations
echo "🗄️  Running database migrations..."
./scripts/migrate-db.sh

# Initialize Go services
echo "🔧 Setting up Go services..."
for service in auth-service content-service voice-service analytics-service; do
    echo "  Installing dependencies for $service..."
    cd services/$service
    go mod download
    cd ../..
done

# Initialize Python services
echo "🐍 Setting up Python services..."
for service in video-processing-service trend-service; do
    echo "  Creating virtual environment for $service..."
    cd services/$service
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
    cd ../..
done

# Initialize Node.js services
echo "📦 Setting up Node.js services..."
cd services/translation-service
npm install
cd ../..

# Initialize Frontend
echo "⚛️  Setting up Frontend..."
cd frontend
npm install
cd ..

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Development environment setup complete!${NC}"
echo "=========================================="
echo ""
echo "📊 Infrastructure Services:"
echo "   - PostgreSQL:     localhost:5432"
echo "   - Redis:          localhost:6379"
echo "   - MongoDB:        localhost:27017"
echo "   - RabbitMQ:       localhost:5672 (Management: localhost:15672)"
echo "   - Elasticsearch:  localhost:9200"
echo "   - MinIO:          localhost:9000 (Console: localhost:9001)"
echo "   - Prometheus:     localhost:9090"
echo "   - Grafana:        localhost:3001"
echo ""
echo "🚀 To start the services:"
echo "   1. Start backend services: ./scripts/start-services.sh"
echo "   2. Start frontend: cd frontend && npm run dev"
echo ""
echo "📝 Default credentials:"
echo "   - Database: scriptsensei / dev_password"
echo "   - Redis: (no password in dev)"
echo "   - RabbitMQ: scriptsensei / dev_password"
echo "   - MinIO: scriptsensei / dev_password"
echo "   - Grafana: admin / dev_password"
echo ""
echo "📚 Documentation: ./docs/"
echo "🆘 Need help? Check README.md"
echo ""
