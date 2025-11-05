#!/bin/bash

# check-coverage.sh - Verify test coverage meets minimum threshold
# Usage: ./check-coverage.sh [service-path] [threshold]

set -e

SERVICE_PATH=${1:-.}
THRESHOLD=${2:-80}

echo "🧪 Checking test coverage for: $SERVICE_PATH"
echo "📊 Minimum threshold: ${THRESHOLD}%"

cd "$SERVICE_PATH"

# Detect service type and run appropriate coverage check
if [ -f "go.mod" ]; then
    echo "🔍 Detected Go service"

    # Run tests with coverage
    go test -v -race -coverprofile=coverage.out -covermode=atomic ./... 2>&1 | tee test-output.log

    # Check if tests passed
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        echo "❌ Tests failed!"
        exit 1
    fi

    # Calculate coverage
    COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | sed 's/%//')

    echo "📈 Current coverage: ${COVERAGE}%"

    # Compare coverage with threshold
    if (( $(echo "$COVERAGE < $THRESHOLD" | bc -l) )); then
        echo "❌ Coverage ${COVERAGE}% is below ${THRESHOLD}% threshold"
        echo ""
        echo "💡 Tip: Write more unit tests to increase coverage!"
        echo "   Run 'make test-coverage' to see detailed coverage report"
        exit 1
    fi

    echo "✅ Coverage ${COVERAGE}% meets ${THRESHOLD}% threshold"

elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
    echo "🔍 Detected Python service"

    # Run tests with coverage
    pytest tests/ -v --cov=. --cov-report=xml --cov-report=term 2>&1 | tee test-output.log

    # Check if tests passed
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        echo "❌ Tests failed!"
        exit 1
    fi

    # Calculate coverage from coverage.xml
    if [ -f "coverage.xml" ]; then
        COVERAGE=$(python3 -c "import xml.etree.ElementTree as ET; tree = ET.parse('coverage.xml'); root = tree.getroot(); print(float(root.attrib['line-rate']) * 100)")

        echo "📈 Current coverage: ${COVERAGE}%"

        if (( $(echo "$COVERAGE < $THRESHOLD" | bc -l) )); then
            echo "❌ Coverage ${COVERAGE}% is below ${THRESHOLD}% threshold"
            echo ""
            echo "💡 Tip: Write more unit tests to increase coverage!"
            echo "   Run 'pytest --cov=. --cov-report=html' for detailed report"
            exit 1
        fi

        echo "✅ Coverage ${COVERAGE}% meets ${THRESHOLD}% threshold"
    else
        echo "⚠️  Coverage report not found"
        exit 1
    fi

elif [ -f "package.json" ]; then
    echo "🔍 Detected Node.js service"

    # Run tests with coverage
    npm test -- --coverage --coverageReporters=json-summary --coverageReporters=text 2>&1 | tee test-output.log

    # Check if tests passed
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        echo "❌ Tests failed!"
        exit 1
    fi

    # Calculate coverage from coverage-summary.json
    if [ -f "coverage/coverage-summary.json" ]; then
        COVERAGE=$(node -p "require('./coverage/coverage-summary.json').total.lines.pct")

        echo "📈 Current coverage: ${COVERAGE}%"

        if (( $(echo "$COVERAGE < $THRESHOLD" | bc -l) )); then
            echo "❌ Coverage ${COVERAGE}% is below ${THRESHOLD}% threshold"
            echo ""
            echo "💡 Tip: Write more unit tests to increase coverage!"
            echo "   Run 'npm test -- --coverage' for detailed report"
            exit 1
        fi

        echo "✅ Coverage ${COVERAGE}% meets ${THRESHOLD}% threshold"
    else
        echo "⚠️  Coverage report not found"
        exit 1
    fi

else
    echo "⚠️  Unknown service type - skipping coverage check"
    exit 0
fi

echo ""
echo "✅ All coverage checks passed!"
