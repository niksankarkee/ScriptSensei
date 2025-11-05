package services_test

import (
	"context"
	"testing"

	"github.com/scriptsensei/content-service/internal/services"
	"github.com/stretchr/testify/assert"
)

func TestOpenAIProvider_Name(t *testing.T) {
	provider := services.NewOpenAIProvider("test-key", "")
	assert.Equal(t, "OpenAI", provider.Name())
}

func TestOpenAIProvider_GenerateText_Success(t *testing.T) {
	// Skip if no API key is provided
	apiKey := getEnvOrSkip(t, "OPENAI_API_KEY")

	provider := services.NewOpenAIProvider(apiKey, "")
	ctx := context.Background()

	prompt := "Write a single sentence about AI."
	options := map[string]interface{}{
		"temperature": 0.7,
		"max_tokens":  100,
	}

	result, err := provider.GenerateText(ctx, prompt, options)

	assert.NoError(t, err)
	assert.NotEmpty(t, result)
	assert.Greater(t, len(result), 10) // Should be a meaningful response
}

func TestOpenAIProvider_GenerateText_WithCustomTemperature(t *testing.T) {
	apiKey := getEnvOrSkip(t, "OPENAI_API_KEY")

	provider := services.NewOpenAIProvider(apiKey, "")
	ctx := context.Background()

	prompt := "Say hello in one word."
	options := map[string]interface{}{
		"temperature": 0.3,
		"max_tokens":  50,
	}

	result, err := provider.GenerateText(ctx, prompt, options)

	assert.NoError(t, err)
	assert.NotEmpty(t, result)
}

func TestOpenAIProvider_GenerateText_InvalidAPIKey(t *testing.T) {
	provider := services.NewOpenAIProvider("sk-invalid-key", "")
	ctx := context.Background()

	prompt := "Test prompt"
	options := map[string]interface{}{
		"temperature": 0.7,
	}

	result, err := provider.GenerateText(ctx, prompt, options)

	assert.Error(t, err)
	assert.Empty(t, result)
	assert.Contains(t, err.Error(), "authentication")
}

func TestOpenAIProvider_GenerateText_EmptyPrompt(t *testing.T) {
	apiKey := getEnvOrSkip(t, "OPENAI_API_KEY")

	provider := services.NewOpenAIProvider(apiKey, "")
	ctx := context.Background()

	prompt := ""
	options := map[string]interface{}{}

	result, err := provider.GenerateText(ctx, prompt, options)

	// Should handle empty prompt gracefully
	assert.Error(t, err)
	assert.Empty(t, result)
}

func TestOpenAIProvider_GenerateText_ContextCancellation(t *testing.T) {
	apiKey := getEnvOrSkip(t, "OPENAI_API_KEY")

	provider := services.NewOpenAIProvider(apiKey, "")
	ctx, cancel := context.WithCancel(context.Background())
	cancel() // Cancel immediately

	prompt := "Test prompt"
	options := map[string]interface{}{}

	result, err := provider.GenerateText(ctx, prompt, options)

	assert.Error(t, err)
	assert.Empty(t, result)
}

func TestOpenAIProvider_GenerateText_DefaultOptions(t *testing.T) {
	apiKey := getEnvOrSkip(t, "OPENAI_API_KEY")

	provider := services.NewOpenAIProvider(apiKey, "")
	ctx := context.Background()

	prompt := "Write one sentence."
	options := map[string]interface{}{} // No options, should use defaults

	result, err := provider.GenerateText(ctx, prompt, options)

	assert.NoError(t, err)
	assert.NotEmpty(t, result)
}

func TestOpenAIProvider_GenerateText_LongPrompt(t *testing.T) {
	apiKey := getEnvOrSkip(t, "OPENAI_API_KEY")

	provider := services.NewOpenAIProvider(apiKey, "")
	ctx := context.Background()

	// Create a longer prompt
	prompt := `Generate a video script for YouTube platform.

Duration: 120 seconds
Topic: Productivity Tips for Remote Workers

IMPORTANT: Include an engaging intro (0-15 seconds) to hook viewers.
Structure the content with clear sections.
End with a call-to-action.

Provide ONLY the script content, no additional commentary or formatting.
Write in a natural, conversational style that sounds authentic when spoken.`

	options := map[string]interface{}{
		"temperature": 0.7,
		"max_tokens":  1000,
	}

	result, err := provider.GenerateText(ctx, prompt, options)

	assert.NoError(t, err)
	assert.NotEmpty(t, result)
	assert.Greater(t, len(result), 100) // Should be a substantial script
}

func TestOpenAIProvider_GenerateText_HighTemperature(t *testing.T) {
	apiKey := getEnvOrSkip(t, "OPENAI_API_KEY")

	provider := services.NewOpenAIProvider(apiKey, "")
	ctx := context.Background()

	prompt := "Write a creative story opening in one sentence."
	options := map[string]interface{}{
		"temperature": 1.5, // High temperature for creative responses
		"max_tokens":  100,
	}

	result, err := provider.GenerateText(ctx, prompt, options)

	assert.NoError(t, err)
	assert.NotEmpty(t, result)
}

func TestOpenAIProvider_GenerateText_LowTemperature(t *testing.T) {
	apiKey := getEnvOrSkip(t, "OPENAI_API_KEY")

	provider := services.NewOpenAIProvider(apiKey, "")
	ctx := context.Background()

	prompt := "What is 2+2?"
	options := map[string]interface{}{
		"temperature": 0.0, // Low temperature for deterministic responses
		"max_tokens":  50,
	}

	result, err := provider.GenerateText(ctx, prompt, options)

	assert.NoError(t, err)
	assert.NotEmpty(t, result)
	assert.Contains(t, result, "4") // Should contain the answer
}
