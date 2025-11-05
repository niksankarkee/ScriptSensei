package models

import (
	"time"

	"github.com/google/uuid"
)

// ScriptGenerationRequest represents a request to generate a script
type ScriptGenerationRequest struct {
	Topic       string                 `json:"topic" validate:"required"`
	Platform    string                 `json:"platform" validate:"required,oneof=TikTok YouTube Instagram Facebook LinkedIn"`
	Duration    int                    `json:"duration" validate:"required,min=15,max=600"` // in seconds
	Language    string                 `json:"language" validate:"required"`
	Style       string                 `json:"style,omitempty"`                                                                 // casual, professional, educational, entertaining
	TargetAge   string                 `json:"target_age,omitempty"`                                                            // 13-17, 18-24, 25-34, etc.
	Keywords    []string               `json:"keywords,omitempty"`                                                              // SEO keywords to include
	Tone        string                 `json:"tone,omitempty"`                                                                  // informative, humorous, inspirational, etc.
	CTA         string                 `json:"cta,omitempty"`                                                                   // Call to action
	Temperature float32                `json:"temperature,omitempty" validate:"min=0,max=2"`                                    // LLM temperature (0-2)
	MaxTokens   int                    `json:"max_tokens,omitempty"`                                                            // Max response tokens
	Metadata    map[string]interface{} `json:"metadata,omitempty"`                                                              // Additional metadata
}

// ScriptGenerationResponse represents the generated script
type ScriptGenerationResponse struct {
	Content      string                 `json:"content"`
	ProviderUsed string                 `json:"provider_used"`
	TokensUsed   int                    `json:"tokens_used,omitempty"`
	CostUSD      float64                `json:"cost_usd,omitempty"`
	Quality      *ScriptQualityScore    `json:"quality,omitempty"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
}

// Helper methods for backward compatibility
func (s *ScriptGenerationResponse) Provider() string {
	return s.ProviderUsed
}

func (s *ScriptGenerationResponse) QualityScore() int {
	if s.Quality != nil {
		return s.Quality.OverallScore
	}
	return 0
}

func (s *ScriptGenerationResponse) HookScore() int {
	if s.Quality != nil {
		return s.Quality.HookScore
	}
	return 0
}

func (s *ScriptGenerationResponse) WordCount() int {
	// Simple word count
	if s.Metadata != nil {
		if wc, ok := s.Metadata["word_count"].(int); ok {
			return wc
		}
	}
	return len(s.Content) / 5 // Rough estimate
}

func (s *ScriptGenerationResponse) EstimatedDuration() int {
	// Estimate duration in seconds (avg 150 words per minute)
	wordCount := s.WordCount()
	return (wordCount * 60) / 150
}

// ScriptQualityScore represents quality metrics for a script
type ScriptQualityScore struct {
	HookScore       int     `json:"hook_score"`       // 0-100
	EngagementScore int     `json:"engagement_score"` // 0-100
	SEOScore        int     `json:"seo_score"`        // 0-100
	ReadabilityScore int    `json:"readability_score"` // 0-100
	OverallScore    int     `json:"overall_score"`    // 0-100
	Suggestions     []string `json:"suggestions,omitempty"`
}

// Script represents a script in the database
type Script struct {
	ID            uuid.UUID              `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID        uuid.UUID              `json:"user_id" gorm:"type:uuid;not null;index:idx_scripts_user"`
	Title         string                 `json:"title" gorm:"type:varchar(255)"`
	Content       string                 `json:"content" gorm:"type:text;not null"`
	Topic         string                 `json:"topic" gorm:"type:varchar(255);not null"`
	Platform      string                 `json:"platform" gorm:"type:varchar(50);index:idx_scripts_platform"`
	Duration      int                    `json:"duration"` // in seconds
	Language      string                 `json:"language" gorm:"type:varchar(50)"`
	Style         string                 `json:"style" gorm:"type:varchar(50)"`
	TargetAge     string                 `json:"target_age" gorm:"type:varchar(50)"`
	Keywords      []string               `json:"keywords" gorm:"type:text[]"`
	Tone          string                 `json:"tone" gorm:"type:varchar(50)"`
	CTA           string                 `json:"cta" gorm:"type:text"`
	ProviderUsed  string                 `json:"provider_used" gorm:"type:varchar(50)"`
	TokensUsed    int                    `json:"tokens_used"`
	CostUSD       float64                `json:"cost_usd"`
	QualityScores *ScriptQualityScore    `json:"quality_scores" gorm:"type:jsonb"`
	Metadata      map[string]interface{} `json:"metadata" gorm:"type:jsonb"`
	CreatedAt     time.Time              `json:"created_at" gorm:"index:idx_scripts_created"`
	UpdatedAt     time.Time              `json:"updated_at"`
}

// TableName specifies the table name for Script
func (Script) TableName() string {
	return "scripts"
}

// Template represents a script template
type Template struct {
	ID          uuid.UUID              `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Name        string                 `json:"name" gorm:"type:varchar(255);not null"`
	Description string                 `json:"description" gorm:"type:text"`
	Category    string                 `json:"category" gorm:"type:varchar(100);index:idx_templates_category"`
	Platform    string                 `json:"platform" gorm:"type:varchar(50)"`
	Content     string                 `json:"content" gorm:"type:text;not null"`
	Variables   []string               `json:"variables" gorm:"type:text[]"` // Placeholders like {{topic}}, {{duration}}
	IsPremium   bool                   `json:"is_premium" gorm:"default:false"`
	UsageCount  int                    `json:"usage_count" gorm:"default:0"`
	Metadata    map[string]interface{} `json:"metadata" gorm:"type:jsonb"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

// TableName specifies the table name for Template
func (Template) TableName() string {
	return "templates"
}

// ScriptRequest is an alias for ScriptGenerationRequest for backward compatibility
type ScriptRequest = ScriptGenerationRequest
