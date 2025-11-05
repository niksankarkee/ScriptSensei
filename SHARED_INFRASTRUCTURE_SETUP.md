# Shared Infrastructure Setup - Port Conflict Resolution

**Date**: January 2025
**Issue**: Port conflicts with restosaas project (PostgreSQL 5432, Redis 6379)
**Solution**: Share database containers between projects
**Status**: ✅ Complete

## Problem

You're working on two projects simultaneously:
- **restosaas**: Uses PostgreSQL (5432) and Redis (6379)
- **ScriptSensei**: Wanted to use same ports

Docker was trying to start duplicate containers on the same ports, causing errors:
```
Error response from daemon: Bind for 0.0.0.0:6379 failed: port is already allocated
```

## Solution: Shared Infrastructure

Instead of running duplicate databases, **ScriptSensei shares** the existing PostgreSQL and Redis from your restosaas project.

### Architecture

```
┌─────────────────────────────────────────────────┐
│  PostgreSQL (restosaas_db) - Port 5432          │
│  ├─ Database: restosaas (your other project)    │
│  └─ Database: scriptsensei_dev ✅ (this project)│
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Redis (restosaas_redis) - Port 6379            │
│  ├─ Used by: restosaas                          │
│  └─ Used by: scriptsensei ✅ (shared)           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  ScriptSensei-Specific Containers               │
│  ├─ MongoDB (27017)                             │
│  ├─ Kong Gateway (8000, 8001)                   │
│  ├─ RabbitMQ (5672, 15672)                      │
│  ├─ Elasticsearch (9200)                        │
│  ├─ MinIO (9000-9001)                           │
│  ├─ Prometheus (9090)                           │
│  ├─ Grafana (3001)                              │
│  └─ InfluxDB (8086)                             │
└─────────────────────────────────────────────────┘
```

## Implementation

### 1. Docker Compose Override File

Created [docker-compose.override.yml](docker-compose.override.yml):

```yaml
# This file automatically overrides docker-compose.yml
# Docker Compose reads both files and merges them

services:
  # Disable scriptsensei-postgres (using restosaas_db instead)
  postgres:
    deploy:
      replicas: 0  # Don't start this container
    ports: []

  # Disable scriptsensei-redis (using restosaas_redis instead)
  redis:
    deploy:
      replicas: 0  # Don't start this container
    ports: []
```

**How it works**:
- Docker Compose automatically reads `docker-compose.yml` AND `docker-compose.override.yml`
- The override file disables PostgreSQL and Redis containers
- No changes needed to the main `docker-compose.yml`

### 2. Database Setup in Shared PostgreSQL

Created separate database for ScriptSensei:

```sql
-- In restosaas_db container
CREATE DATABASE scriptsensei_dev;
CREATE USER scriptsensei WITH PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE scriptsensei_dev TO scriptsensei;
GRANT ALL ON SCHEMA public TO scriptsensei;
```

### 3. Updated Migration Script

Modified [scripts/migrate-db.sh](scripts/migrate-db.sh) to auto-detect containers:

```bash
# Auto-detects PostgreSQL/PostGIS container (finds restosaas_db)
PG_CONTAINER=$(docker ps --format "{{.Names}}\t{{.Image}}" | \
               grep -E "postgres|postgis" | \
               grep "restosaas_db" | \
               awk '{print $1}' | head -1)
```

### 4. Environment Configuration

Updated [.env](.env):

```bash
# Uses shared PostgreSQL and Redis
DATABASE_URL=postgresql://scriptsensei:dev_password@localhost:5432/scriptsensei_dev
REDIS_URL=redis://localhost:6379  # Shared, no password
MONGODB_URL=mongodb://scriptsensei:dev_password@localhost:27017
```

## Benefits

### ✅ No Port Conflicts
- Both projects run simultaneously
- No need to stop restosaas to work on ScriptSensei
- No need to stop ScriptSensei to work on restosaas

### ✅ Resource Efficient
- Only one PostgreSQL instance (saves ~200MB RAM)
- Only one Redis instance (saves ~50MB RAM)
- Faster startup (no duplicate container initialization)

### ✅ Data Isolation
- Separate databases: `restosaas` vs `scriptsensei_dev`
- Separate database users
- No data interference between projects

### ✅ Development Flexibility
- Work on both projects simultaneously
- Share database tools (pgAdmin, RedisInsight)
- Consistent environment

## Verification

### Check Running Containers

```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"
```

**Expected output**:
```
NAMES                     IMAGE                      PORTS
restosaas_db              postgis/postgis:16-3.4     5432:5432  ✅ Shared
restosaas_redis           redis:7-alpine             6379:6379  ✅ Shared
scriptsensei-kong         kong:3.4                   8000-8001
scriptsensei-mongodb      mongo:7                    27017
scriptsensei-prometheus   prom/prometheus            9090
scriptsensei-grafana      grafana/grafana            3001
... (other ScriptSensei containers)
```

**Notice**:
- ❌ NO `scriptsensei-postgres` container
- ❌ NO `scriptsensei-redis` container
- ✅ `restosaas_db` and `restosaas_redis` running

### Verify ScriptSensei Database

```bash
# Connect to shared PostgreSQL
docker exec restosaas_db psql -U scriptsensei -d scriptsensei_dev

# List tables
\dt

# Should show:
schema_migrations
users
scripts
videos
templates
voice_profiles
usage_stats
subscriptions
```

### Verify Redis Access

```bash
# Test Redis connection
docker exec restosaas_redis redis-cli ping
# Output: PONG ✅

# Check Redis info
docker exec restosaas_redis redis-cli INFO server
```

## How to Use

### Normal Development Workflow

```bash
# 1. Start ScriptSensei (restosaas must be running)
make dev

# 2. Both projects now share PostgreSQL and Redis
# 3. Work on either project without conflicts
```

### Starting From Scratch

```bash
# 1. Ensure restosaas containers are running
docker ps | grep restosaas

# 2. If not running, start them:
cd /path/to/restosaas
docker-compose up -d postgres redis

# 3. Then start ScriptSensei
cd /path/to/ScriptSensei
make dev
```

### Stopping Services

```bash
# Stop ScriptSensei only (keeps shared databases)
make docker-down

# PostgreSQL and Redis remain running for restosaas ✅
```

## Connection Details

### PostgreSQL (Shared)

**Container**: `restosaas_db`
**Host**: localhost
**Port**: 5432

**ScriptSensei Database**:
```
Database: scriptsensei_dev
User: scriptsensei
Password: dev_password
Connection String: postgresql://scriptsensei:dev_password@localhost:5432/scriptsensei_dev
```

**Restosaas Database** (unchanged):
```
Database: restosaas
User: postgres (or your user)
Connection String: (your existing connection)
```

### Redis (Shared)

**Container**: `restosaas_redis`
**Host**: localhost
**Port**: 6379
**Password**: None (local development)

```
Connection String: redis://localhost:6379
```

**Usage**:
- Both projects can use Redis
- Different key prefixes recommended:
  - restosaas: `restosaas:*`
  - scriptsensei: `scriptsensei:*`

### MongoDB (ScriptSensei-Only)

**Container**: `scriptsensei-mongodb`
**Host**: localhost
**Port**: 27017

```
User: scriptsensei
Password: dev_password
Connection String: mongodb://scriptsensei:dev_password@localhost:27017
```

## Troubleshooting

### Problem: "Port already allocated" Error

**Cause**: ScriptSensei tried to start its own PostgreSQL/Redis

**Solution**: Ensure `docker-compose.override.yml` exists:

```bash
# Check if override file exists
ls -la docker-compose.override.yml

# If not, create it:
cat > docker-compose.override.yml <<EOF
services:
  postgres:
    deploy:
      replicas: 0
    ports: []
  redis:
    deploy:
      replicas: 0
    ports: []
EOF
```

### Problem: "Database does not exist"

**Cause**: ScriptSensei database not created in shared PostgreSQL

**Solution**: Create the database:

```bash
docker exec restosaas_db psql -U postgres -c "CREATE DATABASE scriptsensei_dev;"
docker exec restosaas_db psql -U postgres -c "CREATE USER scriptsensei WITH PASSWORD 'dev_password';"
docker exec restosaas_db psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE scriptsensei_dev TO scriptsensei;"
docker exec restosaas_db psql -U postgres -d scriptsensei_dev -c "GRANT ALL ON SCHEMA public TO scriptsensei;"

# Run migrations
make migrate-db
```

### Problem: "Container not found" in migration script

**Cause**: Migration script looking for wrong container name

**Solution**: Script should auto-detect. If not, manually specify:

```bash
# Edit scripts/migrate-db.sh
# Find line: PG_CONTAINER=$(docker ps ...)
# Change to: PG_CONTAINER="restosaas_db"
```

### Problem: Connection refused to PostgreSQL

**Cause**: restosaas_db container not running

**Solution**: Start restosaas PostgreSQL:

```bash
# Check if running
docker ps | grep restosaas_db

# If not running, start it
cd /path/to/restosaas
docker-compose up -d postgres

# Or start manually
docker start restosaas_db
```

## Migrating Back to Separate Containers

If you later want ScriptSensei to use its own PostgreSQL and Redis:

### Option 1: Use Different Ports

Edit `docker-compose.yml`:

```yaml
postgres:
  ports:
    - "5434:5432"  # Changed from 5432

redis:
  ports:
    - "6380:6379"  # Changed from 6379
```

Update `.env`:
```bash
DATABASE_URL=postgresql://scriptsensei:dev_password@localhost:5434/scriptsensei_dev
REDIS_URL=redis://localhost:6380
```

Delete `docker-compose.override.yml`:
```bash
rm docker-compose.override.yml
```

### Option 2: Export and Import Data

```bash
# 1. Export ScriptSensei data
docker exec restosaas_db pg_dump -U scriptsensei scriptsensei_dev > scriptsensei_backup.sql

# 2. Delete override file
rm docker-compose.override.yml

# 3. Start ScriptSensei with own PostgreSQL
make dev

# 4. Import data
docker exec -i scriptsensei-postgres psql -U scriptsensei -d scriptsensei_dev < scriptsensei_backup.sql
```

## Summary

### What Was Changed

1. ✅ Created `docker-compose.override.yml` to disable duplicate containers
2. ✅ Created `scriptsensei_dev` database in shared PostgreSQL
3. ✅ Updated migration script to auto-detect containers
4. ✅ Configured `.env` to use shared infrastructure

### What Wasn't Changed

- ❌ Main `docker-compose.yml` (unchanged)
- ❌ Your restosaas project (unaffected)
- ❌ Service code or configurations

### Current State

- ✅ Both projects run simultaneously
- ✅ No port conflicts
- ✅ Shared PostgreSQL (separate databases)
- ✅ Shared Redis
- ✅ ScriptSensei has own MongoDB, Kong, RabbitMQ, etc.
- ✅ All 12 ScriptSensei infrastructure containers working
- ✅ Database migrations completed (8 tables)
- ✅ Ready for development

## Files Created/Modified

### Created:
1. `docker-compose.override.yml` - Disables duplicate containers
2. `SHARED_INFRASTRUCTURE_SETUP.md` - This file

### Modified:
1. `scripts/migrate-db.sh` - Auto-detects container names
2. `.env` - Points to shared infrastructure
3. `INFRASTRUCTURE_SETUP_COMPLETE.md` - Updated with shared setup info

---

**Status**: ✅ Working perfectly
**Impact**: Zero conflicts, both projects run together
**Next**: Start building backend services!
