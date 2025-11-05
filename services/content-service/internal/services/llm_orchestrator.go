package services

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/scriptsensei/content-service/internal/models"
)

// LLMProvider defines the interface for any LLM provider
type LLMProvider interface {
	GenerateText(ctx context.Context, prompt string, options map[string]interface{}) (string, error)
	Name() string
}

// LLMOrchestrator manages multiple LLM providers with fallback logic
type LLMOrchestrator struct {
	providers []LLMProvider
}

// NewLLMOrchestrator creates a new LLM orchestrator with the given providers
// Providers are tried in order until one succeeds
func NewLLMOrchestrator(providers []LLMProvider) *LLMOrchestrator {
	return &LLMOrchestrator{
		providers: providers,
	}
}

// GenerateScript generates a script using the LLM providers with fallback
func (o *LLMOrchestrator) GenerateScript(ctx context.Context, req *models.ScriptGenerationRequest) (*models.ScriptGenerationResponse, error) {
	// Validate request
	if err := o.validateRequest(req); err != nil {
		return nil, err
	}

	// Build prompt
	prompt := o.buildPrompt(req)

	// Options for LLM
	options := make(map[string]interface{})
	if req.Temperature > 0 {
		options["temperature"] = req.Temperature
	} else {
		options["temperature"] = 0.7 // Default
	}
	if req.MaxTokens > 0 {
		options["max_tokens"] = req.MaxTokens
	}

	// Try each provider in order
	var lastError error
	for _, provider := range o.providers {
		content, err := provider.GenerateText(ctx, prompt, options)
		if err != nil {
			lastError = fmt.Errorf("%s failed: %w", provider.Name(), err)
			continue // Try next provider
		}

		// Success!
		return &models.ScriptGenerationResponse{
			Content:      content,
			ProviderUsed: provider.Name(),
		}, nil
	}

	// All providers failed
	if lastError != nil {
		return nil, fmt.Errorf("all LLM providers failed, last error: %w", lastError)
	}
	return nil, errors.New("all LLM providers failed")
}

// validateRequest validates the script generation request
func (o *LLMOrchestrator) validateRequest(req *models.ScriptGenerationRequest) error {
	if req.Topic == "" {
		return errors.New("topic is required")
	}
	if req.Platform == "" {
		return errors.New("platform is required")
	}
	if req.Duration <= 0 {
		return errors.New("duration must be greater than 0")
	}
	if req.Language == "" {
		return errors.New("language is required")
	}
	return nil
}

// buildPrompt constructs the prompt for the LLM based on the request
func (o *LLMOrchestrator) buildPrompt(req *models.ScriptGenerationRequest) string {
	var sb strings.Builder

	// Language mapping for clearer instructions
	languageNames := map[string]string{
		"en": "English",
		"ja": "Japanese (日本語)",
		"ne": "Nepali (नेपाली)",
		"hi": "Hindi (हिन्दी)",
		"id": "Indonesian (Bahasa Indonesia)",
		"th": "Thai (ภาษาไทย)",
		"es": "Spanish (Español)",
		"fr": "French (Français)",
		"de": "German (Deutsch)",
		"zh": "Chinese (中文)",
		"ko": "Korean (한국어)",
		"ar": "Arabic (العربية)",
		"pt": "Portuguese (Português)",
		"ru": "Russian (Русский)",
		"vi": "Vietnamese (Tiếng Việt)",
		"tl": "Tagalog",
		"ms": "Malay (Bahasa Melayu)",
	}

	languageName, ok := languageNames[req.Language]
	if !ok {
		languageName = req.Language // Fallback to code if not in map
	}

	// Start with clear role and output format
	sb.WriteString("You are a professional video script writer.\n")
	sb.WriteString(fmt.Sprintf("Write an engaging video script in %s language with clear structure.\n", languageName))
	sb.WriteString("Format your script with:\n")
	sb.WriteString("- A compelling title at the start\n")
	sb.WriteString("- Clear subtitles/sections using ## headings\n")
	sb.WriteString("- The actual narration text under each section\n\n")
	sb.WriteString("CRITICAL RULES:\n")
	sb.WriteString("- DO NOT include any timing markers or timestamps\n")
	sb.WriteString("- DO NOT include production labels like 'Narrator:', 'Scene:', 'Visual:', etc.\n")
	sb.WriteString("- DO NOT include duration indicators like '(0-5 seconds)', '(२ सेकेन्ड)', etc.\n")
	sb.WriteString("- Write ONLY the title, section headings, and spoken narration text\n\n")

	// Topic and duration
	sb.WriteString(fmt.Sprintf("Topic: %s\n", req.Topic))
	sb.WriteString(fmt.Sprintf("Duration: approximately %d seconds of speech\n", req.Duration))
	sb.WriteString(fmt.Sprintf("Platform: %s\n\n", req.Platform))

	// Platform-specific style (NO TIMING REFERENCES)
	switch req.Platform {
	case "TikTok":
		sb.WriteString("Style: Start with a strong hook to grab attention immediately.\n")
		sb.WriteString("Use fast-paced, energetic language. Keep sentences short and punchy.\n")
		if req.Duration <= 60 {
			sb.WriteString("This is short-form content - make every word count.\n")
		}
	case "YouTube":
		if req.Duration <= 60 {
			sb.WriteString("Style: Start with a hook question or bold statement.\n")
			sb.WriteString("Keep it engaging and fast-paced throughout.\n")
		} else {
			sb.WriteString("Style: Start with an engaging hook to capture viewers.\n")
			sb.WriteString("Structure with clear flow and logical progression.\n")
			sb.WriteString("End with a strong call-to-action.\n")
		}
	case "Instagram":
		sb.WriteString("Style: Visual storytelling with trendy, relatable language.\n")
		sb.WriteString("Use hashtag-friendly and shareable content.\n")
	case "Facebook":
		sb.WriteString("Style: Informative and shareable content.\n")
		sb.WriteString("Start with a question or surprising fact for engagement.\n")
	case "LinkedIn":
		sb.WriteString("Style: Professional, value-driven content.\n")
		sb.WriteString("Focus on insights, lessons, or industry knowledge.\n")
	}

	// Style
	if req.Style != "" {
		sb.WriteString(fmt.Sprintf("\nStyle: %s\n", req.Style))
	}

	// Tone
	if req.Tone != "" {
		sb.WriteString(fmt.Sprintf("Tone: %s\n", req.Tone))
	}

	// Target audience
	if req.TargetAge != "" {
		sb.WriteString(fmt.Sprintf("Target audience age: %s\n", req.TargetAge))
	}

	// Keywords
	if len(req.Keywords) > 0 {
		sb.WriteString(fmt.Sprintf("\nSEO Keywords to include naturally: %s\n", strings.Join(req.Keywords, ", ")))
	}

	// Call to action
	if req.CTA != "" {
		sb.WriteString(fmt.Sprintf("\nCall to action: %s\n", req.CTA))
	}

	// Final reminder
	sb.WriteString(fmt.Sprintf("\nWrite the complete script in %s language with title and section headings.\n", languageName))
	sb.WriteString("Remember: Include structure (title, ## headings, narration) but NO timing markers or production labels.\n")

	return sb.String()
}
