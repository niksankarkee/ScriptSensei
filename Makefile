# Makefile for ScriptSensei Global
# Master control for all services and infrastructure

.PHONY: help install start stop restart clean logs test build deploy

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
CYAN := \033[0;36m
NC := \033[0m # No Color

# Detect Docker Compose command (v1 vs v2)
DOCKER_COMPOSE := $(shell command -v docker-compose 2>/dev/null)
ifndef DOCKER_COMPOSE
	DOCKER_COMPOSE := docker compose
endif

# Default target
.DEFAULT_GOAL := help

##@ General

help: ## Display this help message
	@echo '$(CYAN)╔════════════════════════════════════════════╗$(NC)'
	@echo '$(CYAN)║    ScriptSensei Global - Make Commands    ║$(NC)'
	@echo '$(CYAN)╚════════════════════════════════════════════╝$(NC)'
	@echo ''
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make $(CYAN)<target>$(NC)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(CYAN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Prerequisites Check

check-prereqs: ## Check if all required tools are installed
	@echo '$(BLUE)🔍 Checking prerequisites...$(NC)'
	@command -v docker >/dev/null 2>&1 || { echo '$(RED)❌ Docker is not installed$(NC)'; exit 1; }
	@if command -v docker-compose >/dev/null 2>&1; then \
		echo '$(GREEN)✅ Docker Compose (v1) found$(NC)'; \
	elif docker compose version >/dev/null 2>&1; then \
		echo '$(GREEN)✅ Docker Compose (v2) found$(NC)'; \
	else \
		echo '$(RED)❌ Docker Compose is not installed$(NC)'; exit 1; \
	fi
	@command -v go >/dev/null 2>&1 || { echo '$(RED)❌ Go is not installed$(NC)'; exit 1; }
	@command -v python3 >/dev/null 2>&1 || { echo '$(RED)❌ Python3 is not installed$(NC)'; exit 1; }
	@command -v node >/dev/null 2>&1 || { echo '$(RED)❌ Node.js is not installed$(NC)'; exit 1; }
	@echo '$(GREEN)✅ All prerequisites are installed$(NC)'
	@echo ''
	@echo 'Versions:'
	@echo '  Docker: $(shell docker --version | cut -d ' ' -f3)'
	@echo '  Docker Compose: $(shell $(DOCKER_COMPOSE) version --short 2>/dev/null || echo "v2")'
	@echo '  Go: $(shell go version | cut -d ' ' -f3)'
	@echo '  Python: $(shell python3 --version | cut -d ' ' -f2)'
	@echo '  Node: $(shell node --version)'

check-env: ## Check if .env file exists
	@if [ ! -f .env ]; then \
		echo '$(YELLOW)⚠️  .env file not found$(NC)'; \
		echo '$(CYAN)Creating .env from .env.example...$(NC)'; \
		cp .env.example .env; \
		echo '$(GREEN)✅ .env file created$(NC)'; \
		echo '$(YELLOW)⚠️  Please edit .env and add your API keys!$(NC)'; \
	else \
		echo '$(GREEN)✅ .env file exists$(NC)'; \
	fi

##@ Installation

install: check-prereqs check-env install-deps ## Install all dependencies
	@echo '$(GREEN)✅ Installation complete!$(NC)'

install-deps: install-go-deps install-python-deps install-node-deps ## Install dependencies for all services

install-go-deps: ## Install Go dependencies
	@echo '$(BLUE)📦 Installing Go dependencies...$(NC)'
	@for service in services/auth-service services/content-service services/voice-service services/analytics-service services/trend-service; do \
		if [ -d "$$service" ] && [ -f "$$service/go.mod" ]; then \
			echo "  → $$service"; \
			cd $$service && go mod download && go mod tidy && cd ../..; \
		fi; \
	done
	@echo '$(GREEN)✅ Go dependencies installed$(NC)'

install-python-deps: ## Install Python dependencies
	@echo '$(BLUE)📦 Installing Python dependencies...$(NC)'
	@for service in services/video-processing-service services/analytics-service services/trend-service; do \
		if [ -d "$$service" ] && [ -f "$$service/requirements.txt" ]; then \
			echo "  → $$service"; \
			cd $$service && python3 -m pip install -r requirements.txt && cd ../..; \
		fi; \
	done
	@echo '$(GREEN)✅ Python dependencies installed$(NC)'

install-node-deps: ## Install Node.js dependencies
	@echo '$(BLUE)📦 Installing Node.js dependencies...$(NC)'
	@for service in services/translation-service frontend; do \
		if [ -d "$$service" ] && [ -f "$$service/package.json" ]; then \
			echo "  → $$service"; \
			cd $$service && npm install && cd ..; \
		fi; \
	done
	@echo '$(GREEN)✅ Node.js dependencies installed$(NC)'

##@ Docker Infrastructure

docker-up: ## Start Docker infrastructure (PostgreSQL, Redis, MongoDB, RabbitMQ, etc.)
	@echo '$(BLUE)🐳 Starting Docker infrastructure...$(NC)'
	@$(DOCKER_COMPOSE) up -d
	@echo '$(GREEN)✅ Docker infrastructure started$(NC)'
	@echo ''
	@echo 'Services available at:'
	@echo '  PostgreSQL:    localhost:5433'
	@echo '  Redis:         localhost:6379'
	@echo '  MongoDB:       localhost:27017'
	@echo '  RabbitMQ:      localhost:5672 (Management: http://localhost:15672)'
	@echo '  Elasticsearch: http://localhost:9200'
	@echo '  MinIO:         http://localhost:9000 (Console: http://localhost:9001)'
	@echo '  Kong Gateway:  http://localhost:8000 (Admin: http://localhost:8001)'
	@echo '  Prometheus:    http://localhost:9090'
	@echo '  Grafana:       http://localhost:4001'

docker-up-minimal: ## Start minimal Docker infrastructure (PostgreSQL, Redis, MongoDB only)
	@echo '$(BLUE)🐳 Starting minimal Docker infrastructure...$(NC)'
	@docker compose -f docker-compose.minimal.yml up -d
	@echo '$(GREEN)✅ Minimal Docker infrastructure started$(NC)'
	@echo ''
	@echo 'Services available at:'
	@echo '  PostgreSQL:    localhost:5433'
	@echo '  Redis:         localhost:6379'
	@echo '  MongoDB:       localhost:27017'
	@echo ''
	@echo '$(YELLOW)Note: This is a minimal setup. Use docker-up for full infrastructure.$(NC)'

docker-down-minimal: ## Stop minimal Docker infrastructure
	@echo '$(BLUE)🐳 Stopping minimal Docker infrastructure...$(NC)'
	@docker compose -f docker-compose.minimal.yml down
	@echo '$(GREEN)✅ Minimal Docker infrastructure stopped$(NC)'

docker-down: ## Stop Docker infrastructure
	@echo '$(BLUE)🐳 Stopping Docker infrastructure...$(NC)'
	@$(DOCKER_COMPOSE) down
	@echo '$(GREEN)✅ Docker infrastructure stopped$(NC)'

docker-restart: docker-down docker-up ## Restart Docker infrastructure

docker-clean: ## Stop and remove Docker containers, volumes, and networks
	@echo '$(YELLOW)⚠️  This will remove all containers, volumes, and networks!$(NC)'
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo '$(BLUE)🐳 Cleaning Docker infrastructure...$(NC)'; \
		$(DOCKER_COMPOSE) down -v --remove-orphans; \
		echo '$(GREEN)✅ Docker infrastructure cleaned$(NC)'; \
	else \
		echo '$(YELLOW)Cancelled$(NC)'; \
	fi

docker-logs: ## View Docker logs
	@$(DOCKER_COMPOSE) logs -f

docker-ps: ## Show running Docker containers
	@$(DOCKER_COMPOSE) ps

##@ Database

db-migrate: ## Run database migrations
	@echo '$(BLUE)🗄️  Running database migrations...$(NC)'
	@chmod +x scripts/migrate-db.sh
	@./scripts/migrate-db.sh
	@echo '$(GREEN)✅ Database migrations complete$(NC)'

db-reset: ## Reset database (WARNING: This will delete all data!)
	@echo '$(RED)⚠️  WARNING: This will delete all data!$(NC)'
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo '$(BLUE)🗄️  Resetting database...$(NC)'; \
		$(DOCKER_COMPOSE) down -v postgres redis mongodb; \
		$(DOCKER_COMPOSE) up -d postgres redis mongodb; \
		sleep 5; \
		$(MAKE) db-migrate; \
		echo '$(GREEN)✅ Database reset complete$(NC)'; \
	else \
		echo '$(YELLOW)Cancelled$(NC)'; \
	fi

##@ Kong API Gateway

kong-configure: ## Configure Kong API Gateway
	@echo '$(BLUE)🦍 Configuring Kong API Gateway...$(NC)'
	@chmod +x scripts/configure-kong.sh
	@./scripts/configure-kong.sh
	@echo '$(GREEN)✅ Kong configured$(NC)'

kong-health: ## Check Kong health
	@echo '$(BLUE)🦍 Checking Kong health...$(NC)'
	@curl -s http://localhost:8001/status | jq '.' || echo '$(RED)❌ Kong is not responding$(NC)'

##@ Backend Services

services-start: ## Start all backend services in background
	@echo '$(BLUE)🚀 Starting all backend services...$(NC)'
	@$(MAKE) -j6 \
		start-auth-service \
		start-content-service \
		start-video-service \
		start-voice-service \
		start-translation-service \
		start-analytics-service
	@echo '$(GREEN)✅ All services started$(NC)'

services-stop: ## Stop all backend services (includes Celery)
	@echo '$(BLUE)🛑 Stopping all backend services...$(NC)'
	@pkill -f "services/auth-service" || true
	@pkill -f "services/content-service" || true
	@pkill -f "services/video-processing-service" || true
	@pkill -f "services/voice-service" || true
	@pkill -f "services/translation-service" || true
	@pkill -f "services/analytics-service" || true
	@pkill -f "services/trend-service" || true
	@pkill -f "celery.*app.celery_app" || true
	@echo '$(GREEN)✅ All services stopped$(NC)'

start-auth-service: ## Start Auth Service (Go)
	@echo '$(CYAN)Starting Auth Service (Port 8002)...$(NC)'
	@cd services/auth-service && AUTH_SERVICE_PORT=8002 go run cmd/main.go > ../../logs/auth-service.log 2>&1 &
	@echo '$(GREEN)✅ Auth Service started on http://localhost:8002$(NC)'

start-content-service: ## Start Content Service (Go)
	@echo '$(CYAN)Starting Content Service (Port 8011)...$(NC)'
	@cd services/content-service && \
		export $$(grep -v '^#' ../../.env | xargs) && \
		CONTENT_SERVICE_PORT=8011 go run cmd/main.go > ../../logs/content-service.log 2>&1 &
	@echo '$(GREEN)✅ Content Service started on http://localhost:8011$(NC)'

start-video-service: ## Start Video Processing Service (Python)
	@echo '$(CYAN)Starting Video Processing Service (Port 8012)...$(NC)'
	@if [ -f services/video-processing-service/app/main.py ]; then \
		cd services/video-processing-service && python3 -m uvicorn app.main:app --reload --port 8012 > ../../logs/video-service.log 2>&1 &; \
		echo '$(GREEN)✅ Video Processing Service started on http://localhost:8012$(NC)'; \
	else \
		echo '$(YELLOW)⚠️  Video Processing Service not implemented yet$(NC)'; \
	fi

start-voice-service: ## Start Voice Service (Go)
	@echo '$(CYAN)Starting Voice Service (Port 8013)...$(NC)'
	@if [ -f services/voice-service/cmd/main.go ]; then \
		cd services/voice-service && VOICE_SERVICE_PORT=8013 go run cmd/main.go > ../../logs/voice-service.log 2>&1 &; \
		echo '$(GREEN)✅ Voice Service started on http://localhost:8013$(NC)'; \
	else \
		echo '$(YELLOW)⚠️  Voice Service not implemented yet$(NC)'; \
	fi

start-translation-service: ## Start Translation Service (Node.js)
	@echo '$(CYAN)Starting Translation Service (Port 8014)...$(NC)'
	@if [ -f services/translation-service/package.json ]; then \
		cd services/translation-service && PORT=8014 npm run dev > ../../logs/translation-service.log 2>&1 &; \
		echo '$(GREEN)✅ Translation Service started on http://localhost:8014$(NC)'; \
	else \
		echo '$(YELLOW)⚠️  Translation Service not implemented yet$(NC)'; \
	fi

start-analytics-service: ## Start Analytics Service (Go)
	@echo '$(CYAN)Starting Analytics Service (Port 8015)...$(NC)'
	@if [ -f services/analytics-service/cmd/main.go ]; then \
		cd services/analytics-service && ANALYTICS_SERVICE_PORT=8015 go run cmd/main.go > ../../logs/analytics-service.log 2>&1 &; \
		echo '$(GREEN)✅ Analytics Service started on http://localhost:8015$(NC)'; \
	else \
		echo '$(YELLOW)⚠️  Analytics Service not implemented yet$(NC)'; \
	fi

start-trend-service: ## Start Trend Service (Python)
	@echo '$(CYAN)Starting Trend Service (Port 8016)...$(NC)'
	@if [ -f services/trend-service/app/main.py ]; then \
		cd services/trend-service && python3 -m uvicorn app.main:app --reload --port 8016 > ../../logs/trend-service.log 2>&1 &; \
		echo '$(GREEN)✅ Trend Service started on http://localhost:8016$(NC)'; \
	else \
		echo '$(YELLOW)⚠️  Trend Service not implemented yet$(NC)'; \
	fi

##@ Background Jobs (Celery)

start-celery-worker: ## Start Celery worker for async video processing
	@echo '$(CYAN)Starting Celery Worker (8 concurrent workers)...$(NC)'
	@cd services/video-processing-service && \
		source venv/bin/activate && \
		celery -A app.celery_app worker --loglevel=info --concurrency=8 > ../../logs/celery-worker.log 2>&1 &
	@echo '$(GREEN)✅ Celery Worker started (check logs/celery-worker.log)$(NC)'

start-celery-beat: ## Start Celery beat scheduler for periodic tasks
	@echo '$(CYAN)Starting Celery Beat Scheduler...$(NC)'
	@cd services/video-processing-service && \
		source venv/bin/activate && \
		celery -A app.celery_app beat --loglevel=info > ../../logs/celery-beat.log 2>&1 &
	@echo '$(GREEN)✅ Celery Beat started (check logs/celery-beat.log)$(NC)'

start-flower: ## Start Flower monitoring UI (Port 5555)
	@echo '$(CYAN)Starting Flower Monitoring UI (Port 5555)...$(NC)'
	@cd services/video-processing-service && \
		source venv/bin/activate && \
		celery -A app.celery_app flower --port=5555 > ../../logs/flower.log 2>&1 &
	@echo '$(GREEN)✅ Flower started at http://localhost:5555$(NC)'

stop-celery: ## Stop all Celery workers and beat scheduler
	@echo '$(BLUE)🛑 Stopping Celery workers and beat...$(NC)'
	@pkill -f "celery.*app.celery_app" || true
	@echo '$(GREEN)✅ Celery stopped$(NC)'

celery-status: ## Check status of Celery workers
	@echo '$(CYAN)Celery Worker Status:$(NC)'
	@cd services/video-processing-service && \
		source venv/bin/activate && \
		celery -A app.celery_app inspect active || echo '$(YELLOW)No active workers found$(NC)'

celery-stats: ## Show Celery statistics
	@echo '$(CYAN)Celery Statistics:$(NC)'
	@cd services/video-processing-service && \
		source venv/bin/activate && \
		celery -A app.celery_app inspect stats || echo '$(YELLOW)No workers found$(NC)'

celery-purge: ## Purge all pending tasks from queue (⚠️  destructive)
	@echo '$(RED)⚠️  This will delete all pending jobs from the queue!$(NC)'
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@cd services/video-processing-service && \
		source venv/bin/activate && \
		celery -A app.celery_app purge -f
	@echo '$(GREEN)✅ Queue purged$(NC)'

celery-logs: ## View Celery worker logs
	@echo '$(CYAN)Celery Worker Logs:$(NC)'
	@tail -f logs/celery-worker.log 2>/dev/null || echo '$(YELLOW)No logs found. Worker may not be running.$(NC)'

job-queue-start: start-celery-worker start-celery-beat start-flower ## Start complete job queue system
	@echo ''
	@echo '$(GREEN)╔════════════════════════════════════════════╗$(NC)'
	@echo '$(GREEN)║  Job Queue System Started! 🚀              ║$(NC)'
	@echo '$(GREEN)╚════════════════════════════════════════════╝$(NC)'
	@echo ''
	@echo '$(CYAN)Components running:$(NC)'
	@echo '  ✅ Celery Worker (8 concurrent workers)'
	@echo '  ✅ Celery Beat (periodic tasks scheduler)'
	@echo '  ✅ Flower Monitoring at $(YELLOW)http://localhost:5555$(NC)'
	@echo ''
	@echo '$(CYAN)Useful commands:$(NC)'
	@echo '  Check status:    $(YELLOW)make celery-status$(NC)'
	@echo '  View logs:       $(YELLOW)make celery-logs$(NC)'
	@echo '  Stop all:        $(YELLOW)make stop-celery$(NC)'

##@ Frontend

frontend-dev: ## Start frontend in development mode (Port 4000)
	@echo '$(BLUE)🎨 Starting frontend (Port 4000)...$(NC)'
	@cd frontend && npm run dev

frontend-build: ## Build frontend for production
	@echo '$(BLUE)🎨 Building frontend...$(NC)'
	@cd frontend && npm run build
	@echo '$(GREEN)✅ Frontend built$(NC)'

frontend-start: ## Start frontend in production mode (Port 4000)
	@echo '$(BLUE)🎨 Starting frontend (production mode - Port 4000)...$(NC)'
	@cd frontend && npm start

##@ Development

dev: docker-up db-migrate kong-configure ## Start development environment (infrastructure only)
	@echo ''
	@echo '$(GREEN)╔════════════════════════════════════════════╗$(NC)'
	@echo '$(GREEN)║  Development Environment Ready!            ║$(NC)'
	@echo '$(GREEN)╚════════════════════════════════════════════╝$(NC)'
	@echo ''
	@echo '$(CYAN)Next steps:$(NC)'
	@echo '  1. Start backend services: $(YELLOW)make services-start$(NC)'
	@echo '  2. Start frontend: $(YELLOW)make frontend-dev$(NC)'
	@echo '  3. View logs: $(YELLOW)make logs$(NC)'
	@echo ''
	@echo '$(CYAN)Or start everything at once:$(NC)'
	@echo '  $(YELLOW)make start-all$(NC)'

start-all: docker-up db-migrate kong-configure ## Start everything (infrastructure + services + frontend)
	@mkdir -p logs
	@echo '$(BLUE)🚀 Starting all services...$(NC)'
	@sleep 3
	@$(MAKE) services-start
	@sleep 2
	@echo ''
	@echo '$(GREEN)╔════════════════════════════════════════════╗$(NC)'
	@echo '$(GREEN)║  ScriptSensei Global is Running! 🎉       ║$(NC)'
	@echo '$(GREEN)╚════════════════════════════════════════════╝$(NC)'
	@echo ''
	@echo '$(CYAN)Access the application:$(NC)'
	@echo '  Frontend:        $(YELLOW)http://localhost:4000$(NC)'
	@echo '  API Gateway:     $(YELLOW)http://localhost:8000$(NC)'
	@echo '  Kong Admin:      $(YELLOW)http://localhost:8001$(NC)'
	@echo '  RabbitMQ:        $(YELLOW)http://localhost:15672$(NC) (guest/guest)'
	@echo '  MinIO Console:   $(YELLOW)http://localhost:9001$(NC)'
	@echo '  Grafana:         $(YELLOW)http://localhost:4001$(NC) (admin/dev_password)'
	@echo ''
	@echo '$(CYAN)Useful commands:$(NC)'
	@echo '  View logs:       $(YELLOW)make logs$(NC)'
	@echo '  Stop all:        $(YELLOW)make stop-all$(NC)'
	@echo '  Run tests:       $(YELLOW)make test$(NC)'
	@echo ''
	@echo '$(YELLOW)Note: Frontend must be started separately with: make frontend-dev$(NC)'

stop-all: services-stop docker-down ## Stop everything
	@echo '$(GREEN)✅ All services stopped$(NC)'

restart-all: stop-all start-all ## Restart everything

##@ Logs

logs: ## View all service logs
	@mkdir -p logs
	@tail -f logs/*.log 2>/dev/null || echo '$(YELLOW)No logs found. Services may not have been started yet.$(NC)'

logs-auth: ## View Auth Service logs
	@tail -f logs/auth-service.log

logs-content: ## View Content Service logs
	@tail -f logs/content-service.log

logs-video: ## View Video Processing Service logs
	@tail -f logs/video-service.log

logs-voice: ## View Voice Service logs
	@tail -f logs/voice-service.log

logs-translation: ## View Translation Service logs
	@tail -f logs/translation-service.log

logs-analytics: ## View Analytics Service logs
	@tail -f logs/analytics-service.log

logs-clear: ## Clear all logs
	@rm -rf logs/*.log
	@echo '$(GREEN)✅ Logs cleared$(NC)'

##@ Testing

test: ## Run all tests
	@echo '$(BLUE)🧪 Running all tests...$(NC)'
	@chmod +x scripts/run-all-tests.sh
	@./scripts/run-all-tests.sh

test-coverage: ## Run all tests with coverage
	@echo '$(BLUE)🧪 Running all tests with coverage...$(NC)'
	@chmod +x scripts/run-all-tests.sh
	@./scripts/run-all-tests.sh --coverage

test-verbose: ## Run all tests with verbose output
	@echo '$(BLUE)🧪 Running all tests (verbose)...$(NC)'
	@chmod +x scripts/run-all-tests.sh
	@./scripts/run-all-tests.sh --verbose

test-unit: ## Run unit tests only
	@echo '$(BLUE)🧪 Running unit tests...$(NC)'
	@for service in services/*/; do \
		if [ -f "$$service/Makefile" ]; then \
			echo "Testing $$service"; \
			cd $$service && make test-unit && cd ../..; \
		fi; \
	done

test-e2e: ## Run E2E tests
	@echo '$(BLUE)🧪 Running E2E tests...$(NC)'
	@for service in services/*/; do \
		if [ -d "$$service/tests/e2e" ]; then \
			echo "E2E testing $$service"; \
			cd $$service && go test -v -tags=e2e ./tests/e2e/... && cd ../..; \
		fi; \
	done

##@ Code Quality

lint: ## Run linters for all services
	@echo '$(BLUE)🔍 Running linters...$(NC)'
	@$(MAKE) lint-go
	@$(MAKE) lint-python
	@$(MAKE) lint-node

lint-go: ## Run Go linters
	@echo '$(CYAN)Linting Go services...$(NC)'
	@for service in services/auth-service services/content-service services/voice-service services/analytics-service; do \
		if [ -d "$$service" ]; then \
			echo "  → $$service"; \
			cd $$service && golangci-lint run --timeout=5m && cd ../..; \
		fi; \
	done

lint-python: ## Run Python linters
	@echo '$(CYAN)Linting Python services...$(NC)'
	@for service in services/video-processing-service services/trend-service; do \
		if [ -d "$$service" ]; then \
			echo "  → $$service"; \
			cd $$service && black --check . && flake8 . && cd ../..; \
		fi; \
	done

lint-node: ## Run Node.js linters
	@echo '$(CYAN)Linting Node.js services...$(NC)'
	@for service in services/translation-service frontend; do \
		if [ -d "$$service" ]; then \
			echo "  → $$service"; \
			cd $$service && npm run lint && cd ..; \
		fi; \
	done

format: ## Format code for all services
	@echo '$(BLUE)📝 Formatting code...$(NC)'
	@$(MAKE) format-go
	@$(MAKE) format-python
	@$(MAKE) format-node

format-go: ## Format Go code
	@echo '$(CYAN)Formatting Go services...$(NC)'
	@for service in services/auth-service services/content-service services/voice-service services/analytics-service; do \
		if [ -d "$$service" ]; then \
			echo "  → $$service"; \
			cd $$service && go fmt ./... && cd ../..; \
		fi; \
	done

format-python: ## Format Python code
	@echo '$(CYAN)Formatting Python services...$(NC)'
	@for service in services/video-processing-service services/trend-service; do \
		if [ -d "$$service" ]; then \
			echo "  → $$service"; \
			cd $$service && black . && isort . && cd ../..; \
		fi; \
	done

format-node: ## Format Node.js code
	@echo '$(CYAN)Formatting Node.js services...$(NC)'
	@for service in services/translation-service frontend; do \
		if [ -d "$$service" ]; then \
			echo "  → $$service"; \
			cd $$service && npm run format 2>/dev/null || true && cd ..; \
		fi; \
	done

##@ Build

build: ## Build all services
	@echo '$(BLUE)🔨 Building all services...$(NC)'
	@$(MAKE) build-go
	@$(MAKE) build-frontend
	@echo '$(GREEN)✅ All services built$(NC)'

build-go: ## Build Go services
	@echo '$(CYAN)Building Go services...$(NC)'
	@for service in services/auth-service services/content-service services/voice-service services/analytics-service; do \
		if [ -d "$$service" ]; then \
			echo "  → $$service"; \
			cd $$service && make build && cd ../..; \
		fi; \
	done

build-frontend: ## Build frontend
	@echo '$(CYAN)Building frontend...$(NC)'
	@cd frontend && npm run build

build-docker: ## Build Docker images for all services
	@echo '$(BLUE)🐳 Building Docker images...$(NC)'
	@$(DOCKER_COMPOSE) build
	@echo '$(GREEN)✅ Docker images built$(NC)'

##@ Cleanup

clean: ## Clean build artifacts and caches
	@echo '$(BLUE)🧹 Cleaning...$(NC)'
	@find . -type d -name "bin" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name "build" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type f -name "coverage.out" -delete 2>/dev/null || true
	@find . -type f -name "coverage.xml" -delete 2>/dev/null || true
	@rm -rf logs/*.log
	@echo '$(GREEN)✅ Cleaned$(NC)'

clean-all: clean docker-clean ## Clean everything including Docker

##@ Monitoring

status: ## Show status of all services
	@echo '$(BLUE)📊 Service Status$(NC)'
	@echo ''
	@echo '$(CYAN)Docker Infrastructure:$(NC)'
	@$(DOCKER_COMPOSE) ps
	@echo ''
	@echo '$(CYAN)Backend Services:$(NC)'
	@ps aux | grep "services/" | grep -v grep || echo "No services running"
	@echo ''
	@echo '$(CYAN)Ports in use:$(NC)'
	@lsof -i :4000 -i :8000 -i :8001 -i :8002 -i :8011 -i :8012 -i :8013 -i :8014 -i :8015 -i :8016 2>/dev/null || echo "No ports in use"

health: ## Check health of all services
	@echo '$(BLUE)🏥 Health Check$(NC)'
	@echo ''
	@echo '$(CYAN)Kong API Gateway:$(NC)'
	@curl -s http://localhost:8001/status | jq '.server.connections_accepted' && echo '$(GREEN)✅ Kong is healthy$(NC)' || echo '$(RED)❌ Kong is not responding$(NC)'
	@echo ''
	@echo '$(CYAN)PostgreSQL:$(NC)'
	@docker exec scriptsensei-postgres pg_isready && echo '$(GREEN)✅ PostgreSQL is healthy$(NC)' || echo '$(RED)❌ PostgreSQL is not responding$(NC)'
	@echo ''
	@echo '$(CYAN)Redis:$(NC)'
	@docker exec scriptsensei-redis redis-cli ping | grep PONG && echo '$(GREEN)✅ Redis is healthy$(NC)' || echo '$(RED)❌ Redis is not responding$(NC)'
	@echo ''
	@echo '$(CYAN)MongoDB:$(NC)'
	@docker exec scriptsensei-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null && echo '$(GREEN)✅ MongoDB is healthy$(NC)' || echo '$(RED)❌ MongoDB is not responding$(NC)'

##@ Documentation

docs: ## Open documentation
	@echo '$(BLUE)📚 Available Documentation:$(NC)'
	@echo ''
	@echo '  $(CYAN)README.md$(NC)                    - Project overview'
	@echo '  $(CYAN)MAKE_COMMANDS.md$(NC)             - Makefile usage guide'
	@echo '  $(CYAN)TESTING_GUIDE.md$(NC)             - Complete testing guide'
	@echo '  $(CYAN)TDD_CHEAT_SHEET.md$(NC)           - TDD quick reference'
	@echo '  $(CYAN)TESTING_QUICKSTART.md$(NC)        - Get started with testing'
	@echo '  $(CYAN)CLAUDE.md$(NC)                    - Guide for Claude instances'
	@echo '  $(CYAN)docs/CLERK_AUTHENTICATION.md$(NC) - Clerk auth integration'
	@echo '  $(CYAN)docs/JWT_AUTHENTICATION.md$(NC)   - JWT details'

##@ Git Hooks

hooks-install: ## Install git hooks
	@echo '$(BLUE)🔧 Installing git hooks...$(NC)'
	@pip install pre-commit
	@pre-commit install
	@echo '$(GREEN)✅ Git hooks installed$(NC)'

hooks-run: ## Run pre-commit hooks manually
	@pre-commit run --all-files

##@ Quick Actions

quick-start: check-prereqs check-env docker-up db-migrate ## Quick start (minimal setup)
	@echo ''
	@echo '$(GREEN)╔════════════════════════════════════════════╗$(NC)'
	@echo '$(GREEN)║  Quick Start Complete!                     ║$(NC)'
	@echo '$(GREEN)╚════════════════════════════════════════════╝$(NC)'
	@echo ''
	@echo '$(CYAN)Infrastructure is ready!$(NC)'
	@echo ''
	@echo '$(YELLOW)Next: Start services with: make services-start$(NC)'
	@echo '$(YELLOW)Then: Start frontend with: make frontend-dev$(NC)'

reset: stop-all clean docker-clean ## Reset everything (nuclear option)
	@echo '$(GREEN)✅ Everything reset$(NC)'
	@echo '$(YELLOW)Run "make install" to reinstall dependencies$(NC)'
