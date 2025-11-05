package services_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/scriptsensei/content-service/internal/services"
	"github.com/stretchr/testify/assert"
)

// TestDeepSeekProvider_GenerateText_Success tests successful text generation
func TestDeepSeekProvider_GenerateText_Success(t *testing.T) {
	// Arrange - Create mock server
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify request
		assert.Equal(t, "POST", r.Method)
		assert.Equal(t, "/v1/chat/completions", r.URL.Path)
		assert.Equal(t, "Bearer test-api-key", r.Header.Get("Authorization"))

		// Return mock response
		response := map[string]interface{}{
			"choices": []map[string]interface{}{
				{
					"message": map[string]interface{}{
						"content": "This is a generated script about AI technology",
					},
				},
			},
			"usage": map[string]interface{}{
				"total_tokens": 150,
			},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer mockServer.Close()

	provider := services.NewDeepSeekProvider("test-api-key", mockServer.URL)

	prompt := "Generate a script about AI technology"
	options := map[string]interface{}{
		"temperature": 0.7,
		"max_tokens":  500,
	}

	// Act
	result, err := provider.GenerateText(context.Background(), prompt, options)

	// Assert
	assert.NoError(t, err)
	assert.NotEmpty(t, result)
	assert.Contains(t, result, "AI technology")
}

// TestDeepSeekProvider_GenerateText_APIError tests API error handling
func TestDeepSeekProvider_GenerateText_APIError(t *testing.T) {
	// Arrange - Create mock server that returns error
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error": "Internal server error"}`))
	}))
	defer mockServer.Close()

	provider := services.NewDeepSeekProvider("test-api-key", mockServer.URL)

	// Act
	result, err := provider.GenerateText(context.Background(), "test prompt", nil)

	// Assert
	assert.Error(t, err)
	assert.Empty(t, result)
	assert.Contains(t, err.Error(), "DeepSeek API error")
}

// TestDeepSeekProvider_GenerateText_InvalidAPIKey tests invalid API key
func TestDeepSeekProvider_GenerateText_InvalidAPIKey(t *testing.T) {
	// Arrange
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error": "Invalid API key"}`))
	}))
	defer mockServer.Close()

	provider := services.NewDeepSeekProvider("invalid-key", mockServer.URL)

	// Act
	result, err := provider.GenerateText(context.Background(), "test prompt", nil)

	// Assert
	assert.Error(t, err)
	assert.Empty(t, result)
	assert.Contains(t, err.Error(), "authentication")
}

// TestDeepSeekProvider_GenerateText_RateLimitExceeded tests rate limiting
func TestDeepSeekProvider_GenerateText_RateLimitExceeded(t *testing.T) {
	// Arrange
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTooManyRequests)
		w.Write([]byte(`{"error": "Rate limit exceeded"}`))
	}))
	defer mockServer.Close()

	provider := services.NewDeepSeekProvider("test-api-key", mockServer.URL)

	// Act
	result, err := provider.GenerateText(context.Background(), "test prompt", nil)

	// Assert
	assert.Error(t, err)
	assert.Empty(t, result)
	assert.Contains(t, err.Error(), "rate limit")
}

// TestDeepSeekProvider_GenerateText_ContextCancellation tests context cancellation
func TestDeepSeekProvider_GenerateText_ContextCancellation(t *testing.T) {
	// Arrange
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Simulate slow response
		select {
		case <-r.Context().Done():
			return
		}
	}))
	defer mockServer.Close()

	provider := services.NewDeepSeekProvider("test-api-key", mockServer.URL)

	ctx, cancel := context.WithCancel(context.Background())
	cancel() // Cancel immediately

	// Act
	result, err := provider.GenerateText(ctx, "test prompt", nil)

	// Assert
	assert.Error(t, err)
	assert.Empty(t, result)
}

// TestDeepSeekProvider_Name tests provider name
func TestDeepSeekProvider_Name(t *testing.T) {
	// Arrange
	provider := services.NewDeepSeekProvider("test-api-key", "https://api.deepseek.com")

	// Act
	name := provider.Name()

	// Assert
	assert.Equal(t, "DeepSeek", name)
}

// TestDeepSeekProvider_BuildsCorrectRequest tests request building
func TestDeepSeekProvider_BuildsCorrectRequest(t *testing.T) {
	// Arrange
	var capturedRequest map[string]interface{}
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Capture the request body
		json.NewDecoder(r.Body).Decode(&capturedRequest)

		response := map[string]interface{}{
			"choices": []map[string]interface{}{
				{"message": map[string]interface{}{"content": "test response"}},
			},
		}
		json.NewEncoder(w).Encode(response)
	}))
	defer mockServer.Close()

	provider := services.NewDeepSeekProvider("test-api-key", mockServer.URL)

	options := map[string]interface{}{
		"temperature": 0.8,
		"max_tokens":  1000,
	}

	// Act
	provider.GenerateText(context.Background(), "test prompt", options)

	// Assert
	assert.NotNil(t, capturedRequest)
	assert.Equal(t, "deepseek-chat", capturedRequest["model"])
	assert.Equal(t, 0.8, capturedRequest["temperature"])
	assert.Equal(t, float64(1000), capturedRequest["max_tokens"])

	messages := capturedRequest["messages"].([]interface{})
	assert.Len(t, messages, 1)
	firstMessage := messages[0].(map[string]interface{})
	assert.Equal(t, "user", firstMessage["role"])
	assert.Equal(t, "test prompt", firstMessage["content"])
}
