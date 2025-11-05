# Docker Compose Compatibility Fix

**Issue**: Makefile was using `docker-compose` (v1) command which is deprecated in newer Docker Desktop versions.

**Error**:
```
make: docker-compose: No such file or directory
make: *** [docker-up] Error 1
```

## Solution Applied

### 1. Auto-Detection of Docker Compose Version

Added automatic detection at the top of the Makefile:

```makefile
# Detect Docker Compose command (v1 vs v2)
DOCKER_COMPOSE := $(shell command -v docker-compose 2>/dev/null)
ifndef DOCKER_COMPOSE
	DOCKER_COMPOSE := docker compose
endif
```

This checks:
- **First**: If `docker-compose` (v1) exists
- **Fallback**: Use `docker compose` (v2) if v1 not found

### 2. Updated All References

Replaced all hardcoded `docker-compose` commands with `$(DOCKER_COMPOSE)` variable:

```makefile
# Before
docker-compose up -d

# After
$(DOCKER_COMPOSE) up -d
```

### 3. Updated Prerequisites Check

Enhanced `make check-prereqs` to detect both versions:

```makefile
@if command -v docker-compose >/dev/null 2>&1; then \
    echo '✅ Docker Compose (v1) found'; \
elif docker compose version >/dev/null 2>&1; then \
    echo '✅ Docker Compose (v2) found'; \
else \
    echo '❌ Docker Compose is not installed'; exit 1; \
fi
```

## Docker Compose Versions

### Version 1 (Standalone)
- Command: `docker-compose`
- Install: Separate binary
- **Deprecated** in newer Docker Desktop

### Version 2 (Plugin)
- Command: `docker compose` (with space)
- Install: Built into Docker Desktop
- **Current** standard

## Testing the Fix

```bash
# Check prerequisites
make check-prereqs

# Should show:
# ✅ Docker Compose (v2) found
# Docker Compose: 2.39.1-desktop.1

# Test Docker commands
make docker-up     # Start infrastructure
make docker-ps     # Show containers
make docker-down   # Stop infrastructure
```

## Commands Fixed

All these commands now work with both Docker Compose v1 and v2:

- `make docker-up`
- `make docker-down`
- `make docker-restart`
- `make docker-clean`
- `make docker-logs`
- `make docker-ps`
- `make db-reset`
- `make build-docker`
- `make status`
- `make dev`
- `make start-all`

## Verification

Your system has:
- **Docker**: 28.3.2
- **Docker Compose**: 2.39.1-desktop.1 (v2)
- **Go**: go1.25.0
- **Python**: 3.13.0
- **Node**: v20.18.0

All prerequisites met! ✅

## Usage

Now you can run:

```bash
# Start development environment
make dev

# Or start everything
make start-all

# Check status
make status

# View logs
make docker-logs
```

## Additional Notes

- The Makefile now automatically adapts to your Docker Compose version
- No manual configuration needed
- Works on both old and new Docker Desktop installations
- Compatible with CI/CD environments that may use either version

---

**Status**: ✅ Fixed and Tested
**Date**: January 2025
