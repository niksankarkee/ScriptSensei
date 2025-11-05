package services

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TDD: Write tests FIRST before implementation
// Following CLAUDE.md TDD requirements

func TestQualityScorer_CalculateHookScore(t *testing.T) {
	scorer := NewQualityScorer()

	tests := []struct {
		name     string
		content  string
		platform string
		minScore int
		maxScore int
	}{
		{
			name:     "Strong TikTok Hook with Question",
			content:  "Did you know that 90% of people don't know this secret? Here's what you need to learn.",
			platform: "TikTok",
			minScore: 70,
			maxScore: 100,
		},
		{
			name:     "Weak Hook",
			content:  "Hello everyone, welcome to my channel.",
			platform: "YouTube",
			minScore: 20,
			maxScore: 60,
		},
		{
			name:     "Hook with Power Words",
			content:  "Imagine discovering the secret to amazing results! You won't believe this.",
			platform: "YouTube",
			minScore: 65,
			maxScore: 100,
		},
		{
			name:     "Hook with Numbers",
			content:  "5 shocking facts that will change everything you know.",
			platform: "Instagram",
			minScore: 60,
			maxScore: 100,
		},
		{
			name:     "Too Short",
			content:  "Hi there.",
			platform: "YouTube",
			minScore: 10,
			maxScore: 40,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			score := scorer.calculateHookScore(tt.content, tt.platform)
			assert.GreaterOrEqual(t, score, tt.minScore, "Score should be >= minScore")
			assert.LessOrEqual(t, score, tt.maxScore, "Score should be <= maxScore")
			assert.LessOrEqual(t, score, 100, "Score should never exceed 100")
		})
	}
}

func TestQualityScorer_CalculateEngagementScore(t *testing.T) {
	scorer := NewQualityScorer()

	tests := []struct {
		name     string
		content  string
		minScore int
	}{
		{
			name:     "High Engagement with CTA",
			content:  "You need to see this! Have you ever wondered why? Comment below and let me know. Don't forget to subscribe!",
			minScore: 70,
		},
		{
			name:     "Multiple Questions",
			content:  "What do you think? Have you tried this? Would you do it differently?",
			minScore: 65,
		},
		{
			name:     "Emotional Words",
			content:  "This is absolutely amazing and shocking! You'll love what happens next.",
			minScore: 60,
		},
		{
			name:     "Low Engagement",
			content:  "This is a video about something.",
			minScore: 40,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			score := scorer.calculateEngagementScore(tt.content)
			assert.GreaterOrEqual(t, score, tt.minScore, "Score should be >= minScore")
			assert.LessOrEqual(t, score, 100, "Score should never exceed 100")
		})
	}
}

func TestQualityScorer_CalculateSEOScore(t *testing.T) {
	scorer := NewQualityScorer()

	tests := []struct {
		name     string
		content  string
		minScore int
	}{
		{
			name:     "Optimal Word Count with Hashtags",
			content:  generateContent(150) + " #trending #viral #amazing",
			minScore: 70,
		},
		{
			name:     "Too Short",
			content:  "Short content here.",
			minScore: 40,
		},
		{
			name:     "Keyword Stuffing",
			content:  "video video video video video video video video video video",
			minScore: 40,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			score := scorer.calculateSEOScore(tt.content)
			assert.GreaterOrEqual(t, score, tt.minScore, "Score should be >= minScore")
			assert.LessOrEqual(t, score, 100, "Score should never exceed 100")
		})
	}
}

func TestQualityScorer_CalculateReadabilityScore(t *testing.T) {
	scorer := NewQualityScorer()

	tests := []struct {
		name     string
		content  string
		minScore int
	}{
		{
			name:     "Good Readability",
			content:  "This is a simple sentence. Here is another one. And one more.",
			minScore: 60,
		},
		{
			name:     "Too Complex",
			content:  "Notwithstanding the aforementioned circumstances and the predominantly overwhelming evidence.",
			minScore: 40,
		},
		{
			name:     "Very Simple",
			content:  "Hi. This is good. You will like it. It is fun. Try it now.",
			minScore: 60,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			score := scorer.calculateReadabilityScore(tt.content)
			assert.GreaterOrEqual(t, score, tt.minScore, "Score should be >= minScore")
			assert.LessOrEqual(t, score, 100, "Score should never exceed 100")
		})
	}
}

func TestQualityScorer_AnalyzeScript(t *testing.T) {
	scorer := NewQualityScorer()

	tests := []struct {
		name            string
		content         string
		platform        string
		minOverallScore int
	}{
		{
			name: "High Quality TikTok Script",
			content: `Did you know that 90% of people miss this? Here's the secret you need to discover.
					  You won't believe how amazing this is! Comment below if you've tried this.
					  Don't forget to share with your friends! #viral #trending`,
			platform:        "TikTok",
			minOverallScore: 65,
		},
		{
			name: "Average Quality Script",
			content: `This is a video about something interesting. Here are some facts.
					  I hope you enjoyed this video.`,
			platform:        "YouTube",
			minOverallScore: 40,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := scorer.AnalyzeScript(tt.content, tt.platform)

			// Check all scores are present
			assert.NotNil(t, result)
			assert.GreaterOrEqual(t, result.HookScore, 0)
			assert.LessOrEqual(t, result.HookScore, 100)
			assert.GreaterOrEqual(t, result.EngagementScore, 0)
			assert.LessOrEqual(t, result.EngagementScore, 100)
			assert.GreaterOrEqual(t, result.SEOScore, 0)
			assert.LessOrEqual(t, result.SEOScore, 100)
			assert.GreaterOrEqual(t, result.ReadabilityScore, 0)
			assert.LessOrEqual(t, result.ReadabilityScore, 100)

			// Check overall score
			assert.GreaterOrEqual(t, result.OverallScore, tt.minOverallScore)
			assert.LessOrEqual(t, result.OverallScore, 100)

			// Check suggestions exist
			assert.NotNil(t, result.Suggestions)
		})
	}
}

func TestQualityScorer_GenerateSuggestions(t *testing.T) {
	scorer := NewQualityScorer()

	tests := []struct {
		name               string
		hookScore          int
		engagementScore    int
		seoScore           int
		readabilityScore   int
		expectedSuggestions int
	}{
		{
			name:                "All Low Scores",
			hookScore:           40,
			engagementScore:     40,
			seoScore:            40,
			readabilityScore:    40,
			expectedSuggestions: 4,
		},
		{
			name:                "All High Scores",
			hookScore:           80,
			engagementScore:     80,
			seoScore:            80,
			readabilityScore:    80,
			expectedSuggestions: 0,
		},
		{
			name:                "Mixed Scores",
			hookScore:           50,
			engagementScore:     70,
			seoScore:            50,
			readabilityScore:    70,
			expectedSuggestions: 2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			suggestions := scorer.generateSuggestions(tt.hookScore, tt.engagementScore, tt.seoScore, tt.readabilityScore)
			assert.Equal(t, tt.expectedSuggestions, len(suggestions), "Should have expected number of suggestions")
		})
	}
}

func TestSplitIntoSentences(t *testing.T) {
	tests := []struct {
		name     string
		text     string
		expected int
	}{
		{
			name:     "Multiple sentences",
			text:     "This is sentence one. This is sentence two! And this is three?",
			expected: 3,
		},
		{
			name:     "Single sentence",
			text:     "This is just one sentence.",
			expected: 1,
		},
		{
			name:     "Empty string",
			text:     "",
			expected: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			sentences := splitIntoSentences(tt.text)
			// Filter out empty strings
			nonEmpty := 0
			for _, s := range sentences {
				if len(s) > 0 {
					nonEmpty++
				}
			}
			assert.Equal(t, tt.expected, nonEmpty)
		})
	}
}

func TestMin(t *testing.T) {
	tests := []struct {
		name     string
		a        int
		b        int
		expected int
	}{
		{"A is smaller", 5, 10, 5},
		{"B is smaller", 10, 5, 5},
		{"Equal", 5, 5, 5},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := min(tt.a, tt.b)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// Helper function to generate content with specific word count
func generateContent(wordCount int) string {
	result := ""
	for i := 0; i < wordCount; i++ {
		result += "word "
	}
	return result
}
