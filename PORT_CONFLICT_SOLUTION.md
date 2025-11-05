# Port Conflict Solution

## Problem

You already have services running on these ports from another project (restosaas):
- **PostgreSQL**: port 5432 (restosaas_db)
- **Redis**: port 6379 (restosaas_redis)

## Solutions

### Option 1: Use Existing Databases (Recommended for Now)

Since you already have PostgreSQL and Redis running, you can use them for ScriptSensei development:

1. **Update `.env` file** to point to existing services:

```bash
# In /Users/niksankarkee/Dev/ScriptSensei/.env

# PostgreSQL (use existing)
DATABASE_URL=postgresql://scriptsensei:dev_password@localhost:5432/scriptsensei_dev
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=scriptsensei  # Or use your restosaas user
POSTGRES_PASSWORD=dev_password  # Update with your actual password
POSTGRES_DB=scriptsensei_dev

# Redis (use existing)
REDIS_URL=redis://:dev_password@localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=dev_password  # Update with your actual password
```

2. **Create ScriptSensei database** in your existing PostgreSQL:

```bash
# Connect to existing PostgreSQL
docker exec -it restosaas_db psql -U postgres

# Create database for ScriptSensei
CREATE DATABASE scriptsensei_dev;
CREATE USER scriptsensei WITH PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE scriptsensei_dev TO scriptsensei;
\q
```

3. **Start only MongoDB** (if needed):

```bash
docker compose -f docker-compose.minimal.yml up -d mongodb
```

### Option 2: Use Different Ports

If you want separate databases, modify the ports in `docker-compose.minimal.yml`:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: scriptsensei-postgres
    ports:
      - "5433:5432"  # Changed from 5432 to 5433
    # ... rest of config

  redis:
    image: redis:7-alpine
    container_name: scriptsensei-redis
    ports:
      - "6380:6379"  # Changed from 6379 to 6380
    # ... rest of config
```

Then update `.env`:
```bash
DATABASE_URL=postgresql://scriptsensei:dev_password@localhost:5433/scriptsensei_dev
REDIS_URL=redis://:dev_password@localhost:6380
```

### Option 3: Stop Other Containers Temporarily

```bash
# Stop restosaas containers temporarily
docker stop restosaas_db restosaas_redis

# Start ScriptSensei infrastructure
make docker-up-minimal

# When done, restart restosaas
docker start restosaas_db restosaas_redis
```

## Recommended: Use Existing Databases

For now, the easiest solution is to use your existing PostgreSQL and Redis:

```bash
# 1. Create ScriptSensei database
docker exec -it restosaas_db psql -U postgres -c "CREATE DATABASE scriptsensei_dev;"

# 2. Don't start any Docker containers for now
# (Skip make docker-up-minimal)

# 3. Update .env to use existing services
# Edit .env and set:
#   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/scriptsensei_dev
#   REDIS_URL=redis://localhost:6379

# 4. Run migrations
make db-migrate

# 5. Start your service manually
cd services/content-service
go run cmd/main.go
```

This way you can start development immediately without Docker conflicts!

## Next Steps

Once you're ready to have fully isolated infrastructure:

1. Stop your restosaas containers
2. Start ScriptSensei containers with `make docker-up-minimal`
3. Or use different ports as shown in Option 2

---

**For immediate development, just use the existing databases!**
