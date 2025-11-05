# Docker Network Issue Fix

## Problem

Docker is trying to use a proxy at `192.168.65.1:3128` but can't connect, causing image pull timeouts:

```
Error: proxyconnect tcp: dial tcp 192.168.65.1:3128: i/o timeout
```

## Quick Solutions

### Option 1: Use Minimal Docker Compose (Recommended for Now)

Start with just the essential databases:

```bash
# Use minimal compose file
docker compose -f docker-compose.minimal.yml up -d

# Check what's running
docker ps
```

This starts only:
- PostgreSQL (port 5432)
- Redis (port 6379)
- MongoDB (port 27017)

You can add other services later when network is fixed.

### Option 2: Disable Docker Proxy

1. **Open Docker Desktop**
2. **Go to Settings (⚙️)**
3. **Click on "Resources" → "Proxies"**
4. **Uncheck "Manual proxy configuration"** or set it to "No proxy"
5. **Click "Apply & Restart"**

Then try again:
```bash
make docker-up
```

### Option 3: Configure Proxy Correctly

If you need a proxy, configure it properly:

1. **Open Docker Desktop → Settings → Resources → Proxies**
2. **Enable "Manual proxy configuration"**
3. **Set your actual proxy server** (if you have one)
   - HTTP Proxy: `http://your-proxy:port`
   - HTTPS Proxy: `https://your-proxy:port`
4. **Or use "System proxy"** instead of manual

### Option 4: Clear Docker Registry Mirror

1. **Open Docker Desktop → Settings → Docker Engine**
2. **Remove any `registry-mirrors` configuration**
3. **Click "Apply & Restart"**

### Option 5: Check VPN/Firewall

If you're on VPN or have firewall software:

1. **Temporarily disable VPN**
2. **Try pulling images**:
   ```bash
   docker pull postgres:15-alpine
   docker pull redis:7-alpine
   docker pull kong:3.4
   ```
3. **If successful, re-enable VPN and try `make docker-up`**

## Immediate Workaround

Use the minimal setup for now:

```bash
# Stop any running containers
docker compose down

# Start minimal infrastructure
docker compose -f docker-compose.minimal.yml up -d

# Wait for services to be ready
sleep 10

# Check status
docker ps

# Run migrations
make db-migrate
```

## For Development Without Full Infrastructure

You can develop with just PostgreSQL, Redis, and MongoDB for now:

```bash
# 1. Start minimal infrastructure
docker compose -f docker-compose.minimal.yml up -d

# 2. Edit .env to disable services you don't need yet
# Comment out Kong, RabbitMQ, MinIO, etc.

# 3. Start your service manually
cd services/content-service
go run cmd/main.go
```

## Update Makefile to Use Minimal Compose

Temporarily edit the Makefile:

```makefile
# Change this line:
DOCKER_COMPOSE := docker compose

# To:
DOCKER_COMPOSE := docker compose -f docker-compose.minimal.yml
```

Or create a new make target:

```bash
make docker-up-minimal
```

## Checking Docker Network Configuration

```bash
# Check Docker daemon settings
docker info | grep Proxy

# Check if Docker can reach the internet
docker run --rm alpine ping -c 3 google.com

# Check DNS
docker run --rm alpine nslookup google.com

# Pull a small image to test
docker pull alpine:latest
```

## Long-term Solution

Once you fix the network issue, you can:

1. **Pull all images manually first**:
   ```bash
   docker pull postgres:15-alpine
   docker pull redis:7-alpine
   docker pull mongo:7
   docker pull kong:3.4
   docker pull rabbitmq:3-management-alpine
   docker pull elasticsearch:8.11.0
   docker pull minio/minio:latest
   docker pull influxdb:2.7-alpine
   docker pull prom/prometheus:latest
   docker pull grafana/grafana:latest
   ```

2. **Then start compose**:
   ```bash
   make docker-up
   ```

## Current Recommendation

**Use minimal compose for now:**

```bash
# Stop everything
docker compose down

# Start minimal
docker compose -f docker-compose.minimal.yml up -d

# Verify
docker ps

# Continue development
```

You can add Kong, RabbitMQ, MinIO, etc. later when the network issue is resolved.

---

**Need help?** The minimal setup has everything you need for basic development:
- PostgreSQL for data storage
- Redis for caching
- MongoDB for flexible data

Add other services as needed!
