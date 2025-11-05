# Database Setup Clarification

## Question: Do I need to run `make dev`? Are there two databases?

**Short Answer**: YES, there are TWO separate PostgreSQL databases, and YES you should run `make dev` to start ScriptSensei's own database.

---

## The Two PostgreSQL Instances

### 1. Your Existing Infrastructure (`restosaas_db`)
```
Container: restosaas_db
Image: postgres:16
Port: 5432
Project: RestosaasDB (different project)
Status: ✅ Currently Running
Purpose: For your other application
```

### 2. ScriptSensei's PostgreSQL (`scriptsensei-postgres`)
```
Container: scriptsensei-postgres
Image: postgres:15-alpine
Port: 5433 (CHANGED to avoid conflict)
Project: ScriptSensei
Status: ❌ Not running (need to start with make dev)
Purpose: For ScriptSensei application ONLY
```

## They Are NOT the Same!

❌ **NOT sharing data**
❌ **NOT the same container**
❌ **NOT the same database**
✅ **Completely separate projects**

---

## What Was Fixed

### Port Conflict Resolution

**Before**:
```yaml
# docker-compose.yml
postgres:
  ports:
    - "5432:5432"  # ❌ CONFLICT with restosaas_db!
```

```bash
# .env
DATABASE_URL=postgresql://scriptsensei:dev_password@localhost:5432/scriptsensei_dev
```

**After**:
```yaml
# docker-compose.yml
postgres:
  ports:
    - "5433:5432"  # ✅ No conflict - ScriptSensei uses 5433
```

```bash
# .env
DATABASE_URL=postgresql://scriptsensei:dev_password@localhost:5433/scriptsensei_dev
```

---

## How to Use ScriptSensei Database

### Step 1: Start ScriptSensei Infrastructure

```bash
make dev
```

This will start:
- ✅ `scriptsensei-postgres` on port **5433**
- ✅ `scriptsensei-redis` on port 6379
- ✅ `scriptsensei-mongodb` on port 27017
- ✅ Kong API Gateway on port 8000
- ✅ Plus all other ScriptSensei services

**Your existing `restosaas_db` will keep running** on port 5432 without any conflict!

### Step 2: Start Services

```bash
# Start auth service
make start-auth-service

# Start content service
make start-content-service

# Start frontend
make frontend-dev
```

### Step 3: Verify

```bash
# Check both databases are running
docker ps | grep postgres

# Expected output:
# restosaas_db        postgres:16         Up X minutes    0.0.0.0:5432->5432/tcp
# scriptsensei-postgres postgres:15-alpine  Up X minutes    0.0.0.0:5433->5432/tcp
```

---

## Port Assignments

### Your Existing Infrastructure
```
restosaas_db (PostgreSQL):     localhost:5432  ✅ Running
infra-pgadmin-1:                localhost:5050  ✅ Running
```

### ScriptSensei Infrastructure (after `make dev`)
```
scriptsensei-postgres:          localhost:5433  ⏳ Starts with make dev
scriptsensei-redis:             localhost:6379  ⏳ Starts with make dev
scriptsensei-mongodb:           localhost:27017 ⏳ Starts with make dev
scriptsensei-kong (Gateway):    localhost:8000  ⏳ Starts with make dev
scriptsensei-kong (Admin):      localhost:8001  ⏳ Starts with make dev
scriptsensei-rabbitmq:          localhost:5672  ⏳ Starts with make dev
scriptsensei-rabbitmq (UI):     localhost:15672 ⏳ Starts with make dev
scriptsensei-elasticsearch:     localhost:9200  ⏳ Starts with make dev
scriptsensei-minio:             localhost:9000  ⏳ Starts with make dev
scriptsensei-minio (Console):   localhost:9001  ⏳ Starts with make dev
scriptsensei-prometheus:        localhost:9090  ⏳ Starts with make dev
scriptsensei-grafana:           localhost:4001  ⏳ Starts with make dev
```

### ScriptSensei Services (after starting individually)
```
Auth Service:                   localhost:8001  ⏳ make start-auth-service
Content Service:                localhost:8011  ⏳ make start-content-service
Frontend:                       localhost:4000  ⏳ make frontend-dev
```

---

## Why You SHOULD Run `make dev`

### Benefits of Running `make dev`:

1. **Isolated Environment** ✅
   - ScriptSensei has its own database
   - No risk of mixing data with other projects
   - Clean separation of concerns

2. **Complete Infrastructure** ✅
   - PostgreSQL (on port 5433)
   - Redis (caching)
   - MongoDB (document storage)
   - Kong API Gateway (routing)
   - RabbitMQ (message queues)
   - Elasticsearch (search)
   - Monitoring (Prometheus + Grafana)

3. **No Conflicts** ✅
   - Runs on different port (5433 vs 5432)
   - Won't interfere with `restosaas_db`
   - Both can run simultaneously

4. **Production-Like Setup** ✅
   - Same setup you'll use in production
   - Tests work correctly
   - Database migrations work as expected

### What Happens if You DON'T Run `make dev`:

❌ No ScriptSensei database
❌ No Kong API Gateway
❌ No MongoDB, Redis, RabbitMQ
❌ Services will fail to connect to database
❌ Auth service will fail (needs Redis)

---

## Complete Workflow

### Full Development Setup:

```bash
# 1. Start ScriptSensei infrastructure (one time)
make dev

# 2. Start backend services
make start-auth-service      # Port 8001
make start-content-service   # Port 8011

# 3. In new terminal: Start frontend
make frontend-dev            # Port 4000
```

### Check Everything is Running:

```bash
# Check Docker containers
docker ps

# You should see BOTH:
# - restosaas_db (port 5432) - Your existing infrastructure
# - scriptsensei-postgres (port 5433) - ScriptSensei's database
# - Plus all other ScriptSensei containers

# Check service status
make status

# Check health
make health
```

### Access Applications:

```
Your Other App (using restosaas_db):
  Database: postgresql://...@localhost:5432/...

ScriptSensei:
  Frontend: http://localhost:4000
  API Gateway: http://localhost:8000
  Auth Service: http://localhost:8001
  Content Service: http://localhost:8011
  Database: postgresql://scriptsensei:dev_password@localhost:5433/scriptsensei_dev
```

---

## Database Connection Strings

### RestosaasDB (Your Existing Project)
```bash
postgresql://your_user:your_password@localhost:5432/your_database
```

### ScriptSensei (This Project)
```bash
postgresql://scriptsensei:dev_password@localhost:5433/scriptsensei_dev
```

**They are completely separate!**

---

## Common Scenarios

### Scenario 1: Working on ScriptSensei Only
```bash
# Start ScriptSensei infrastructure
make dev

# Start ScriptSensei services
make start-auth-service
make start-content-service
make frontend-dev
```

**Your `restosaas_db` keeps running** - no interference!

### Scenario 2: Working on Both Projects
```bash
# Both infrastructures can run simultaneously:

# RestosaasDB on port 5432
# ScriptSensei on port 5433

# No conflicts!
```

### Scenario 3: Shut Down ScriptSensei, Keep Other Running
```bash
# Stop ScriptSensei services
make stop-all

# Stop ScriptSensei infrastructure
make docker-down

# Your restosaas_db keeps running!
```

---

## Troubleshooting

### "Port 5432 already in use"
✅ **FIXED!** ScriptSensei now uses port 5433

### "Can't connect to database"
```bash
# Make sure ScriptSensei infrastructure is running
docker ps | grep scriptsensei-postgres

# If not running:
make dev
```

### "Kong keeps restarting"
```bash
# This is a separate issue with Kong configuration
# For now, you can use services directly without Kong
# Services work on their individual ports:
# - Auth: 8001
# - Content: 8011
```

### Verify Database Connection
```bash
# Test ScriptSensei database
docker exec -it scriptsensei-postgres psql -U scriptsensei -d scriptsensei_dev -c "SELECT version();"

# Test your other database
docker exec -it restosaas_db psql -U postgres -c "SELECT version();"
```

---

## Summary

### Answer to "Do I have two databases?"

**YES**, you have TWO PostgreSQL databases:

1. **`restosaas_db`** (port 5432) - For your other project ✅
2. **`scriptsensei-postgres`** (port 5433) - For ScriptSensei ✅

### Answer to "Do I need to run `make dev`?"

**YES**, you should run `make dev` to:
- ✅ Start ScriptSensei's own PostgreSQL on port 5433
- ✅ Start all other ScriptSensei infrastructure
- ✅ Keep everything isolated from your other projects

### Key Points:

- ✅ Both databases can run at the same time
- ✅ No port conflicts (5432 vs 5433)
- ✅ No data mixing
- ✅ Complete isolation between projects
- ✅ `make dev` is required for ScriptSensei to work properly

---

**Last Updated**: 2025-10-30
**Status**: Port conflict resolved, ready to use
