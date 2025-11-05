# Project Structure - ScriptSensei Global

## 📁 Complete Directory Structure

```
ScriptSensei/
│
├── 📄 Makefile                              # 60+ commands for all operations
├── 📄 README.md                             # Project overview with quick start
├── 📄 QUICK_REFERENCE.md                    # One-page cheat sheet
├── 📄 CLAUDE.md                             # Guide for Claude instances
│
├── 📚 Documentation/
│   ├── MAKE_COMMANDS.md                     # Complete Makefile guide (25KB)
│   ├── TESTING_QUICKSTART.md                # 5-minute testing guide
│   ├── TEST_INFRASTRUCTURE_SUMMARY.md       # Test infrastructure overview
│   ├── MAKEFILE_IMPLEMENTATION_SUMMARY.md   # Makefile summary
│   ├── SESSION_SUMMARY.md                   # This session's work
│   ├── IMPLEMENTATION_UPDATES.md            # Clerk + Kong migration
│   │
│   ├── docs/
│   │   ├── TESTING_GUIDE.md                 # Complete testing guide (21KB)
│   │   ├── TDD_CHEAT_SHEET.md              # TDD quick reference (13KB)
│   │   ├── CLERK_AUTHENTICATION.md          # Clerk integration
│   │   └── JWT_AUTHENTICATION.md            # JWT verification
│   │
│   ├── ScriptSensei_Global_Design_Document.md
│   └── ScriptSensei_Technical_Implementation_Guide.md
│
├── 🔧 Configuration/
│   ├── .env.example                         # Environment template (100+ vars)
│   ├── .env                                 # Your local config (git-ignored)
│   ├── docker-compose.yml                   # Infrastructure services
│   ├── .pre-commit-config.yaml             # Pre-commit hooks
│   └── .github/workflows/
│       └── test.yml                         # CI/CD pipeline
│
├── 📜 Scripts/
│   ├── setup-dev.sh                         # Development setup
│   ├── migrate-db.sh                        # Database migrations
│   ├── configure-kong.sh                    # Kong configuration
│   ├── check-coverage.sh                    # Coverage checker
│   └── run-all-tests.sh                     # Master test runner
│
├── 📝 Logs/
│   ├── .gitkeep
│   ├── .gitignore
│   ├── auth-service.log
│   ├── content-service.log
│   ├── video-service.log
│   ├── voice-service.log
│   ├── translation-service.log
│   └── analytics-service.log
│
├── 🎨 Frontend/ (Next.js 14)
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── middleware.ts                        # Clerk auth middleware
│   │
│   ├── app/
│   │   ├── layout.tsx                       # Root layout with Clerk
│   │   ├── page.tsx                         # Home page
│   │   └── dashboard/
│   │       └── page.tsx
│   │
│   ├── components/
│   │   └── *.tsx
│   │
│   └── __tests__/
│       └── *.test.tsx
│
└── 🔧 Services/ (Microservices)
    │
    ├── 🔐 auth-service/ (Go - Port 8011)
    │   ├── Makefile                         # Service commands
    │   ├── go.mod
    │   ├── go.sum
    │   │
    │   ├── cmd/
    │   │   └── main.go                      # Entry point
    │   │
    │   ├── internal/
    │   │   ├── config/
    │   │   │   └── config.go
    │   │   │
    │   │   ├── handler/
    │   │   │   └── auth.go
    │   │   │
    │   │   ├── middleware/
    │   │   │   ├── clerk_jwt.go            # JWT verification
    │   │   │   └── clerk_jwt_test.go       # ✅ 10 unit tests
    │   │   │
    │   │   └── repository/
    │   │       └── user_repo.go
    │   │
    │   └── tests/
    │       └── e2e/
    │           └── auth_flow_test.go        # ✅ 6 E2E tests
    │
    ├── 📝 content-service/ (Go - Port 8012)
    │   ├── Makefile
    │   ├── go.mod
    │   ├── cmd/main.go
    │   └── internal/
    │       ├── handler/
    │       ├── service/
    │       └── repository/
    │
    ├── 🎬 video-processing-service/ (Python - Port 8013)
    │   ├── requirements.txt
    │   ├── app/
    │   │   ├── main.py
    │   │   ├── routers/
    │   │   ├── services/
    │   │   └── models/
    │   │
    │   └── tests/
    │       ├── unit/
    │       ├── integration/
    │       └── e2e/
    │
    ├── 🎤 voice-service/ (Go - Port 8014)
    │   ├── Makefile
    │   ├── go.mod
    │   ├── cmd/main.go
    │   └── internal/
    │
    ├── 🌐 translation-service/ (Node.js - Port 8015)
    │   ├── package.json
    │   ├── src/
    │   │   ├── index.ts
    │   │   ├── routes/
    │   │   ├── services/
    │   │   └── models/
    │   │
    │   └── tests/
    │       ├── unit/
    │       └── integration/
    │
    ├── 📊 analytics-service/ (Go - Port 8016)
    │   ├── Makefile
    │   ├── go.mod
    │   ├── cmd/main.go
    │   └── internal/
    │
    └── 📈 trend-service/ (Python - Port 8017)
        ├── requirements.txt
        ├── app/
        │   ├── main.py
        │   ├── routers/
        │   └── services/
        │
        └── tests/
```

## 🎯 Key Directories Explained

### Root Level
- **Makefile**: Master control with 60+ commands
- **Documentation**: 7+ comprehensive guides
- **Configuration**: .env, docker-compose, CI/CD
- **Scripts**: Automation helpers
- **Logs**: Service logs (git-ignored)

### Frontend
- **Next.js 14** with App Router
- **Clerk** authentication integrated
- **Tailwind CSS** + Shadcn/ui
- **TypeScript** throughout

### Services
Each service follows this structure:
```
service-name/
├── Makefile              # make test, make build, etc.
├── cmd/main.go           # Entry point (Go)
├── app/main.py           # Entry point (Python)
├── src/index.ts          # Entry point (Node.js)
├── internal/             # Internal packages (Go)
├── app/                  # Application code (Python)
├── src/                  # Source code (Node.js)
└── tests/                # Test directory
    ├── unit/
    ├── integration/
    └── e2e/
```

## 📊 File Statistics

### Documentation
- Total: ~7,000 lines
- TESTING_GUIDE.md: 21KB
- TDD_CHEAT_SHEET.md: 13KB
- MAKE_COMMANDS.md: 25KB

### Code
- Test code: ~500 lines (Auth Service)
- Makefile: 600+ lines
- Scripts: 400+ lines
- CI/CD: 400+ lines

### Configuration
- .env.example: 100+ variables
- docker-compose.yml: Complete infrastructure
- Pre-commit hooks: 20+ checks

## 🔄 Data Flow

```
User
  ↓
Frontend (Next.js :3000)
  ↓ (Clerk Auth)
Kong Gateway (:8000)
  ↓ (JWT Verification)
  ├→ Auth Service (:8011)
  ├→ Content Service (:8012)
  ├→ Video Service (:8013)
  ├→ Voice Service (:8014)
  ├→ Translation Service (:8015)
  ├→ Analytics Service (:8016)
  └→ Trend Service (:8017)
      ↓
Infrastructure
  ├→ PostgreSQL (:5432)
  ├→ Redis (:6379)
  ├→ MongoDB (:27017)
  ├→ RabbitMQ (:5672)
  ├→ Elasticsearch (:9200)
  └→ MinIO (:9000)
```

## 🧪 Testing Structure

```
Tests/
├── Unit Tests (Many)
│   ├── Go: *_test.go
│   ├── Python: test_*.py
│   └── Node.js: *.test.ts
│
├── Integration Tests (Some)
│   └── tests/integration/
│
└── E2E Tests (Few)
    └── tests/e2e/
```

**Coverage Target**: >80% for all services

## 🔧 Make Commands by Category

### Setup & Installation (6)
```bash
make install
make install-go-deps
make install-python-deps
make install-node-deps
```

### Development (8)
```bash
make dev
make start-all
make stop-all
make restart-all
make services-start
make services-stop
make frontend-dev
make frontend-build
```

### Testing (5)
```bash
make test
make test-coverage
make test-verbose
make test-unit
make test-e2e
```

### Code Quality (8)
```bash
make lint
make lint-go
make lint-python
make lint-node
make format
make format-go
make format-python
make format-node
```

### Docker (6)
```bash
make docker-up
make docker-down
make docker-restart
make docker-clean
make docker-logs
make docker-ps
```

### Monitoring (10)
```bash
make status
make health
make logs
make logs-auth
make logs-content
make logs-video
make logs-voice
make logs-translation
make logs-analytics
make logs-clear
```

### Database (2)
```bash
make db-migrate
make db-reset
```

### Kong (2)
```bash
make kong-configure
make kong-health
```

### Build (4)
```bash
make build
make build-go
make build-frontend
make build-docker
```

### Cleanup (2)
```bash
make clean
make clean-all
```

### Utilities (7)
```bash
make help
make check-prereqs
make check-env
make docs
make hooks-install
make hooks-run
make quick-start
```

## 📚 Documentation Files

| File | Size | Purpose |
|------|------|---------|
| MAKE_COMMANDS.md | 25KB | Complete Makefile guide |
| TESTING_GUIDE.md | 21KB | Complete testing guide |
| TDD_CHEAT_SHEET.md | 13KB | TDD quick reference |
| MAKEFILE_IMPLEMENTATION_SUMMARY.md | 12KB | Makefile summary |
| SESSION_SUMMARY.md | 13KB | This session's work |
| TEST_INFRASTRUCTURE_SUMMARY.md | 12KB | Test infrastructure |
| TESTING_QUICKSTART.md | 6KB | 5-minute guide |
| QUICK_REFERENCE.md | 5KB | One-page cheat sheet |

## 🎯 Quick Navigation

### For New Developers
1. Start: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
2. Setup: Run `make install && make start-all`
3. Learn: [MAKE_COMMANDS.md](MAKE_COMMANDS.md)

### For Testing
1. Quick: [TDD_CHEAT_SHEET.md](docs/TDD_CHEAT_SHEET.md)
2. Complete: [TESTING_GUIDE.md](docs/TESTING_GUIDE.md)
3. 5-min: [TESTING_QUICKSTART.md](TESTING_QUICKSTART.md)

### For Claude Instances
1. Read: [CLAUDE.md](CLAUDE.md)
2. TDD: Required for all code
3. Tests: Must pass before merge

---

**Total Project Size**:
- Files: 100+
- Documentation: ~7,000 lines
- Code: Growing
- Tests: Auth Service complete, others ready
- Commands: 60+

**Status**: ✅ Complete infrastructure, ready for development!
