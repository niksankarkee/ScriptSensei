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

// ClaudeProvider implements LLMProvider for Anthropic Claude API
type ClaudeProvider struct {
	apiKey  string
	baseURL string
	model   string
	client  *http.Client
}

// NewClaudeProvider creates a new Claude provider
// Uses Claude 3 Haiku by default (cost-effective: $0.25/$1.25 per M tokens)
func NewClaudeProvider(apiKey, baseURL string) *ClaudeProvider {
	if baseURL == "" {
		baseURL = "https://api.anthropic.com/v1"
	}
	return &ClaudeProvider{
		apiKey:  apiKey,
		baseURL: baseURL,
		model:   "claude-3-haiku-20240307", // Haiku for cost optimization
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// Name returns the provider name
func (p *ClaudeProvider) Name() string {
	return "Claude"
}

// GenerateText generates text using Claude API
func (p *ClaudeProvider) GenerateText(ctx context.Context, prompt string, options map[string]interface{}) (string, error) {
	// Validate prompt
	if prompt == "" {
		return "", fmt.Errorf("prompt cannot be empty")
	}

	// Build request payload (Claude uses Messages API)
	payload := map[string]interface{}{
		"model": p.model,
		"messages": []map[string]interface{}{
			{
				"role":    "user",
				"content": prompt,
			},
		},
	}

	// Add max_tokens (required by Claude API)
	if maxTokens, ok := options["max_tokens"]; ok {
		payload["max_tokens"] = maxTokens
	} else {
		payload["max_tokens"] = 2000 // Default
	}

	// Add temperature if provided
	if temp, ok := options["temperature"]; ok {
		payload["temperature"] = temp
	}

	// Marshal payload
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP request
	url := fmt.Sprintf("%s/messages", p.baseURL)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	// Set required headers for Claude API
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", p.apiKey)
	req.Header.Set("anthropic-version", "2023-06-01") // Required API version header

	// Send request
	resp, err := p.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("Claude API request failed: %w", err)
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
		Type    string `json:"type"`
		Role    string `json:"role"`
		Content []struct {
			Type string `json:"type"`
			Text string `json:"text"`
		} `json:"content"`
		Model        string `json:"model"`
		StopReason   string `json:"stop_reason"`
		StopSequence string `json:"stop_sequence,omitempty"`
		Usage        struct {
			InputTokens  int `json:"input_tokens"`
			OutputTokens int `json:"output_tokens"`
		} `json:"usage"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	// Extract text from content
	if len(result.Content) == 0 {
		return "", fmt.Errorf("no content in response")
	}

	// Concatenate all text parts (Claude can return multiple content blocks)
	var textContent string
	for _, content := range result.Content {
		if content.Type == "text" {
			textContent += content.Text
		}
	}

	if textContent == "" {
		return "", fmt.Errorf("no text content in response")
	}

	return textContent, nil
}

// handleErrorResponse handles different error status codes
func (p *ClaudeProvider) handleErrorResponse(statusCode int, body []byte) error {
	var errorResp struct {
		Type  string `json:"type"`
		Error struct {
			Type    string `json:"type"`
			Message string `json:"message"`
		} `json:"error"`
	}
	json.Unmarshal(body, &errorResp)

	switch statusCode {
	case http.StatusUnauthorized, http.StatusForbidden:
		return fmt.Errorf("Claude authentication failed: invalid API key")
	case http.StatusTooManyRequests:
		return fmt.Errorf("Claude rate limit exceeded")
	case http.StatusBadRequest:
		return fmt.Errorf("Claude bad request: %s", errorResp.Error.Message)
	case http.StatusServiceUnavailable, http.StatusGatewayTimeout:
		return fmt.Errorf("Claude service temporarily unavailable")
	default:
		return fmt.Errorf("Claude API error: status %d, type: %s, message: %s",
			statusCode, errorResp.Error.Type, errorResp.Error.Message)
	}
}
