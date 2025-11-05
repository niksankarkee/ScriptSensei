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

// GeminiProvider implements LLMProvider for Google Gemini API
type GeminiProvider struct {
	apiKey  string
	baseURL string
	client  *http.Client
}

// NewGeminiProvider creates a new Gemini provider
func NewGeminiProvider(apiKey, baseURL string) *GeminiProvider {
	if baseURL == "" {
		baseURL = "https://generativelanguage.googleapis.com/v1beta"
	}
	return &GeminiProvider{
		apiKey:  apiKey,
		baseURL: baseURL,
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// Name returns the provider name
func (p *GeminiProvider) Name() string {
	return "Gemini"
}

// GenerateText generates text using Gemini API
func (p *GeminiProvider) GenerateText(ctx context.Context, prompt string, options map[string]interface{}) (string, error) {
	// Build request payload (Gemini has a different structure)
	payload := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]interface{}{
					{"text": prompt},
				},
			},
		},
	}

	// Add generation config
	genConfig := make(map[string]interface{})
	if temp, ok := options["temperature"]; ok {
		genConfig["temperature"] = temp
	} else {
		genConfig["temperature"] = 0.7
	}

	if maxTokens, ok := options["max_tokens"]; ok {
		genConfig["maxOutputTokens"] = maxTokens
	} else {
		genConfig["maxOutputTokens"] = 2000
	}

	payload["generationConfig"] = genConfig

	// Marshal payload
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP request (Gemini uses API key in URL query parameter)
	url := fmt.Sprintf("%s/models/gemini-2.0-flash:generateContent?key=%s", p.baseURL, p.apiKey)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")

	// Send request
	resp, err := p.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("Gemini API request failed: %w", err)
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
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	if len(result.Candidates) == 0 || len(result.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no content in response")
	}

	return result.Candidates[0].Content.Parts[0].Text, nil
}

// handleErrorResponse handles different error status codes
func (p *GeminiProvider) handleErrorResponse(statusCode int, body []byte) error {
	var errorResp struct {
		Error struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	json.Unmarshal(body, &errorResp)

	switch statusCode {
	case http.StatusForbidden, http.StatusUnauthorized:
		return fmt.Errorf("Gemini authentication failed: invalid API key")
	case http.StatusTooManyRequests:
		return fmt.Errorf("Gemini rate limit exceeded")
	case http.StatusBadRequest:
		return fmt.Errorf("Gemini bad request: %s", errorResp.Error.Message)
	default:
		return fmt.Errorf("Gemini API error: status %d, message: %s", statusCode, errorResp.Error.Message)
	}
}
