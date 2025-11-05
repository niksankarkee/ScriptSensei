package services_test

import (
	"context"
	"errors"
	"testing"

	"github.com/scriptsensei/content-service/internal/models"
	"github.com/scriptsensei/content-service/internal/services"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockLLMProvider is a mock implementation of an LLM provider
type MockLLMProvider struct {
	mock.Mock
}

func (m *MockLLMProvider) GenerateText(ctx context.Context, prompt string, options map[string]interface{}) (string, error) {
	args := m.Called(ctx, prompt, options)
	return args.String(0), args.Error(1)
}

func (m *MockLLMProvider) Name() string {
	args := m.Called()
	return args.String(0)
}

// TestLLMOrchestrator_GenerateScript_WithPrimaryProvider tests successful generation with primary provider
func TestLLMOrchestrator_GenerateScript_WithPrimaryProvider(t *testing.T) {
	// Arrange
	mockDeepSeek := new(MockLLMProvider)
	mockGemini := new(MockLLMProvider)

	orchestrator := services.NewLLMOrchestrator([]services.LLMProvider{
		mockDeepSeek,
		mockGemini,
	})

	expectedResponse := "This is a test script about AI technology"
	mockDeepSeek.On("GenerateText", mock.Anything, mock.Anything, mock.Anything).Return(expectedResponse, nil)
	mockDeepSeek.On("Name").Return("DeepSeek")

	request := &models.ScriptGenerationRequest{
		Topic:    "AI Technology",
		Platform: "TikTok",
		Duration: 60,
		Language: "English",
	}

	// Act
	result, err := orchestrator.GenerateScript(context.Background(), request)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, expectedResponse, result.Content)
	assert.Equal(t, "DeepSeek", result.ProviderUsed)
	mockDeepSeek.AssertExpectations(t)
}

// TestLLMOrchestrator_GenerateScript_FallbackToSecondProvider tests fallback mechanism
func TestLLMOrchestrator_GenerateScript_FallbackToSecondProvider(t *testing.T) {
	// Arrange
	mockDeepSeek := new(MockLLMProvider)
	mockGemini := new(MockLLMProvider)

	orchestrator := services.NewLLMOrchestrator([]services.LLMProvider{
		mockDeepSeek,
		mockGemini,
	})

	expectedResponse := "Fallback script content"
	mockDeepSeek.On("GenerateText", mock.Anything, mock.Anything, mock.Anything).Return("", errors.New("API error"))
	mockDeepSeek.On("Name").Return("DeepSeek")
	mockGemini.On("GenerateText", mock.Anything, mock.Anything, mock.Anything).Return(expectedResponse, nil)
	mockGemini.On("Name").Return("Gemini")

	request := &models.ScriptGenerationRequest{
		Topic:    "Travel Tips",
		Platform: "YouTube",
		Duration: 300,
		Language: "English",
	}

	// Act
	result, err := orchestrator.GenerateScript(context.Background(), request)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, expectedResponse, result.Content)
	assert.Equal(t, "Gemini", result.ProviderUsed)
	mockDeepSeek.AssertExpectations(t)
	mockGemini.AssertExpectations(t)
}

// TestLLMOrchestrator_GenerateScript_AllProvidersFail tests when all providers fail
func TestLLMOrchestrator_GenerateScript_AllProvidersFail(t *testing.T) {
	// Arrange
	mockDeepSeek := new(MockLLMProvider)
	mockGemini := new(MockLLMProvider)

	orchestrator := services.NewLLMOrchestrator([]services.LLMProvider{
		mockDeepSeek,
		mockGemini,
	})

	mockDeepSeek.On("GenerateText", mock.Anything, mock.Anything, mock.Anything).Return("", errors.New("DeepSeek API error"))
	mockDeepSeek.On("Name").Return("DeepSeek")
	mockGemini.On("GenerateText", mock.Anything, mock.Anything, mock.Anything).Return("", errors.New("Gemini API error"))
	mockGemini.On("Name").Return("Gemini")

	request := &models.ScriptGenerationRequest{
		Topic:    "Cooking",
		Platform: "Instagram",
		Duration: 30,
		Language: "English",
	}

	// Act
	result, err := orchestrator.GenerateScript(context.Background(), request)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "all LLM providers failed")
	mockDeepSeek.AssertExpectations(t)
	mockGemini.AssertExpectations(t)
}

// TestLLMOrchestrator_GenerateScript_InvalidRequest tests validation
func TestLLMOrchestrator_GenerateScript_InvalidRequest(t *testing.T) {
	// Arrange
	orchestrator := services.NewLLMOrchestrator([]services.LLMProvider{})

	// Empty topic
	request := &models.ScriptGenerationRequest{
		Topic:    "",
		Platform: "TikTok",
		Duration: 60,
		Language: "English",
	}

	// Act
	result, err := orchestrator.GenerateScript(context.Background(), request)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "topic is required")
}

// TestLLMOrchestrator_GenerateScript_BuildsCorrectPrompt tests prompt construction
func TestLLMOrchestrator_GenerateScript_BuildsCorrectPrompt(t *testing.T) {
	// Arrange
	mockProvider := new(MockLLMProvider)
	orchestrator := services.NewLLMOrchestrator([]services.LLMProvider{mockProvider})

	mockProvider.On("Name").Return("TestProvider")
	mockProvider.On("GenerateText", mock.Anything, mock.MatchedBy(func(prompt string) bool {
		// Verify prompt contains key elements
		return assert.Contains(t, prompt, "TikTok") &&
			assert.Contains(t, prompt, "60 seconds") &&
			assert.Contains(t, prompt, "AI Technology") &&
			assert.Contains(t, prompt, "hook")
		return true
	}), mock.Anything).Return("Generated script", nil)

	request := &models.ScriptGenerationRequest{
		Topic:    "AI Technology",
		Platform: "TikTok",
		Duration: 60,
		Language: "English",
	}

	// Act
	result, err := orchestrator.GenerateScript(context.Background(), request)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, result)
	mockProvider.AssertExpectations(t)
}
