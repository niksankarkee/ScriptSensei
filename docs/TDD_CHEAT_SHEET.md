# TDD Cheat Sheet - ScriptSensei Global

## 🔴🟢🔵 The TDD Cycle

```
┌─────────────┐
│  🔴 RED     │  Write a failing test
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  🟢 GREEN   │  Make the test pass (minimal code)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 🔵 REFACTOR │  Improve code while tests stay green
└──────┬──────┘
       │
       └──────────┐
                  │
                  ▼
            (Repeat for next feature)
```

## ⚡ Quick Commands

### Go Services

```bash
# RED - Run failing test
go test -v -run TestNewFeature ./...

# GREEN - Run test after implementation
go test -v -run TestNewFeature ./...

# REFACTOR - Run all tests
make test

# Coverage check
make test-coverage
```

### Python Services

```bash
# RED - Run failing test
pytest tests/test_feature.py::test_new_feature -v

# GREEN - Run test after implementation
pytest tests/test_feature.py::test_new_feature -v

# REFACTOR - Run all tests
pytest tests/ -v

# Coverage check
pytest --cov=app --cov-report=term
```

### Node.js Services

```bash
# RED - Run failing test
npm test -- --testNamePattern="new feature"

# GREEN - Run test after implementation
npm test -- --testNamePattern="new feature"

# REFACTOR - Run all tests
npm test

# Coverage check
npm test -- --coverage
```

## 📝 Test Templates

### Go - Unit Test Template

```go
package handler

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
)

// Test naming: Test<Function>_<Scenario>_<ExpectedBehavior>
func TestCreateScript_ValidInput_ReturnsCreatedScript(t *testing.T) {
    // Arrange - Set up test data and mocks
    mockRepo := new(MockRepository)
    handler := NewScriptHandler(mockRepo)

    input := CreateScriptRequest{
        Title:   "Test Script",
        Content: "Test content",
    }

    expectedScript := &Script{
        ID:      "script_123",
        Title:   input.Title,
        Content: input.Content,
    }

    mockRepo.On("Create", input).Return(expectedScript, nil)

    // Act - Execute the function being tested
    result, err := handler.CreateScript(input)

    // Assert - Verify the results
    assert.NoError(t, err)
    assert.Equal(t, "script_123", result.ID)
    assert.Equal(t, "Test Script", result.Title)
    mockRepo.AssertExpectations(t)
}

func TestCreateScript_EmptyTitle_ReturnsError(t *testing.T) {
    // Arrange
    handler := NewScriptHandler(nil)
    input := CreateScriptRequest{
        Title:   "", // Invalid input
        Content: "Test content",
    }

    // Act
    result, err := handler.CreateScript(input)

    // Assert
    assert.Error(t, err)
    assert.Nil(t, result)
    assert.Contains(t, err.Error(), "title is required")
}
```

### Python - Unit Test Template

```python
import pytest
from unittest.mock import Mock, patch
from app.services.video_service import VideoService

class TestVideoService:
    """Test suite for VideoService"""

    @pytest.fixture
    def video_service(self):
        """Fixture to create VideoService instance"""
        return VideoService()

    @pytest.fixture
    def mock_video_processor(self):
        """Fixture to create mock video processor"""
        return Mock()

    def test_process_video_valid_input_returns_processed_video(
        self,
        video_service,
        mock_video_processor
    ):
        """Test processing video with valid input"""
        # Arrange
        video_data = {
            "url": "https://example.com/video.mp4",
            "format": "mp4"
        }
        expected_result = {
            "id": "video_123",
            "status": "processed"
        }

        mock_video_processor.process.return_value = expected_result
        video_service.processor = mock_video_processor

        # Act
        result = video_service.process(video_data)

        # Assert
        assert result["id"] == "video_123"
        assert result["status"] == "processed"
        mock_video_processor.process.assert_called_once_with(video_data)

    def test_process_video_invalid_url_raises_error(self, video_service):
        """Test processing video with invalid URL"""
        # Arrange
        video_data = {
            "url": "invalid-url",
            "format": "mp4"
        }

        # Act & Assert
        with pytest.raises(ValueError, match="Invalid URL"):
            video_service.process(video_data)

    @pytest.mark.parametrize("input_format,expected_mime", [
        ("mp4", "video/mp4"),
        ("avi", "video/x-msvideo"),
        ("mov", "video/quicktime"),
    ])
    def test_get_mime_type_various_formats(
        self,
        video_service,
        input_format,
        expected_mime
    ):
        """Test MIME type detection for various formats"""
        # Act
        result = video_service.get_mime_type(input_format)

        # Assert
        assert result == expected_mime
```

### TypeScript - Unit Test Template

```typescript
import { TranslationService } from './translationService';
import { mockDeep, mockReset } from 'jest-mock-extended';

describe('TranslationService', () => {
  let service: TranslationService;
  let mockTranslator: any;

  beforeEach(() => {
    // Arrange - Set up before each test
    mockTranslator = mockDeep<Translator>();
    service = new TranslationService(mockTranslator);
  });

  afterEach(() => {
    // Clean up after each test
    mockReset(mockTranslator);
  });

  describe('translate', () => {
    it('should translate text with valid input', async () => {
      // Arrange
      const input = {
        text: 'Hello',
        from: 'en',
        to: 'es'
      };
      const expectedTranslation = 'Hola';

      mockTranslator.translate.mockResolvedValue(expectedTranslation);

      // Act
      const result = await service.translate(input);

      // Assert
      expect(result).toBe(expectedTranslation);
      expect(mockTranslator.translate).toHaveBeenCalledWith(
        input.text,
        { from: input.from, to: input.to }
      );
    });

    it('should throw error when language code is invalid', async () => {
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

  describe.each([
    ['Hello', 'en'],
    ['Bonjour', 'fr'],
    ['Hola', 'es'],
    ['Ciao', 'it'],
  ])('detectLanguage("%s")', (text, expectedLang) => {
    it(`should detect language as ${expectedLang}`, async () => {
      // Arrange
      mockTranslator.detect.mockResolvedValue(expectedLang);

      // Act
      const result = await service.detectLanguage(text);

      // Assert
      expect(result).toBe(expectedLang);
    });
  });
});
```

## 🎯 Common Test Scenarios

### 1. Happy Path (Success Case)

```go
func TestFeature_ValidInput_Success(t *testing.T) {
    // Test the expected, valid use case
    // Should return success with correct data
}
```

### 2. Validation Errors

```go
func TestFeature_InvalidInput_ReturnsError(t *testing.T) {
    // Test with invalid/missing required fields
    // Should return appropriate error
}
```

### 3. Edge Cases

```go
func TestFeature_EmptyInput_HandlesGracefully(t *testing.T) {}
func TestFeature_VeryLargeInput_HandlesCorrectly(t *testing.T) {}
func TestFeature_SpecialCharacters_ProcessesCorrectly(t *testing.T) {}
func TestFeature_Unicode_HandlesCorrectly(t *testing.T) {}
```

### 4. Error Handling

```go
func TestFeature_DatabaseError_ReturnsError(t *testing.T) {
    // Mock database to return error
    // Should handle gracefully and return appropriate error
}

func TestFeature_TimeoutError_ReturnsError(t *testing.T) {
    // Simulate timeout
    // Should handle timeout gracefully
}
```

### 5. State Changes

```go
func TestFeature_UpdatesState_StateChanged(t *testing.T) {
    // Verify that state changes as expected
    // Check before and after states
}
```

## 🔍 Assertion Patterns

### Go (testify)

```go
// Equality
assert.Equal(t, expected, actual)
assert.NotEqual(t, notExpected, actual)

// Nil checks
assert.Nil(t, err)
assert.NotNil(t, result)

// Boolean
assert.True(t, condition)
assert.False(t, condition)

// Errors
assert.NoError(t, err)
assert.Error(t, err)
assert.EqualError(t, err, "expected error message")
assert.Contains(t, err.Error(), "partial message")

// Collections
assert.Len(t, slice, 3)
assert.Empty(t, slice)
assert.NotEmpty(t, slice)
assert.Contains(t, slice, element)

// Structs
assert.Equal(t, expected.Field, actual.Field)
assert.JSONEq(t, expectedJSON, actualJSON)

// Mocks
mock.AssertExpectations(t)
mock.AssertCalled(t, "MethodName", arg1, arg2)
mock.AssertNotCalled(t, "MethodName")
```

### Python (pytest)

```python
# Equality
assert result == expected
assert result != not_expected

# Truthiness
assert condition
assert not condition

# None checks
assert result is None
assert result is not None

# Exceptions
with pytest.raises(ValueError):
    function_that_raises()

with pytest.raises(ValueError, match="expected message"):
    function_that_raises()

# Collections
assert len(list) == 3
assert element in list
assert list  # Not empty
assert not list  # Empty

# Approximation (floats)
assert result == pytest.approx(3.14, abs=0.01)

# Mocks
mock.assert_called_once()
mock.assert_called_with(arg1, arg2)
mock.assert_not_called()
```

### JavaScript (Jest)

```typescript
// Equality
expect(result).toBe(expected);  // Strict equality
expect(result).toEqual(expected);  // Deep equality
expect(result).not.toBe(notExpected);

// Truthiness
expect(condition).toBeTruthy();
expect(condition).toBeFalsy();

// Null/Undefined
expect(result).toBeNull();
expect(result).toBeUndefined();
expect(result).toBeDefined();

// Numbers
expect(result).toBeGreaterThan(3);
expect(result).toBeLessThan(10);
expect(result).toBeCloseTo(3.14, 2);

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain(element);

// Objects
expect(object).toHaveProperty('key', 'value');
expect(object).toMatchObject({ key: 'value' });

// Exceptions
expect(() => {
  throwingFunction();
}).toThrow();
expect(() => {
  throwingFunction();
}).toThrow('error message');

// Async
await expect(promise).resolves.toBe(result);
await expect(promise).rejects.toThrow();

// Mocks
expect(mock).toHaveBeenCalled();
expect(mock).toHaveBeenCalledWith(arg1, arg2);
expect(mock).toHaveBeenCalledTimes(3);
```

## 🚨 Common Mistakes to Avoid

### ❌ Don't: Write tests after implementation
```go
// Wrong approach:
// 1. Write handler.CreateScript()
// 2. Write TestCreateScript()

// ✅ Correct TDD approach:
// 1. Write TestCreateScript() - it fails (RED)
// 2. Write handler.CreateScript() - test passes (GREEN)
// 3. Refactor code - tests still pass (REFACTOR)
```

### ❌ Don't: Test implementation details
```go
// ❌ Bad - tests internal implementation
func TestCreateScript_CallsRepositoryCreateMethod(t *testing.T) {
    // This is too coupled to implementation
}

// ✅ Good - tests behavior
func TestCreateScript_ValidInput_ReturnsCreatedScript(t *testing.T) {
    // This tests the outcome, not how it's done
}
```

### ❌ Don't: Have tests depend on each other
```go
// ❌ Bad - tests run in order
var createdScriptID string

func TestCreateScript(t *testing.T) {
    script, _ := handler.CreateScript(...)
    createdScriptID = script.ID
}

func TestGetScript(t *testing.T) {
    // Depends on TestCreateScript running first!
    script, _ := handler.GetScript(createdScriptID)
}

// ✅ Good - independent tests
func TestCreateScript(t *testing.T) {
    script, _ := handler.CreateScript(...)
    assert.NotEmpty(t, script.ID)
}

func TestGetScript(t *testing.T) {
    // Create own test data
    script, _ := createTestScript()
    result, _ := handler.GetScript(script.ID)
    assert.Equal(t, script.ID, result.ID)
}
```

### ❌ Don't: Skip edge cases
```go
// ❌ Only testing happy path
func TestCreateScript(t *testing.T) {
    result, _ := handler.CreateScript(validInput)
    assert.NotNil(t, result)
}

// ✅ Test edge cases too
func TestCreateScript_EmptyTitle(t *testing.T) { ... }
func TestCreateScript_VeryLongTitle(t *testing.T) { ... }
func TestCreateScript_SpecialCharacters(t *testing.T) { ... }
func TestCreateScript_Unicode(t *testing.T) { ... }
```

## 📊 Coverage Goals

| Coverage Type | Minimum | Target | Excellent |
|---------------|---------|--------|-----------|
| Line Coverage | 80% | 85% | 90%+ |
| Branch Coverage | 75% | 80% | 85%+ |
| Function Coverage | 90% | 95% | 100% |

## 🎓 TDD Mantras

1. **Red-Green-Refactor**: Always follow the cycle
2. **Test First**: Write the test before the code
3. **One Test at a Time**: Focus on one behavior
4. **Small Steps**: Make incremental progress
5. **Keep Tests Fast**: Tests should run quickly
6. **Keep Tests Independent**: No test should depend on another
7. **Test Behavior, Not Implementation**: Focus on what, not how
8. **Refactor Fearlessly**: Tests give you confidence

## 🔗 Quick Links

- [Full Testing Guide](TESTING_GUIDE.md)
- [Go Testing Package](https://pkg.go.dev/testing)
- [pytest Documentation](https://docs.pytest.org/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://martinfowler.com/testing/)

---

**Remember**: 🔴 Write a failing test → 🟢 Make it pass → 🔵 Refactor → Repeat!
