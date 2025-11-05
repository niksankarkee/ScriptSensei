#!/bin/bash

# run-all-tests.sh - Run tests for all services
# Usage: ./run-all-tests.sh [--coverage] [--verbose]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
COVERAGE=false
VERBOSE=false

for arg in "$@"; do
    case $arg in
        --coverage)
            COVERAGE=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
    esac
done

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ScriptSensei Global - Test Suite Runner  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Track results
FAILED_SERVICES=()
PASSED_SERVICES=()
TOTAL_TESTS=0
FAILED_TESTS=0

# Function to run tests for a service
run_service_tests() {
    local service_name=$1
    local service_path=$2
    local test_command=$3

    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}🧪 Testing: $service_name${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    cd "$service_path" || {
        echo -e "${RED}❌ Failed to enter directory: $service_path${NC}"
        FAILED_SERVICES+=("$service_name")
        return 1
    }

    # Run tests
    if [ "$VERBOSE" = true ]; then
        eval "$test_command" 2>&1 | tee test-output.log
    else
        eval "$test_command" > test-output.log 2>&1
    fi

    TEST_RESULT=${PIPESTATUS[0]}

    if [ $TEST_RESULT -eq 0 ]; then
        echo -e "${GREEN}✅ $service_name: PASSED${NC}"
        PASSED_SERVICES+=("$service_name")

        # Show coverage if requested
        if [ "$COVERAGE" = true ]; then
            if [ -f "coverage.out" ]; then
                COVERAGE_PCT=$(go tool cover -func=coverage.out | grep total | awk '{print $3}')
                echo -e "${GREEN}   Coverage: $COVERAGE_PCT${NC}"
            elif [ -f "coverage.xml" ]; then
                COVERAGE_PCT=$(python3 -c "import xml.etree.ElementTree as ET; tree = ET.parse('coverage.xml'); root = tree.getroot(); print(f\"{float(root.attrib['line-rate']) * 100:.2f}%\")" 2>/dev/null || echo "N/A")
                echo -e "${GREEN}   Coverage: $COVERAGE_PCT${NC}"
            elif [ -f "coverage/coverage-summary.json" ]; then
                COVERAGE_PCT=$(node -p "require('./coverage/coverage-summary.json').total.lines.pct + '%'" 2>/dev/null || echo "N/A")
                echo -e "${GREEN}   Coverage: $COVERAGE_PCT${NC}"
            fi
        fi
    else
        echo -e "${RED}❌ $service_name: FAILED${NC}"
        FAILED_SERVICES+=("$service_name")
        FAILED_TESTS=$((FAILED_TESTS + 1))

        # Show last 20 lines of error output
        if [ "$VERBOSE" = false ]; then
            echo -e "${YELLOW}Last 20 lines of output:${NC}"
            tail -n 20 test-output.log
        fi
    fi

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    # Return to root directory
    cd - > /dev/null || return 1
}

# Get root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR" || exit 1

echo -e "${BLUE}📁 Root directory: $ROOT_DIR${NC}"
echo -e "${BLUE}🎯 Coverage mode: $COVERAGE${NC}"
echo -e "${BLUE}📢 Verbose mode: $VERBOSE${NC}"

# Test Go services
if [ -d "services/auth-service" ]; then
    run_service_tests "Auth Service (Go)" \
        "$ROOT_DIR/services/auth-service" \
        "go test -v -race -coverprofile=coverage.out ./..."
fi

if [ -d "services/content-service" ]; then
    run_service_tests "Content Service (Go)" \
        "$ROOT_DIR/services/content-service" \
        "go test -v -race -coverprofile=coverage.out ./..."
fi

if [ -d "services/voice-service" ]; then
    run_service_tests "Voice Service (Go)" \
        "$ROOT_DIR/services/voice-service" \
        "go test -v -race -coverprofile=coverage.out ./..."
fi

if [ -d "services/analytics-service" ]; then
    run_service_tests "Analytics Service (Go)" \
        "$ROOT_DIR/services/analytics-service" \
        "go test -v -race -coverprofile=coverage.out ./..."
fi

if [ -d "services/trend-service" ]; then
    run_service_tests "Trend Service (Go)" \
        "$ROOT_DIR/services/trend-service" \
        "go test -v -race -coverprofile=coverage.out ./..."
fi

# Test Python services
if [ -d "services/video-processing-service" ]; then
    run_service_tests "Video Processing Service (Python)" \
        "$ROOT_DIR/services/video-processing-service" \
        "pytest tests/ -v --cov=app --cov-report=xml --cov-report=term"
fi

if [ -d "services/analytics-service" ] && [ -f "services/analytics-service/requirements.txt" ]; then
    run_service_tests "Analytics Service (Python)" \
        "$ROOT_DIR/services/analytics-service" \
        "pytest tests/ -v --cov=app --cov-report=xml --cov-report=term"
fi

# Test Node.js services
if [ -d "services/translation-service" ]; then
    run_service_tests "Translation Service (Node.js)" \
        "$ROOT_DIR/services/translation-service" \
        "npm test -- --coverage --passWithNoTests"
fi

# Test Frontend
if [ -d "frontend" ]; then
    run_service_tests "Frontend (Next.js)" \
        "$ROOT_DIR/frontend" \
        "npm test -- --coverage --passWithNoTests"
fi

# Print summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           TEST SUMMARY                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Total services tested: $TOTAL_TESTS${NC}"
echo -e "${GREEN}Passed: ${#PASSED_SERVICES[@]}${NC}"
echo -e "${RED}Failed: ${#FAILED_SERVICES[@]}${NC}"
echo ""

if [ ${#PASSED_SERVICES[@]} -gt 0 ]; then
    echo -e "${GREEN}✅ Passed services:${NC}"
    for service in "${PASSED_SERVICES[@]}"; do
        echo -e "${GREEN}   • $service${NC}"
    done
    echo ""
fi

if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
    echo -e "${RED}❌ Failed services:${NC}"
    for service in "${FAILED_SERVICES[@]}"; do
        echo -e "${RED}   • $service${NC}"
    done
    echo ""
    echo -e "${YELLOW}💡 Tip: Run with --verbose flag to see detailed output${NC}"
    echo -e "${YELLOW}💡 Tip: Check individual service logs for more details${NC}"
    echo ""
    exit 1
else
    echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ ALL TESTS PASSED! 🎉                   ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
    echo ""

    if [ "$COVERAGE" = true ]; then
        echo -e "${BLUE}📊 Coverage reports generated for all services${NC}"
        echo -e "${BLUE}   View individual reports in each service directory${NC}"
    fi

    echo ""
    exit 0
fi
