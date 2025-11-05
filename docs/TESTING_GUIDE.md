# Testing Guide - ScriptSensei Global

## 🎯 Overview

ScriptSensei Global follows **Test-Driven Development (TDD)** practices. All code must be tested before being merged.

## 📋 Testing Standards

### Coverage Requirements

| Test Type | Minimum Coverage | Target Coverage |
|-----------|------------------|-----------------|
| Unit Tests | 80% | 90%+ |
| Integration Tests | Critical paths | All integrations |
| E2E Tests | User workflows | All features |

### Test Pyramid

```
        /\
       /  \     E2E Tests (Few)
      /____\    - Complete user workflows
     /      \   - Critical business flows
    /________\  Integration Tests (Some)
   /          \ - API endpoints
  /____________\- Service interactions
 /              \
/________________\ Unit Tests (Many)
                   - Functions
                   - Methods
                   - Components
```

## 🔴🟢🔵 TDD Workflow

### 1. RED Phase - Write Failing Test

```bash
# Create a new test file
touch services/content-service/internal/handler/script_test.go

# Write a failing test
```

**Example (Go)**:
```go
func TestCreateScript_Success(t *testing.T) {
    // Arrange
    handler := NewScriptHandler(mockRepo)
    requestBody := `{"title":"Test Script","content":"Test"}`

    // Act
    resp := makeRequest("POST", "/api/v1/scripts", requestBody)

    // Assert
    assert.Equal(t, 201, resp.StatusCode)
}
```

Run test - it should **FAIL**:
```bash
cd services/content-service
make test-unit
# Expected: FAIL - function not implemented
```

### 2. GREEN Phase - Make Test Pass

Implement minimal code to pass the test:

```go
func (h *ScriptHandler) CreateScript(c *fiber.Ctx) error {
    var req CreateScriptRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
    }

    script, err := h.repo.Create(req)
    if err != nil {
        return c.Status(500).JSON(fiber.Map{"error": err.Error()})
    }

    return c.Status(201).JSON(script)
}
```

Run test - it should **PASS**:
```bash
make test-unit
# Expected: PASS
```

### 3. REFACTOR Phase - Improve Code

Refactor while keeping tests green:

```go
func (h *ScriptHandler) CreateScript(c *fiber.Ctx) error {
    // Validate request
    req, err := h.validateCreateScriptRequest(c)
    if err != nil {
        return h.sendError(c, 400, err)
    }

    // Create script
    script, err := h.createScriptWithDefaults(req)
    if err != nil {
        return h.sendError(c, 500, err)
    }

    return h.sendSuccess(c, 201, script)
}
```

Run tests again - still **GREEN**:
```bash
make test-unit
# Expected: PASS (all tests)
```

## 🧪 Testing by Language

### Go Services

**File structure**:
```
services/content-service/
├── internal/
│   ├── handler/
│   │   ├── script.go
│   │   └── script_test.go        # Unit tests
│   ├── repository/
│   │   ├── script_repo.go
│   │   └── script_repo_test.go
│   └── service/
│       ├── script_service.go
│       └── script_service_test.go
└── tests/
    ├── integration/
    │   └── api_test.go            # Integration tests
    └── e2e/
        └── workflow_test.go       # E2E tests
```

**Commands**:
```bash
# Run all tests
make test

# Run unit tests only
make test-unit

# Run with coverage
make test-coverage

# Run integration tests
make test-integration

# Run E2E tests
go test -v -tags=e2e ./tests/e2e/...

# Run specific test
go test -v -run TestCreateScript ./internal/handler/

# Watch mode
make test-watch
```

**Writing tests**:
```go
package handler

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
    "github.com/stretchr/testify/require"
)

// MockRepository mocks the repository interface
type MockRepository struct {
    mock.Mock
}

func (m *MockRepository) Create(req CreateScriptRequest) (*Script, error) {
    args := m.Called(req)
    if args.Get(0) == nil {
        return nil, args.Error(1)
    }
    return args.Get(0).(*Script), args.Error(1)
}

func TestCreateScript_Success(t *testing.T) {
    // Arrange
    mockRepo := new(MockRepository)
    handler := NewScriptHandler(mockRepo)

    expectedScript := &Script{
        ID:    "script_123",
        Title: "Test Script",
    }

    mockRepo.On("Create", mock.Anything).Return(expectedScript, nil)

    app := fiber.New()
    app.Post("/scripts", handler.CreateScript)

    // Act
    req := httptest.NewRequest("POST", "/scripts",
        strings.NewReader(`{"title":"Test Script"}`))
    req.Header.Set("Content-Type", "application/json")
    resp, _ := app.Test(req)

    // Assert
    require.Equal(t, 201, resp.StatusCode)

    var result Script
    json.NewDecoder(resp.Body).Decode(&result)
    assert.Equal(t, "script_123", result.ID)

    mockRepo.AssertExpectations(t)
}

func TestCreateScript_ValidationError(t *testing.T) {
    // Arrange
    mockRepo := new(MockRepository)
    handler := NewScriptHandler(mockRepo)

    app := fiber.New()
    app.Post("/scripts", handler.CreateScript)

    // Act
    req := httptest.NewRequest("POST", "/scripts",
        strings.NewReader(`{"invalid":"json"}`))
    resp, _ := app.Test(req)

    // Assert
    assert.Equal(t, 400, resp.StatusCode)
}
```

**Table-driven tests**:
```go
func TestCreateScript_Various(t *testing.T) {
    tests := []struct {
        name           string
        input          string
        expectedStatus int
        expectedError  string
    }{
        {
            name:           "Valid request",
            input:          `{"title":"Test","content":"Content"}`,
            expectedStatus: 201,
        },
        {
            name:           "Missing title",
            input:          `{"content":"Content"}`,
            expectedStatus: 400,
            expectedError:  "title is required",
        },
        {
            name:           "Empty content",
            input:          `{"title":"Test","content":""}`,
            expectedStatus: 400,
            expectedError:  "content cannot be empty",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Test implementation
        })
    }
}
```

### Python Services

**File structure**:
```
services/video-processing-service/
├── app/
│   ├── main.py
│   ├── routers/
│   │   └── video.py
│   ├── services/
│   │   └── video_service.py
│   └── models/
│       └── video.py
└── tests/
    ├── unit/
    │   ├── test_video_service.py
    │   └── test_video_router.py
    ├── integration/
    │   └── test_api.py
    └── e2e/
        └── test_workflow.py
```

**Commands**:
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html --cov-report=term

# Run specific test file
pytest tests/unit/test_video_service.py

# Run specific test
pytest tests/unit/test_video_service.py::test_process_video_success

# Run with verbosity
pytest -v

# Run failed tests only
pytest --lf

# Run in parallel
pytest -n auto

# Watch mode
ptw
```

**Writing tests**:
```python
import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.video_service import VideoService

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def mock_video_service():
    return Mock(spec=VideoService)

class TestVideoProcessing:
    """Test suite for video processing"""

    def test_process_video_success(self, mock_video_service):
        # Arrange
        video_data = {
            "url": "https://example.com/video.mp4",
            "format": "mp4"
        }
        expected_result = {
            "id": "video_123",
            "status": "processing"
        }
        mock_video_service.process.return_value = expected_result

        # Act
        result = mock_video_service.process(video_data)

        # Assert
        assert result["id"] == "video_123"
        assert result["status"] == "processing"
        mock_video_service.process.assert_called_once_with(video_data)

    def test_process_video_invalid_url(self, mock_video_service):
        # Arrange
        invalid_data = {"url": "invalid", "format": "mp4"}
        mock_video_service.process.side_effect = ValueError("Invalid URL")

        # Act & Assert
        with pytest.raises(ValueError, match="Invalid URL"):
            mock_video_service.process(invalid_data)

    @pytest.mark.asyncio
    async def test_async_video_processing(self):
        # Arrange
        service = VideoService()
        video_id = "video_123"

        # Act
        result = await service.process_async(video_id)

        # Assert
        assert result["status"] == "completed"

# Parametrized tests
@pytest.mark.parametrize("input_format,expected_output", [
    ("mp4", "video/mp4"),
    ("avi", "video/avi"),
    ("mov", "video/quicktime"),
])
def test_format_conversion(input_format, expected_output):
    result = convert_format(input_format)
    assert result == expected_output

# Fixture with cleanup
@pytest.fixture
def temp_video_file():
    # Setup
    file_path = "/tmp/test_video.mp4"
    create_temp_file(file_path)

    yield file_path

    # Teardown
    os.remove(file_path)
```

### Node.js Services

**File structure**:
```
services/translation-service/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   └── translation.ts
│   ├── services/
│   │   └── translationService.ts
│   └── models/
│       └── Translation.ts
└── tests/
    ├── unit/
    │   └── translationService.test.ts
    ├── integration/
    │   └── api.test.ts
    └── e2e/
        └── workflow.test.ts
```

**Commands**:
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- translationService.test.ts

# Run in watch mode
npm test -- --watch

# Run with coverage threshold
npm test -- --coverage --coverageThreshold='{"global":{"lines":80}}'
```

**Writing tests (Jest)**:
```typescript
import { TranslationService } from '../services/translationService';
import { mockDeep, mockReset } from 'jest-mock-extended';

describe('TranslationService', () => {
  let service: TranslationService;
  let mockGoogleTranslate: any;

  beforeEach(() => {
    mockGoogleTranslate = mockDeep<GoogleTranslate>();
    service = new TranslationService(mockGoogleTranslate);
  });

  afterEach(() => {
    mockReset(mockGoogleTranslate);
  });

  describe('translate', () => {
    it('should translate text successfully', async () => {
      // Arrange
      const input = {
        text: 'Hello',
        from: 'en',
        to: 'es'
      };
      const expected = 'Hola';

      mockGoogleTranslate.translate
        .mockResolvedValue([expected]);

      // Act
      const result = await service.translate(input);

      // Assert
      expect(result).toBe(expected);
      expect(mockGoogleTranslate.translate).toHaveBeenCalledWith(
        input.text,
        { from: input.from, to: input.to }
      );
    });

    it('should throw error for invalid language code', async () => {
      // Arrange
      const input = {
        text: 'Hello',
        from: 'invalid',
        to: 'es'
      };

      // Act & Assert
      await expect(service.translate(input))
        .rejects
        .toThrow('Invalid language code');
    });
  });

  describe('detectLanguage', () => {
    it('should detect language correctly', async () => {
      // Arrange
      const text = 'Bonjour';
      mockGoogleTranslate.detect.mockResolvedValue([{ language: 'fr' }]);

      // Act
      const result = await service.detectLanguage(text);

      // Assert
      expect(result).toBe('fr');
    });
  });
});

// Parametrized tests
describe.each([
  ['Hello', 'en', 'es', 'Hola'],
  ['Goodbye', 'en', 'fr', 'Au revoir'],
  ['Thank you', 'en', 'ja', 'ありがとう'],
])('translate(%s, %s, %s)', (text, from, to, expected) => {
  it(`should translate "${text}" to "${expected}"`, async () => {
    mockGoogleTranslate.translate.mockResolvedValue([expected]);

    const result = await service.translate({ text, from, to });

    expect(result).toBe(expected);
  });
});
```

### Frontend (React/Next.js)

**File structure**:
```
frontend/
├── app/
│   └── dashboard/
│       ├── page.tsx
│       └── page.test.tsx
├── components/
│   ├── ScriptCard.tsx
│   └── ScriptCard.test.tsx
└── __tests__/
    └── e2e/
        └── dashboard.spec.ts
```

**Commands**:
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run E2E tests (Playwright)
npx playwright test

# Run specific E2E test
npx playwright test dashboard

# Debug E2E test
npx playwright test --debug
```

**Writing tests (React Testing Library)**:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ScriptCard } from './ScriptCard';
import '@testing-library/jest-dom';

describe('ScriptCard', () => {
  const mockScript = {
    id: 'script_123',
    title: 'Test Script',
    description: 'Test description',
    createdAt: '2025-01-01T00:00:00Z'
  };

  it('should render script information', () => {
    // Arrange & Act
    render(<ScriptCard script={mockScript} />);

    // Assert
    expect(screen.getByText('Test Script')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should call onDelete when delete button is clicked', async () => {
    // Arrange
    const mockOnDelete = jest.fn();
    render(<ScriptCard script={mockScript} onDelete={mockOnDelete} />);

    // Act
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Assert
    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith('script_123');
    });
  });

  it('should show loading state while fetching data', () => {
    // Arrange
    render(<ScriptCard script={null} loading={true} />);

    // Assert
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

**E2E tests (Playwright)**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/sign-in');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display user scripts', async ({ page }) => {
    // Wait for scripts to load
    await page.waitForSelector('[data-testid="script-card"]');

    // Assert
    const scriptCards = await page.locator('[data-testid="script-card"]').count();
    expect(scriptCards).toBeGreaterThan(0);
  });

  test('should create new script', async ({ page }) => {
    // Click create button
    await page.click('button:has-text("Create Script")');

    // Fill form
    await page.fill('[name="title"]', 'New Test Script');
    await page.fill('[name="description"]', 'Test description');
    await page.click('button:has-text("Save")');

    // Assert
    await expect(page.locator('text=New Test Script')).toBeVisible();
  });

  test('should delete script', async ({ page }) => {
    // Find first script and click delete
    await page.click('[data-testid="script-card"]:first-child >> button:has-text("Delete")');

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Assert
    await expect(page.locator('text=Script deleted successfully')).toBeVisible();
  });
});
```

## 🔧 Integration Tests

Integration tests verify that multiple components work together correctly.

**Example - API Integration Test (Go)**:
```go
// +build integration

package integration

import (
    "testing"
    "github.com/stretchr/testify/suite"
)

type APITestSuite struct {
    suite.Suite
    app      *fiber.App
    db       *sql.DB
    redis    *redis.Client
}

func (suite *APITestSuite) SetupSuite() {
    // Start test database
    suite.db = setupTestDatabase()
    suite.redis = setupTestRedis()
    suite.app = setupTestApp(suite.db, suite.redis)
}

func (suite *APITestSuite) TearDownSuite() {
    suite.db.Close()
    suite.redis.Close()
}

func (suite *APITestSuite) TestCreateAndRetrieveScript() {
    // Create script
    createResp := makeRequest(suite.app, "POST", "/api/v1/scripts",
        `{"title":"Integration Test","content":"Test content"}`)
    suite.Equal(201, createResp.StatusCode)

    var created map[string]interface{}
    json.NewDecoder(createResp.Body).Decode(&created)
    scriptID := created["id"].(string)

    // Retrieve script
    getResp := makeRequest(suite.app, "GET", "/api/v1/scripts/"+scriptID, "")
    suite.Equal(200, getResp.StatusCode)

    var retrieved map[string]interface{}
    json.NewDecoder(getResp.Body).Decode(&retrieved)
    suite.Equal("Integration Test", retrieved["title"])
}

func TestAPITestSuite(t *testing.T) {
    if testing.Short() {
        t.Skip("Skipping integration tests")
    }
    suite.Run(t, new(APITestSuite))
}
```

## 🚀 Running Tests

### Local Development

```bash
# Run all tests for a service
cd services/content-service
make test

# Run tests with coverage
make test-coverage

# Run tests in watch mode
make test-watch

# Run only unit tests
make test-unit

# Run integration tests
make test-integration

# Run E2E tests
go test -v -tags=e2e ./tests/e2e/...
```

### CI/CD Pipeline

Tests run automatically on:
- Every push to `main` or `develop`
- Every pull request

**GitHub Actions workflow**: `.github/workflows/test.yml`

### Pre-commit Hooks

Install pre-commit hooks:
```bash
pip install pre-commit
pre-commit install
```

Tests run automatically before each commit.

## 📊 Coverage Reports

### View Coverage Locally

**Go**:
```bash
make test-coverage
# Opens coverage.html in browser
```

**Python**:
```bash
pytest --cov=app --cov-report=html
open htmlcov/index.html
```

**Node.js**:
```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

### Coverage in CI

Coverage reports are automatically uploaded to **Codecov** on every CI run.

View coverage: `https://codecov.io/gh/your-org/scriptsensei`

## ✅ Best Practices

### 1. Test Naming

```go
// ❌ Bad
func TestHandler(t *testing.T) {}

// ✅ Good
func TestCreateScript_ValidInput_ReturnsCreated(t *testing.T) {}
func TestCreateScript_MissingTitle_ReturnsBadRequest(t *testing.T) {}
```

### 2. Arrange-Act-Assert (AAA)

```go
func TestExample(t *testing.T) {
    // Arrange - Set up test data and dependencies
    mockRepo := new(MockRepository)
    handler := NewHandler(mockRepo)

    // Act - Execute the code being tested
    result := handler.DoSomething()

    // Assert - Verify the results
    assert.Equal(t, expected, result)
}
```

### 3. Test Independence

```go
// ❌ Bad - Tests depend on order
var globalState string

func TestA(t *testing.T) {
    globalState = "A"
}

func TestB(t *testing.T) {
    // Relies on TestA running first
    assert.Equal(t, "A", globalState)
}

// ✅ Good - Tests are independent
func TestA(t *testing.T) {
    state := "A"
    assert.Equal(t, "A", state)
}

func TestB(t *testing.T) {
    state := "B"
    assert.Equal(t, "B", state)
}
```

### 4. Mock External Dependencies

```go
// ✅ Good - Mock external API calls
mockAPIClient := new(MockAPIClient)
mockAPIClient.On("Translate", "Hello", "es").Return("Hola", nil)

service := NewService(mockAPIClient)
result := service.Process("Hello")

assert.Equal(t, "Hola", result)
mockAPIClient.AssertExpectations(t)
```

### 5. Test Edge Cases

```go
tests := []struct{
    name  string
    input string
    want  error
}{
    {"empty string", "", ErrEmpty},
    {"whitespace only", "   ", ErrEmpty},
    {"very long string", strings.Repeat("a", 10000), ErrTooLong},
    {"special characters", "!@#$%", nil},
    {"unicode", "你好世界", nil},
}
```

## 🐛 Debugging Tests

### Go

```bash
# Run specific test with verbose output
go test -v -run TestCreateScript

# Run with race detector
go test -race ./...

# Run with CPU profiling
go test -cpuprofile cpu.prof
go tool pprof cpu.prof

# Run with memory profiling
go test -memprofile mem.prof
go tool pprof mem.prof
```

### Python

```bash
# Run with pytest debugger
pytest --pdb

# Run with verbose output
pytest -vv

# Show print statements
pytest -s

# Run specific test
pytest tests/test_video.py::test_process_video
```

### Node.js

```bash
# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Run with verbose output
npm test -- --verbose

# Run specific test
npm test -- --testNamePattern="should create script"
```

## 📚 Resources

- [Go Testing Package](https://pkg.go.dev/testing)
- [Testify Documentation](https://github.com/stretchr/testify)
- [Pytest Documentation](https://docs.pytest.org/)
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

## 🤝 Contributing

When contributing code:

1. ✅ Write tests **FIRST** (TDD)
2. ✅ Ensure all tests pass locally
3. ✅ Maintain 80%+ coverage
4. ✅ Run linters and formatters
5. ✅ Commit with descriptive messages
6. ✅ Create PR with test evidence

**Remember**: No code is merged without tests! 🧪
