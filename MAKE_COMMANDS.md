# Makefile Commands Guide - ScriptSensei Global

> Complete guide to using the Makefile for development, testing, and deployment

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Development Workflow](#-development-workflow)
- [Docker Infrastructure](#-docker-infrastructure)
- [Services Management](#-services-management)
- [Testing](#-testing)
- [Code Quality](#-code-quality)
- [Monitoring](#-monitoring)
- [Troubleshooting](#-troubleshooting)
- [Complete Command Reference](#-complete-command-reference)

## 🚀 Quick Start

### First Time Setup (5 minutes)

```bash
# 1. Clone the repository
git clone <repository-url>
cd ScriptSensei

# 2. Check prerequisites
make check-prereqs

# 3. Install everything and start infrastructure
make install

# 4. Start Docker infrastructure and database
make dev

# 5. Start all backend services
make services-start

# 6. In a new terminal, start frontend
make frontend-dev
```

**That's it!** Open http://localhost:4000

### Daily Development Workflow

```bash
# Morning - Start infrastructure
make dev

# Start individual services (see "Starting Services One by One" section below)
make start-auth-service
make start-content-service

# In a new terminal, start frontend
make frontend-dev

# Work on your code...

# Run tests before committing
make test

# Evening - Stop everything
make stop-all
```

## ✅ Prerequisites

Before you begin, ensure you have:

- **Docker Desktop** - For containerized infrastructure
- **Go 1.21+** - For Go services
- **Python 3.11+** - For Python services
- **Node.js 20+** - For Node.js services and frontend
- **Git** - For version control

### Check Prerequisites

```bash
make check-prereqs
```

This will verify all required tools are installed and show their versions.

**Expected Output:**
```
🔍 Checking prerequisites...
✅ All prerequisites are installed

Versions:
  Docker: 24.0.6
  Go: go1.21.5
  Python: 3.11.7
  Node: v20.10.0
```

## 📦 Installation

### Complete Installation

```bash
make install
```

This will:
1. ✅ Check prerequisites
2. ✅ Create `.env` file from `.env.example` (if not exists)
3. ✅ Install Go dependencies for all services
4. ✅ Install Python dependencies for all services
5. ✅ Install Node.js dependencies for all services

### Install Dependencies Only

```bash
# Install dependencies for specific language
make install-go-deps      # Go services
make install-python-deps  # Python services
make install-node-deps    # Node.js services + frontend
```

### Environment Configuration

The first time you run `make install`, a `.env` file is created from `.env.example`.

**Important**: Edit `.env` and add your API keys!

```bash
# Edit environment variables
nano .env

# Required API keys to add:
# - CLERK_SECRET_KEY
# - Database credentials
# - LLM provider keys (DeepSeek, OpenAI, etc.)
# - Voice provider keys (ElevenLabs, Azure, etc.)
```

## 💻 Development Workflow

### Start Development Environment

#### Option 1: Start Infrastructure Only (Recommended for development)

```bash
make dev
```

This starts:
- ✅ Docker infrastructure (PostgreSQL, Redis, MongoDB, RabbitMQ, etc.)
- ✅ Database migrations
- ✅ Kong API Gateway configuration

Then manually start services you're working on:
```bash
# Start specific service
cd services/content-service
go run cmd/main.go

# Or use make targets
make start-content-service
```

#### Option 2: Start Everything

```bash
make start-all
```

This starts:
- ✅ Docker infrastructure
- ✅ Database migrations
- ✅ Kong configuration
- ✅ All 6 backend services in background

**Note**: Frontend must be started separately!

```bash
# In a new terminal
make frontend-dev
```

### Stop Everything

```bash
make stop-all
```

This stops:
- ✅ All backend services
- ✅ Docker infrastructure

### Restart Everything

```bash
make restart-all
```

## 🐳 Docker Infrastructure

### Start Infrastructure

```bash
make docker-up
```

**Services Started:**
- PostgreSQL (port 5432)
- Redis (port 6379)
- MongoDB (port 27017)
- RabbitMQ (ports 5672, 15672)
- Elasticsearch (port 9200)
- MinIO (ports 9000, 9001)
- Kong Gateway (ports 8000, 8001)
- InfluxDB (port 8086)
- Prometheus (port 9090)
- Grafana (port 4001)

### Stop Infrastructure

```bash
make docker-down
```

### Restart Infrastructure

```bash
make docker-restart
```

### Clean Infrastructure (Delete All Data)

```bash
make docker-clean
```

⚠️ **Warning**: This removes all containers, volumes, and data!

### View Docker Logs

```bash
make docker-logs
```

### Check Running Containers

```bash
make docker-ps
```

## 🗄️ Database Management

### Run Migrations

```bash
make db-migrate
```

This creates all required tables in PostgreSQL.

### Reset Database (Delete All Data)

```bash
make db-reset
```

⚠️ **Warning**: This deletes all data and re-runs migrations!

## 🦍 Kong API Gateway

### Configure Kong

```bash
make kong-configure
```

This sets up:
- Routes for all microservices
- JWT authentication plugin
- CORS plugin
- Rate limiting plugin
- Logging plugin

### Check Kong Health

```bash
make kong-health
```

### Kong URLs

- **Proxy**: http://localhost:8000 (Main gateway)
- **Admin API**: http://localhost:8001 (Configuration)

## 🚀 Services Management

### Start All Services at Once

```bash
make services-start
```

This starts all backend services in background:
- Auth Service (port 8001)
- Content Service (port 8011)
- Video Processing Service (port 8012) - if implemented
- Voice Service (port 8013) - if implemented
- Translation Service (port 8014) - if implemented
- Analytics Service (port 8015) - if implemented
- Trend Service (port 8016) - if implemented

**Note**: Services that aren't implemented yet will show a yellow warning message.

### Starting Services One by One (Recommended for Development)

For better control and debugging, start services individually:

#### Step 1: Start Infrastructure
```bash
make dev
```
This starts Docker containers (PostgreSQL, Redis, MongoDB, Kong, etc.)

#### Step 2: Start Backend Services

**Auth Service** (Port 8001):
```bash
make start-auth-service
```
Provides:
- Health check: http://localhost:8001/health
- Protected endpoint: http://localhost:8001/api/v1/me
- Clerk JWT authentication

**Content Service** (Port 8011):
```bash
make start-content-service
```
Provides:
- Script generation with DeepSeek V3 and Gemini
- Multi-LLM orchestration with fallback
- Platform-specific prompts (TikTok, YouTube, etc.)

**Other Services** (when implemented):
```bash
make start-video-service        # Port 8012 - Video Processing (Python)
make start-voice-service        # Port 8013 - Voice Synthesis (Go)
make start-translation-service  # Port 8014 - Translation (Node.js)
make start-analytics-service    # Port 8015 - Analytics (Go)
make start-trend-service        # Port 8016 - Trend Analysis (Python)
```

#### Step 3: Start Frontend
```bash
make frontend-dev
```
Opens at: http://localhost:4000

### Stop All Services

```bash
make services-stop
```

### Check Running Services

```bash
make status
```

Shows:
- Docker containers status
- Running backend services
- Ports in use

### Service Health Checks

```bash
make health
```

Checks health of:
- Kong API Gateway
- PostgreSQL
- Redis
- MongoDB

### Service Logs

All service logs are written to `logs/` directory.

#### View All Logs Together
```bash
make logs
```

#### View Individual Service Logs
```bash
make logs-auth          # Auth Service logs
make logs-content       # Content Service logs
make logs-video         # Video Processing logs
make logs-voice         # Voice Service logs
make logs-translation   # Translation Service logs
make logs-analytics     # Analytics Service logs
```

#### Clear All Logs
```bash
make logs-clear
```

### Service Ports Reference

| Service | Port | Protocol | Status |
|---------|------|----------|---------|
| **Frontend** | 4000 | HTTP | ✅ Ready |
| **Kong Gateway** | 8000 | HTTP | ✅ Ready |
| **Kong Admin** | 8001 | HTTP | ✅ Ready |
| **Auth Service** | 8001 | HTTP | ✅ Implemented |
| **Content Service** | 8011 | HTTP | ✅ Implemented |
| **Video Service** | 8012 | HTTP | ⏳ Pending |
| **Voice Service** | 8013 | HTTP | ⏳ Pending |
| **Translation Service** | 8014 | HTTP | ⏳ Pending |
| **Analytics Service** | 8015 | HTTP | ⏳ Pending |
| **Trend Service** | 8016 | HTTP | ⏳ Pending |

## 🎨 Frontend

### Development Mode (Port 4000)

```bash
make frontend-dev
```

Frontend runs on http://localhost:4000

**Features**:
- Hot reload enabled
- TypeScript with Next.js 14
- Tailwind CSS + Shadcn/ui components
- React Query for data fetching
- Zustand for state management

### Build for Production

```bash
make frontend-build
```

Creates optimized production build in `frontend/.next/`

### Start Production Build (Port 4000)

```bash
make frontend-start
```

Runs the production build locally on port 4000

## 🧪 Testing

### Run All Tests

```bash
make test
```

This runs:
- ✅ Unit tests for all services
- ✅ Integration tests
- ✅ E2E tests
- ✅ Shows pass/fail summary

### Run Tests with Coverage

```bash
make test-coverage
```

This generates coverage reports for all services and checks 80% minimum threshold.

### Run Tests with Verbose Output

```bash
make test-verbose
```

Useful for debugging test failures.

### Run Unit Tests Only

```bash
make test-unit
```

Faster than full test suite.

### Run E2E Tests

```bash
make test-e2e
```

Runs end-to-end tests for all services.

## 🔍 Code Quality

### Run All Linters

```bash
make lint
```

This runs linters for:
- Go services (golangci-lint)
- Python services (black, flake8)
- Node.js services (eslint)

### Run Specific Linters

```bash
make lint-go      # Go linters only
make lint-python  # Python linters only
make lint-node    # Node.js linters only
```

### Format Code

```bash
make format
```

This formats code for all services.

### Format Specific Languages

```bash
make format-go      # Format Go code
make format-python  # Format Python code
make format-node    # Format Node.js code
```

## 🔨 Build

### Build All Services

```bash
make build
```

This builds:
- All Go services
- Frontend for production

### Build Go Services

```bash
make build-go
```

### Build Frontend

```bash
make build-frontend
```

### Build Docker Images

```bash
make build-docker
```

## 📊 Monitoring

### Service Status

```bash
make status
```

Shows:
- Docker container status
- Running backend services
- Ports in use

**Example Output:**
```
📊 Service Status

Docker Infrastructure:
NAME                        STATUS    PORTS
scriptsensei-postgres       Up        5432
scriptsensei-redis          Up        6379
scriptsensei-kong           Up        8000, 8001
...

Backend Services:
auth-service       Running  PID 12345
content-service    Running  PID 12346
...
```

### Health Check

```bash
make health
```

Checks health of:
- Kong API Gateway
- PostgreSQL
- Redis
- MongoDB

**Example Output:**
```
🏥 Health Check

Kong API Gateway:
✅ Kong is healthy

PostgreSQL:
✅ PostgreSQL is healthy

Redis:
✅ Redis is healthy

MongoDB:
✅ MongoDB is healthy
```

## 🧹 Cleanup

### Clean Build Artifacts

```bash
make clean
```

This removes:
- `bin/` directories
- `dist/` directories
- `__pycache__/` directories
- `node_modules/` directories
- `.next/` directories
- Coverage files
- Log files

### Clean Everything (Nuclear Option)

```bash
make clean-all
```

This runs:
- `make clean` (build artifacts)
- `make docker-clean` (Docker volumes and data)

⚠️ **Warning**: This deletes ALL data!

## 📚 Documentation

### View Available Documentation

```bash
make docs
```

Shows list of all documentation files.

## 🔧 Git Hooks

### Install Pre-commit Hooks

```bash
make hooks-install
```

This installs hooks that run automatically before each commit:
- Run tests
- Check code formatting
- Run linters
- Check coverage

### Run Hooks Manually

```bash
make hooks-run
```

## ⚡ Quick Actions

### Quick Start (Minimal)

```bash
make quick-start
```

This runs:
1. Check prerequisites
2. Check/create `.env` file
3. Start Docker infrastructure
4. Run database migrations

Then you can start services manually.

### Reset Everything

```bash
make reset
```

⚠️ **Nuclear option** - stops everything, cleans all data and artifacts.

After reset, run `make install` to reinstall dependencies.

## 🔧 Troubleshooting

### Problem: "Port already in use"

**Solution**: Check what's using the port
```bash
make status
lsof -i :8000  # Check specific port
```

Stop conflicting services:
```bash
make stop-all
make docker-down
```

### Problem: "Docker not running"

**Solution**: Start Docker Desktop
```bash
# Check if Docker is running
docker ps

# If not, start Docker Desktop
open -a Docker  # macOS
```

### Problem: "Database connection refused"

**Solution**: Ensure infrastructure is running
```bash
make docker-up
make health  # Check database health
```

Wait a few seconds after `docker-up` for databases to initialize.

### Problem: "make: command not found"

**Solution**: Install make
```bash
# macOS
xcode-select --install

# Ubuntu/Debian
sudo apt-get install build-essential

# Windows
# Use WSL2 or Git Bash
```

### Problem: ".env file missing API keys"

**Solution**: Edit .env and add your keys
```bash
nano .env

# Add required keys:
# CLERK_SECRET_KEY=your_key_here
# DEEPSEEK_API_KEY=your_key_here
# etc.
```

### Problem: "Tests failing"

**Solution**: Check logs and run verbose tests
```bash
make test-verbose
make logs
```

### Problem: "Service won't start"

**Solution**: Check logs for the specific service
```bash
make logs-auth        # Or whichever service
cat logs/auth-service.log
```

Common issues:
- Missing dependencies: `make install`
- Wrong environment variables: Check `.env`
- Port in use: `make stop-all`

### Problem: "Kong not responding"

**Solution**: Reconfigure Kong
```bash
make docker-restart
sleep 5
make kong-configure
make kong-health
```

## 📖 Complete Command Reference

### General
| Command | Description |
|---------|-------------|
| `make help` | Show all available commands |
| `make check-prereqs` | Check if required tools are installed |
| `make check-env` | Check/create .env file |

### Installation
| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies |
| `make install-deps` | Install dependencies for all services |
| `make install-go-deps` | Install Go dependencies |
| `make install-python-deps` | Install Python dependencies |
| `make install-node-deps` | Install Node.js dependencies |

### Docker Infrastructure
| Command | Description |
|---------|-------------|
| `make docker-up` | Start Docker infrastructure |
| `make docker-down` | Stop Docker infrastructure |
| `make docker-restart` | Restart Docker infrastructure |
| `make docker-clean` | Remove containers, volumes, networks |
| `make docker-logs` | View Docker logs |
| `make docker-ps` | Show running containers |

### Database
| Command | Description |
|---------|-------------|
| `make db-migrate` | Run database migrations |
| `make db-reset` | Reset database (delete all data) |

### Kong API Gateway
| Command | Description |
|---------|-------------|
| `make kong-configure` | Configure Kong routes and plugins |
| `make kong-health` | Check Kong health status |

### Backend Services
| Command | Description |
|---------|-------------|
| `make services-start` | Start all backend services |
| `make services-stop` | Stop all backend services |
| `make start-auth-service` | Start Auth Service |
| `make start-content-service` | Start Content Service |
| `make start-video-service` | Start Video Processing Service |
| `make start-voice-service` | Start Voice Service |
| `make start-translation-service` | Start Translation Service |
| `make start-analytics-service` | Start Analytics Service |
| `make start-trend-service` | Start Trend Service |

### Frontend
| Command | Description |
|---------|-------------|
| `make frontend-dev` | Start frontend in development mode |
| `make frontend-build` | Build frontend for production |
| `make frontend-start` | Start frontend in production mode |

### Development
| Command | Description |
|---------|-------------|
| `make dev` | Start development environment |
| `make start-all` | Start everything (infrastructure + services) |
| `make stop-all` | Stop everything |
| `make restart-all` | Restart everything |

### Logs
| Command | Description |
|---------|-------------|
| `make logs` | View all service logs |
| `make logs-auth` | View Auth Service logs |
| `make logs-content` | View Content Service logs |
| `make logs-video` | View Video Processing Service logs |
| `make logs-voice` | View Voice Service logs |
| `make logs-translation` | View Translation Service logs |
| `make logs-analytics` | View Analytics Service logs |
| `make logs-clear` | Clear all logs |

### Testing
| Command | Description |
|---------|-------------|
| `make test` | Run all tests |
| `make test-coverage` | Run tests with coverage |
| `make test-verbose` | Run tests with verbose output |
| `make test-unit` | Run unit tests only |
| `make test-e2e` | Run E2E tests |

### Code Quality
| Command | Description |
|---------|-------------|
| `make lint` | Run all linters |
| `make lint-go` | Run Go linters |
| `make lint-python` | Run Python linters |
| `make lint-node` | Run Node.js linters |
| `make format` | Format code for all services |
| `make format-go` | Format Go code |
| `make format-python` | Format Python code |
| `make format-node` | Format Node.js code |

### Build
| Command | Description |
|---------|-------------|
| `make build` | Build all services |
| `make build-go` | Build Go services |
| `make build-frontend` | Build frontend |
| `make build-docker` | Build Docker images |

### Cleanup
| Command | Description |
|---------|-------------|
| `make clean` | Clean build artifacts and caches |
| `make clean-all` | Clean everything including Docker |

### Monitoring
| Command | Description |
|---------|-------------|
| `make status` | Show status of all services |
| `make health` | Check health of all services |

### Documentation
| Command | Description |
|---------|-------------|
| `make docs` | Show available documentation |

### Git Hooks
| Command | Description |
|---------|-------------|
| `make hooks-install` | Install pre-commit hooks |
| `make hooks-run` | Run pre-commit hooks manually |

### Quick Actions
| Command | Description |
|---------|-------------|
| `make quick-start` | Quick start (minimal setup) |
| `make reset` | Reset everything (nuclear option) |

## 💡 Common Workflows

### 1. First Day Setup
```bash
make install
make dev
make services-start
make frontend-dev  # In new terminal
```

### 2. Daily Development
```bash
# Morning
make start-all
make frontend-dev  # In new terminal

# Work on code...

# Before committing
make test
make lint

# Evening
make stop-all
```

### 3. Working on Specific Service
```bash
# Start infrastructure only
make dev

# Work on your service
cd services/content-service
go run cmd/main.go

# Run tests for your service
make test-unit

# Before committing
make test
```

### 4. Testing Workflow (TDD)
```bash
# Write test first
cd services/content-service
# Edit test file

# Run test (should fail - RED)
make test-unit

# Implement feature
# Edit source file

# Run test (should pass - GREEN)
make test-unit

# Refactor
# Improve code

# Run all tests
cd ../..
make test
```

### 5. Debugging
```bash
# Check what's running
make status

# Check health
make health

# View logs
make logs

# Or specific service
make logs-content

# Restart everything
make restart-all
```

### 6. Production Build
```bash
# Build everything
make build

# Build Docker images
make build-docker

# Run tests
make test

# Deploy (manual for now)
```

## 🎓 Tips & Best Practices

1. **Always run tests before committing**
   ```bash
   make test
   ```

2. **Use `make dev` for active development**
   - Starts infrastructure only
   - Start services manually as needed
   - Easier to see errors and debug

3. **Use `make start-all` for demos**
   - Everything runs in background
   - Clean output
   - Easy to show to others

4. **Check logs when something goes wrong**
   ```bash
   make logs
   # or
   make logs-<service>
   ```

5. **Keep .env file secure**
   - Never commit it to git
   - Use `.env.example` as template
   - Add real API keys locally

6. **Run linters before committing**
   ```bash
   make lint
   make format
   ```

7. **Use pre-commit hooks**
   ```bash
   make hooks-install
   ```
   Tests and linters run automatically!

8. **Regular cleanup**
   ```bash
   make clean  # Weekly
   ```

9. **Check service health**
   ```bash
   make health  # When debugging
   ```

10. **Read the error messages**
    - Makefile provides colored output
    - ✅ Green = Success
    - ❌ Red = Error
    - ⚠️ Yellow = Warning

## 📞 Getting Help

If you encounter issues:

1. **Check this guide** - Most common problems are covered
2. **Run diagnostics**
   ```bash
   make check-prereqs
   make status
   make health
   ```
3. **Check logs**
   ```bash
   make logs
   ```
4. **Check documentation**
   ```bash
   make docs
   ```

## 📚 Related Documentation

- [README.md](README.md) - Project overview
- [TESTING_GUIDE.md](docs/TESTING_GUIDE.md) - Testing documentation
- [TDD_CHEAT_SHEET.md](docs/TDD_CHEAT_SHEET.md) - TDD quick reference
- [CLAUDE.md](CLAUDE.md) - Guide for Claude instances

---

**Version**: 1.0
**Last Updated**: January 2025
**Status**: Complete and Ready

Happy coding! 🚀
