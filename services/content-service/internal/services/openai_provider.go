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

// OpenAIProvider implements LLMProvider for OpenAI API
type OpenAIProvider struct {
	apiKey  string
	baseURL string
	model   string
	client  *http.Client
}

// NewOpenAIProvider creates a new OpenAI provider
// Uses GPT-4o-mini by default (cost-effective: $0.15/$0.60 per M tokens)
func NewOpenAIProvider(apiKey, baseURL string) *OpenAIProvider {
	if baseURL == "" {
		baseURL = "https://api.openai.com/v1"
	}
	return &OpenAIProvider{
		apiKey:  apiKey,
		baseURL: baseURL,
		model:   "gpt-4o-mini", // GPT-4o-mini for cost optimization
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// Name returns the provider name
func (p *OpenAIProvider) Name() string {
	return "OpenAI"
}

// GenerateText generates text using OpenAI API
func (p *OpenAIProvider) GenerateText(ctx context.Context, prompt string, options map[string]interface{}) (string, error) {
	// Validate prompt
	if prompt == "" {
		return "", fmt.Errorf("prompt cannot be empty")
	}

	// Build request payload (OpenAI uses Chat Completions API)
	payload := map[string]interface{}{
		"model": p.model,
		"messages": []map[string]interface{}{
			{
				"role":    "user",
				"content": prompt,
			},
		},
	}

	// Add temperature if provided
	if temp, ok := options["temperature"]; ok {
		payload["temperature"] = temp
	} else {
		payload["temperature"] = 0.7 // Default
	}

	// Add max_tokens if provided
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
	url := fmt.Sprintf("%s/chat/completions", p.baseURL)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", p.apiKey))

	// Send request
	resp, err := p.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("OpenAI API request failed: %w", err)
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
		ID      string `json:"id"`
		Object  string `json:"object"`
		Created int64  `json:"created"`
		Model   string `json:"model"`
		Choices []struct {
			Index   int `json:"index"`
			Message struct {
				Role    string `json:"role"`
				Content string `json:"content"`
			} `json:"message"`
			FinishReason string `json:"finish_reason"`
		} `json:"choices"`
		Usage struct {
			PromptTokens     int `json:"prompt_tokens"`
			CompletionTokens int `json:"completion_tokens"`
			TotalTokens      int `json:"total_tokens"`
		} `json:"usage"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	// Extract text from response
	if len(result.Choices) == 0 {
		return "", fmt.Errorf("no choices in response")
	}

	content := result.Choices[0].Message.Content
	if content == "" {
		return "", fmt.Errorf("no content in response")
	}

	return content, nil
}

// handleErrorResponse handles different error status codes
func (p *OpenAIProvider) handleErrorResponse(statusCode int, body []byte) error {
	var errorResp struct {
		Error struct {
			Message string `json:"message"`
			Type    string `json:"type"`
			Param   string `json:"param,omitempty"`
			Code    string `json:"code,omitempty"`
		} `json:"error"`
	}
	json.Unmarshal(body, &errorResp)

	switch statusCode {
	case http.StatusUnauthorized:
		return fmt.Errorf("OpenAI authentication failed: invalid API key")
	case http.StatusForbidden:
		return fmt.Errorf("OpenAI access forbidden: %s", errorResp.Error.Message)
	case http.StatusTooManyRequests:
		return fmt.Errorf("OpenAI rate limit exceeded")
	case http.StatusBadRequest:
		return fmt.Errorf("OpenAI bad request: %s", errorResp.Error.Message)
	case http.StatusServiceUnavailable, http.StatusGatewayTimeout:
		return fmt.Errorf("OpenAI service temporarily unavailable")
	default:
		return fmt.Errorf("OpenAI API error: status %d, type: %s, message: %s",
			statusCode, errorResp.Error.Type, errorResp.Error.Message)
	}
}
