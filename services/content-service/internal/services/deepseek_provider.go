package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// DeepSeekProvider implements LLMProvider for DeepSeek API
type DeepSeekProvider struct {
	apiKey  string
	baseURL string
	client  *http.Client
}

// NewDeepSeekProvider creates a new DeepSeek provider
func NewDeepSeekProvider(apiKey, baseURL string) *DeepSeekProvider {
	if baseURL == "" {
		baseURL = "https://api.deepseek.com"
	}
	return &DeepSeekProvider{
		apiKey:  apiKey,
		baseURL: baseURL,
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// Name returns the provider name
func (p *DeepSeekProvider) Name() string {
	return "DeepSeek"
}

// GenerateText generates text using DeepSeek API
func (p *DeepSeekProvider) GenerateText(ctx context.Context, prompt string, options map[string]interface{}) (string, error) {
	// Build request payload
	payload := map[string]interface{}{
		"model": "deepseek-chat",
		"messages": []map[string]string{
			{
				"role":    "user",
				"content": prompt,
			},
		},
	}

	// Add options
	if temp, ok := options["temperature"]; ok {
		payload["temperature"] = temp
	} else {
		payload["temperature"] = 0.7 // Default
	}

	if maxTokens, ok := options["max_tokens"]; ok {
		payload["max_tokens"] = maxTokens
	} else {
		payload["max_tokens"] = 2000 // Default
	}

	// Marshal payload
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+p.apiKey)

	// Send request
	resp, err := p.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("DeepSeek API request failed: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	// Handle error status codes
	if resp.StatusCode != http.StatusOK {
		return "", p.handleErrorResponse(resp.StatusCode, body)
	}

	// Parse response
	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
		Usage struct {
			TotalTokens int `json:"total_tokens"`
		} `json:"usage"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	if len(result.Choices) == 0 {
		return "", fmt.Errorf("no choices in response")
	}

	return result.Choices[0].Message.Content, nil
}

// handleErrorResponse handles different error status codes
func (p *DeepSeekProvider) handleErrorResponse(statusCode int, body []byte) error {
	var errorResp struct {
		Error string `json:"error"`
	}
	json.Unmarshal(body, &errorResp)

	switch statusCode {
	case http.StatusUnauthorized:
		return fmt.Errorf("DeepSeek authentication failed: invalid API key")
	case http.StatusTooManyRequests:
		return fmt.Errorf("DeepSeek rate limit exceeded")
	case http.StatusBadRequest:
		return fmt.Errorf("DeepSeek bad request: %s", errorResp.Error)
	case http.StatusInternalServerError, http.StatusServiceUnavailable:
		return fmt.Errorf("DeepSeek API error: service unavailable")
	default:
		return fmt.Errorf("DeepSeek API error: status %d, message: %s", statusCode, errorResp.Error)
	}
}
