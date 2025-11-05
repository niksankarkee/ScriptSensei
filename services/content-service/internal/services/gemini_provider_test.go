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

// TestGeminiProvider_GenerateText_Success tests successful text generation
func TestGeminiProvider_GenerateText_Success(t *testing.T) {
	// Arrange
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "POST", r.Method)
		assert.Contains(t, r.URL.Path, "/models/gemini-2.0-flash")
		assert.Contains(t, r.URL.RawQuery, "key=test-api-key")

		response := map[string]interface{}{
			"candidates": []map[string]interface{}{
				{
					"content": map[string]interface{}{
						"parts": []map[string]interface{}{
							{"text": "Generated content about travel tips"},
						},
					},
				},
			},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer mockServer.Close()

	provider := services.NewGeminiProvider("test-api-key", mockServer.URL)

	// Act
	result, err := provider.GenerateText(context.Background(), "Generate travel tips", nil)

	// Assert
	assert.NoError(t, err)
	assert.NotEmpty(t, result)
	assert.Contains(t, result, "travel tips")
}

// TestGeminiProvider_GenerateText_APIError tests API error handling
func TestGeminiProvider_GenerateText_APIError(t *testing.T) {
	// Arrange
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error": {"message": "Internal error"}}`))
	}))
	defer mockServer.Close()

	provider := services.NewGeminiProvider("test-api-key", mockServer.URL)

	// Act
	result, err := provider.GenerateText(context.Background(), "test", nil)

	// Assert
	assert.Error(t, err)
	assert.Empty(t, result)
	assert.Contains(t, err.Error(), "Gemini API error")
}

// TestGeminiProvider_GenerateText_InvalidAPIKey tests invalid API key
func TestGeminiProvider_GenerateText_InvalidAPIKey(t *testing.T) {
	// Arrange
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusForbidden)
		w.Write([]byte(`{"error": {"message": "API key not valid"}}`))
	}))
	defer mockServer.Close()

	provider := services.NewGeminiProvider("invalid-key", mockServer.URL)

	// Act
	result, err := provider.GenerateText(context.Background(), "test", nil)

	// Assert
	assert.Error(t, err)
	assert.Empty(t, result)
	assert.Contains(t, err.Error(), "authentication")
}

// TestGeminiProvider_Name tests provider name
func TestGeminiProvider_Name(t *testing.T) {
	provider := services.NewGeminiProvider("test-key", "")
	assert.Equal(t, "Gemini", provider.Name())
}

// TestGeminiProvider_BuildsCorrectRequest tests request structure
func TestGeminiProvider_BuildsCorrectRequest(t *testing.T) {
	// Arrange
	var capturedRequest map[string]interface{}
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		json.NewDecoder(r.Body).Decode(&capturedRequest)

		response := map[string]interface{}{
			"candidates": []map[string]interface{}{
				{"content": map[string]interface{}{"parts": []map[string]interface{}{{"text": "response"}}}},
			},
		}
		json.NewEncoder(w).Encode(response)
	}))
	defer mockServer.Close()

	provider := services.NewGeminiProvider("test-key", mockServer.URL)
	options := map[string]interface{}{
		"temperature": 0.9,
		"max_tokens":  1500,
	}

	// Act
	provider.GenerateText(context.Background(), "test prompt", options)

	// Assert
	assert.NotNil(t, capturedRequest)
	contents := capturedRequest["contents"].([]interface{})
	assert.Len(t, contents, 1)

	firstContent := contents[0].(map[string]interface{})
	parts := firstContent["parts"].([]interface{})
	assert.Len(t, parts, 1)

	firstPart := parts[0].(map[string]interface{})
	assert.Equal(t, "test prompt", firstPart["text"])

	// Check generation config
	genConfig := capturedRequest["generationConfig"].(map[string]interface{})
	assert.Equal(t, 0.9, genConfig["temperature"])
	assert.Equal(t, float64(1500), genConfig["maxOutputTokens"])
}
