package services_test

import (
	"context"
	"testing"

	"github.com/scriptsensei/content-service/internal/services"
	"github.com/stretchr/testify/assert"
)

func TestClaudeProvider_Name(t *testing.T) {
	provider := services.NewClaudeProvider("test-key", "")
	assert.Equal(t, "Claude", provider.Name())
}

func TestClaudeProvider_GenerateText_Success(t *testing.T) {
	// Skip if no API key is provided
	apiKey := getEnvOrSkip(t, "ANTHROPIC_API_KEY")

	provider := services.NewClaudeProvider(apiKey, "")
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

func TestClaudeProvider_GenerateText_WithCustomTemperature(t *testing.T) {
	apiKey := getEnvOrSkip(t, "ANTHROPIC_API_KEY")

	provider := services.NewClaudeProvider(apiKey, "")
	ctx := context.Background()

	prompt := "Say hello in one word."
	options := map[string]interface{}{
		"temperature": 0.5,
		"max_tokens":  50,
	}

	result, err := provider.GenerateText(ctx, prompt, options)

	assert.NoError(t, err)
	assert.NotEmpty(t, result)
}

func TestClaudeProvider_GenerateText_InvalidAPIKey(t *testing.T) {
	provider := services.NewClaudeProvider("invalid-key-123", "")
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

func TestClaudeProvider_GenerateText_EmptyPrompt(t *testing.T) {
	apiKey := getEnvOrSkip(t, "ANTHROPIC_API_KEY")

	provider := services.NewClaudeProvider(apiKey, "")
	ctx := context.Background()

	prompt := ""
	options := map[string]interface{}{}

	result, err := provider.GenerateText(ctx, prompt, options)

	// Should handle empty prompt gracefully
	assert.Error(t, err)
	assert.Empty(t, result)
}

func TestClaudeProvider_GenerateText_ContextCancellation(t *testing.T) {
	apiKey := getEnvOrSkip(t, "ANTHROPIC_API_KEY")

	provider := services.NewClaudeProvider(apiKey, "")
	ctx, cancel := context.WithCancel(context.Background())
	cancel() // Cancel immediately

	prompt := "Test prompt"
	options := map[string]interface{}{}

	result, err := provider.GenerateText(ctx, prompt, options)

	assert.Error(t, err)
	assert.Empty(t, result)
}

func TestClaudeProvider_GenerateText_DefaultOptions(t *testing.T) {
	apiKey := getEnvOrSkip(t, "ANTHROPIC_API_KEY")

	provider := services.NewClaudeProvider(apiKey, "")
	ctx := context.Background()

	prompt := "Write one sentence."
	options := map[string]interface{}{} // No options, should use defaults

	result, err := provider.GenerateText(ctx, prompt, options)

	assert.NoError(t, err)
	assert.NotEmpty(t, result)
}

func TestClaudeProvider_GenerateText_LongPrompt(t *testing.T) {
	apiKey := getEnvOrSkip(t, "ANTHROPIC_API_KEY")

	provider := services.NewClaudeProvider(apiKey, "")
	ctx := context.Background()

	// Create a longer prompt
	prompt := `Generate a video script for TikTok platform.

Duration: 60 seconds
Topic: The Future of AI in Healthcare

IMPORTANT: TikTok scripts must have a strong hook in the first 3 seconds to grab attention.
Use fast-paced, energetic language. Keep sentences short.
This is a short-form video. Make every word count.

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
