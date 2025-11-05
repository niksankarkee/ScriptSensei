# Makefile for Auth Service

.PHONY: help test test-unit test-integration test-coverage lint build run clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

test: ## Run all tests
	@echo "Running all tests..."
	go test -v -race -coverprofile=coverage.out ./...
	@echo "\nTest coverage summary:"
	go tool cover -func=coverage.out | grep total

test-unit: ## Run unit tests only
	@echo "Running unit tests..."
	go test -v -short -race ./...

test-integration: ## Run integration tests only
	@echo "Running integration tests..."
	go test -v -run Integration ./...

test-coverage: ## Generate test coverage report
	@echo "Generating coverage report..."
	go test -v -race -coverprofile=coverage.out -covermode=atomic ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"
	go tool cover -func=coverage.out

test-watch: ## Run tests in watch mode
	@echo "Running tests in watch mode..."
	@which gotestsum > /dev/null || (echo "Installing gotestsum..." && go install gotest.tools/gotestsum@latest)
	gotestsum --watch

lint: ## Run linters
	@echo "Running linters..."
	@which golangci-lint > /dev/null || (echo "Installing golangci-lint..." && go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest)
	golangci-lint run --timeout=5m

build: ## Build the service
	@echo "Building auth-service..."
	go build -o bin/auth-service cmd/main.go

run: ## Run the service
	@echo "Starting auth-service..."
	go run cmd/main.go

clean: ## Clean build artifacts and test cache
	@echo "Cleaning..."
	rm -rf bin/
	rm -f coverage.out coverage.html
	go clean -testcache

deps: ## Download dependencies
	@echo "Downloading dependencies..."
	go mod download
	go mod tidy

deps-update: ## Update dependencies
	@echo "Updating dependencies..."
	go get -u ./...
	go mod tidy

docker-build: ## Build Docker image
	@echo "Building Docker image..."
	docker build -t scriptsensei/auth-service:latest .

docker-run: ## Run Docker container
	@echo "Running Docker container..."
	docker run -p 8001:8001 --env-file ../../.env scriptsensei/auth-service:latest

# TDD workflow targets
tdd-red: ## RED phase - Write failing test
	@echo "🔴 RED: Write a failing test first!"
	@echo "Example: go test -v -run TestYourNewFeature ./..."

tdd-green: test-unit ## GREEN phase - Make test pass
	@echo "🟢 GREEN: Tests passing! Now refactor if needed."

tdd-refactor: test lint ## REFACTOR phase - Improve code while keeping tests green
	@echo "🔵 REFACTOR: Code refactored and all tests still passing!"

.DEFAULT_GOAL := help
