# Quick Reference - ScriptSensei Global

> One-page cheat sheet for common tasks

## ✅ Current Status (January 2025)

**Infrastructure**: ✅ Running (12 containers)
**Database**: ✅ Migrated (8 tables created)
**API Gateway**: ✅ Configured (7 services, 6 routes)
**Monitoring**: ✅ Active (Prometheus + Grafana)

**Ready for**: Backend service development & frontend integration

## 🚀 Getting Started (First Time)

```bash
# 1. Clone and install
git clone <repository-url>
cd ScriptSensei
make install

# 2. Start everything
make start-all

# 3. Start frontend (new terminal)
make frontend-dev

# 4. Open http://localhost:3000
```

**Setup time**: ~5 minutes

## 📋 Daily Commands

### Start Development
```bash
make start-all      # Start infrastructure + all services
make frontend-dev   # Start frontend (new terminal)
```

### Stop Development
```bash
make stop-all       # Stop everything
```

### Testing
```bash
make test           # Run all tests
make test-coverage  # With coverage reports
make test-unit      # Unit tests only
```

### Code Quality
```bash
make lint           # Run all linters
make format         # Format all code
```

### Monitoring
```bash
make status         # Show service status
make health         # Check health
make logs           # View all logs
```

## 🎯 Quick Workflows

### Working on a Feature (TDD)

```bash
# 1. Start infrastructure
make dev

# 2. Write test first (RED) 🔴
cd services/your-service
# Edit *_test.go
make test-unit  # Should FAIL

# 3. Implement feature (GREEN) 🟢
# Edit source file
make test-unit  # Should PASS

# 4. Refactor (REFACTOR) 🔵
# Improve code
make test-unit  # Still PASS

# 5. Before committing
cd ../..
make test       # All tests
make lint       # Check quality
```

### Debugging Issues

```bash
make status         # What's running?
make health         # Everything healthy?
make logs           # View all logs
make logs-content   # Specific service
make restart-all    # Nuclear option
```

### Clean Up

```bash
make clean          # Clean build artifacts
make logs-clear     # Clear log files
make docker-clean   # Clean Docker (deletes data!)
```

## 📁 Important Files

### Documentation
- `MAKE_COMMANDS.md` - Complete Makefile guide
- `TESTING_GUIDE.md` - Complete testing guide
- `TDD_CHEAT_SHEET.md` - TDD quick reference
- `TESTING_QUICKSTART.md` - 5-minute testing guide
- `CLAUDE.md` - Guide for Claude instances

### Configuration
- `.env` - Environment variables (don't commit!)
- `docker-compose.yml` - Infrastructure
- `Makefile` - All commands

### Testing
- `services/*/Makefile` - Service-specific commands
- `services/*/**/*_test.go` - Go tests
- `services/*/tests/` - Test directories

## 🔧 Makefile Commands

### Most Common (Top 10)

| Command | What It Does |
|---------|--------------|
| `make help` | Show all commands |
| `make install` | Install dependencies |
| `make start-all` | Start everything |
| `make stop-all` | Stop everything |
| `make test` | Run all tests |
| `make lint` | Check code quality |
| `make status` | Service status |
| `make logs` | View logs |
| `make dev` | Start infrastructure only |
| `make clean` | Clean artifacts |

### Full Categories (60+ commands)

```bash
make help           # See all commands organized by category
```

Categories:
- General (3)
- Installation (6)
- Docker Infrastructure (6)
- Database (2)
- Kong API Gateway (2)
- Backend Services (8)
- Frontend (3)
- Development (4)
- Logs (8)
- Testing (5)
- Code Quality (8)
- Build (4)
- Cleanup (2)
- Monitoring (2)
- Documentation (1)
- Git Hooks (2)
- Quick Actions (2)

## 🧪 Testing Commands

### Go Services
```bash
cd services/your-service
make test              # All tests
make test-unit         # Unit tests
make test-coverage     # With coverage
make test-watch        # Watch mode
```

### Python Services
```bash
cd services/your-service
pytest                 # All tests
pytest --cov          # With coverage
pytest -v             # Verbose
pytest -k "pattern"   # Filter
```

### Node.js Services
```bash
cd services/your-service
npm test              # All tests
npm test -- --coverage # With coverage
npm test -- --watch   # Watch mode
```

## 🌐 Service URLs (✅ VERIFIED WORKING)

### Application
- Frontend: http://localhost:3000
- API Gateway (Kong): http://localhost:8000
- Health Check: http://localhost:8000/health ✅

### Infrastructure Management
- Kong Admin API: http://localhost:8001 ✅
- Kong Admin GUI: http://localhost:8002
- RabbitMQ Management: http://localhost:15672 (guest/guest) ✅
- MinIO Console: http://localhost:9001 (minio/minio123) ✅
- MinIO API: http://localhost:9000 ✅
- Grafana: http://localhost:3001 (admin/dev_password) ✅
- Prometheus: http://localhost:9090 ✅
- Elasticsearch: http://localhost:9200 ✅
- InfluxDB: http://localhost:8086 ✅

### Databases (Local Access)
- PostgreSQL: localhost:5432 (scriptsensei/dev_password/scriptsensei_dev) ✅
- Kong Database: localhost:5433 (kong/kong_password/kong) ✅
- MongoDB: localhost:27017 (scriptsensei/dev_password) ✅
- Redis: localhost:6379 (no password) ✅

### Backend Services (Internal Ports - Access via Kong)
- Auth Service: http://localhost:8010 → http://localhost:8000/api/v1/auth
- Content Service: http://localhost:8011 → http://localhost:8000/api/v1/scripts ✅
- Video Service: http://localhost:8012 → http://localhost:8000/api/v1/videos ✅
- Voice Service: http://localhost:8013 → http://localhost:8000/api/v1/voices ✅
- Translation Service: http://localhost:8014 → http://localhost:8000/api/v1/translate ✅
- Analytics Service: http://localhost:8015 → http://localhost:8000/api/v1/analytics ✅
- Trend Service: http://localhost:8016 → http://localhost:8000/api/v1/trends ✅

## 🆘 Troubleshooting

### Problem: "Port already in use"
```bash
make stop-all
make docker-down
lsof -i :8000  # Check specific port
```

### Problem: "Docker not running"
```bash
# Start Docker Desktop
open -a Docker  # macOS
```

### Problem: "Database connection refused"
```bash
make docker-up
sleep 5  # Wait for startup
make health
```

### Problem: "Tests failing"
```bash
make test-verbose
make logs
```

### Problem: "Service won't start"
```bash
make logs-<service>
cat logs/<service>.log
```

## 💡 Pro Tips

1. **Always test before committing**
   ```bash
   make test && make lint
   ```

2. **Use `make dev` for active development**
   - Start only infrastructure
   - Start services manually
   - Easier to debug

3. **Install pre-commit hooks**
   ```bash
   make hooks-install
   ```
   Tests run automatically!

4. **Check logs when debugging**
   ```bash
   make logs-<service>
   ```

5. **Keep .env secure**
   - Never commit it
   - Use .env.example as template

## 📚 Learn More

- **Complete Guide**: [MAKE_COMMANDS.md](MAKE_COMMANDS.md)
- **Testing**: [TESTING_GUIDE.md](docs/TESTING_GUIDE.md)
- **TDD**: [TDD_CHEAT_SHEET.md](docs/TDD_CHEAT_SHEET.md)
- **Quick Start**: [TESTING_QUICKSTART.md](TESTING_QUICKSTART.md)

## 🎯 TDD Workflow (Remember!)

```
🔴 RED    → Write failing test
🟢 GREEN  → Make test pass
🔵 REFACTOR → Improve code
         ↓
      (Repeat)
```

**Always**: Test First → Implement → Refactor

## ✅ Pre-Commit Checklist

- [ ] All tests pass (`make test`)
- [ ] Coverage >80% (`make test-coverage`)
- [ ] Linter passes (`make lint`)
- [ ] Code formatted (`make format`)
- [ ] Logs reviewed (`make logs`)

## 🎉 Quick Start Commands

```bash
# First time
make install && make start-all && make frontend-dev

# Daily start
make start-all && make frontend-dev

# Before commit
make test && make lint

# Daily stop
make stop-all
```

---

**Need help?** Run `make help` or check [MAKE_COMMANDS.md](MAKE_COMMANDS.md)

**Remember**: 🔴 Test First → 🟢 Make it Pass → 🔵 Refactor!
