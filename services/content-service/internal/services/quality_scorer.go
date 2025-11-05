package services

import (
	"regexp"
	"strings"

	"github.com/scriptsensei/content-service/internal/models"
)

// QualityScorer analyzes script quality across multiple dimensions
type QualityScorer struct{}

// NewQualityScorer creates a new quality scorer instance
func NewQualityScorer() *QualityScorer {
	return &QualityScorer{}
}

// AnalyzeScript performs comprehensive quality analysis on a generated script
func (qs *QualityScorer) AnalyzeScript(content string, platform string) *models.ScriptQualityScore {
	hookScore := qs.calculateHookScore(content, platform)
	engagementScore := qs.calculateEngagementScore(content)
	seoScore := qs.calculateSEOScore(content)
	readabilityScore := qs.calculateReadabilityScore(content)

	// Calculate overall score as average
	overallScore := (hookScore + engagementScore + seoScore + readabilityScore) / 4

	// Generate actionable suggestions
	suggestions := qs.generateSuggestions(hookScore, engagementScore, seoScore, readabilityScore)

	return &models.ScriptQualityScore{
		HookScore:        hookScore,
		EngagementScore:  engagementScore,
		SEOScore:         seoScore,
		ReadabilityScore: readabilityScore,
		OverallScore:     overallScore,
		Suggestions:      suggestions,
	}
}

// calculateHookScore evaluates the opening hook (first 10-15 words)
// Critical for capturing attention in first 3 seconds
func (qs *QualityScorer) calculateHookScore(content string, platform string) int {
	words := strings.Fields(content)
	if len(words) < 5 {
		return 20 // Too short to be effective
	}

	// Extract hook (first 15 words or less)
	hookLength := min(15, len(words))
	hookWords := words[:hookLength]
	hookText := strings.Join(hookWords, " ")
	hookLower := strings.ToLower(hookText)

	score := 50 // Base score

	// Check for question mark (questions are engaging)
	if strings.Contains(hookText, "?") {
		score += 15
	}

	// Check for power words that grab attention
	powerWords := []string{
		"imagine", "discover", "secret", "shocking",
		"amazing", "never", "must", "incredible", "unbelievable",
		"warning", "urgent", "breakthrough", "revealed", "exposed",
		"results", "believe",
	}
	powerWordCount := 0
	for _, pw := range powerWords {
		if strings.Contains(hookLower, pw) {
			powerWordCount++
		}
	}
	// Bonus for power words (up to +15 for multiple power words)
	score += min(15, powerWordCount*7)

	// Platform-specific bonuses
	if platform == "TikTok" {
		// TikTok hooks starting with questions perform well
		if strings.HasPrefix(hookLower, "did you") || strings.HasPrefix(hookLower, "have you") {
			score += 10
		}
		// Fast-paced urgency words
		urgencyWords := []string{"wait", "stop", "don't scroll", "before you"}
		for _, uw := range urgencyWords {
			if strings.Contains(hookLower, uw) {
				score += 10
				break
			}
		}
	}

	// Check for numbers/statistics (specific facts are engaging)
	numberPattern := regexp.MustCompile(`\d+`)
	if numberPattern.MatchString(hookText) {
		score += 10
	}

	// Check for direct address to viewer
	if strings.Contains(hookLower, "you") {
		score += 5
	}

	return min(100, score)
}

// calculateEngagementScore measures content's ability to keep viewers engaged
func (qs *QualityScorer) calculateEngagementScore(content string) int {
	contentLower := strings.ToLower(content)
	score := 50 // Base score

	// Questions throughout content increase engagement
	questionCount := strings.Count(content, "?")
	score += min(20, questionCount*5) // Up to +20 for multiple questions

	// Call-to-action keywords
	ctaKeywords := []string{
		"comment", "like", "subscribe", "share", "follow",
		"click", "join", "watch", "check out", "let me know",
	}
	for _, cta := range ctaKeywords {
		if strings.Contains(contentLower, cta) {
			score += 10
			break // Bonus once for having CTA
		}
	}

	// Emotional words increase connection
	emotionalWords := []string{
		"love", "hate", "amazing", "incredible", "shocking",
		"unbelievable", "excited", "surprised", "disappointed",
		"thrilled", "angry", "happy", "sad",
	}
	emotionCount := 0
	for _, ew := range emotionalWords {
		if strings.Contains(contentLower, ew) {
			emotionCount++
		}
	}
	score += min(15, emotionCount*5) // Up to +15 for emotional language

	// Direct address to viewer ("you", "your")
	youCount := strings.Count(contentLower, "you")
	score += min(15, youCount*3) // Up to +15 for viewer engagement

	return min(100, score)
}

// calculateSEOScore evaluates search and discovery optimization
func (qs *QualityScorer) calculateSEOScore(content string) int {
	score := 50 // Base score

	// Word count analysis (optimal range for video scripts)
	words := strings.Fields(content)
	wordCount := len(words)

	if wordCount >= 100 && wordCount <= 500 {
		score += 20 // Optimal range
	} else if wordCount >= 50 && wordCount <= 800 {
		score += 10 // Acceptable range
	}

	// Keyword density check (avoid stuffing)
	if wordCount > 0 {
		wordFreq := make(map[string]int)
		for _, word := range words {
			wordLower := strings.ToLower(word)
			// Only count meaningful words (length > 4)
			if len(wordLower) > 4 {
				wordFreq[wordLower]++
			}
		}

		// Find max frequency
		maxFreq := 0
		for _, freq := range wordFreq {
			if freq > maxFreq {
				maxFreq = freq
			}
		}

		// Calculate keyword density
		if wordCount > 0 {
			density := float64(maxFreq) / float64(wordCount)
			if density < 0.03 { // Less than 3% - good
				score += 20
			} else if density < 0.05 { // Less than 5% - acceptable
				score += 10
			}
			// Over 5% is keyword stuffing - no bonus
		}
	}

	// Hashtag presence (important for social media)
	if strings.Contains(content, "#") {
		score += 10
	}

	return min(100, score)
}

// calculateReadabilityScore measures how easy the content is to understand
func (qs *QualityScorer) calculateReadabilityScore(content string) int {
	score := 50 // Base score

	sentences := splitIntoSentences(content)
	words := strings.Fields(content)

	if len(sentences) == 0 || len(words) == 0 {
		return 20 // Invalid content
	}

	// Average words per sentence (8-15 is optimal for video narration)
	avgWordsPerSentence := float64(len(words)) / float64(len(sentences))

	if avgWordsPerSentence >= 8 && avgWordsPerSentence <= 15 {
		score += 25 // Optimal range
	} else if avgWordsPerSentence >= 5 && avgWordsPerSentence <= 20 {
		score += 15 // Acceptable range
	} else {
		score += 5 // Too short or too long
	}

	// Check for language complexity (simpler is better for videos)
	complexWords := 0
	for _, word := range words {
		if len(word) > 10 { // Long words are complex
			complexWords++
		}
	}

	complexityRatio := float64(complexWords) / float64(len(words))
	if complexityRatio < 0.1 { // Less than 10% complex words
		score += 25
	} else if complexityRatio < 0.2 { // Less than 20%
		score += 15
	}

	return min(100, score)
}

// generateSuggestions creates actionable recommendations based on scores
func (qs *QualityScorer) generateSuggestions(hook, engagement, seo, readability int) []string {
	suggestions := []string{}

	if hook < 60 {
		suggestions = append(suggestions, "Start with a stronger hook - try a question, surprising fact, or bold statement")
	}

	if engagement < 60 {
		// Combine engagement suggestions into one for consistency
		suggestions = append(suggestions, "Add more direct address ('you', 'your') and include a clear call-to-action (comment, like, subscribe)")
	}

	if seo < 60 {
		suggestions = append(suggestions, "Optimize keyword usage - ensure key topics appear naturally 2-3 times")
	}

	if readability < 60 {
		suggestions = append(suggestions, "Simplify language - shorter sentences and simpler words work better for video")
	}

	return suggestions
}

// splitIntoSentences breaks text into individual sentences
func splitIntoSentences(text string) []string {
	// Replace sentence endings with a delimiter
	text = strings.ReplaceAll(text, ". ", ".|")
	text = strings.ReplaceAll(text, "! ", "!|")
	text = strings.ReplaceAll(text, "? ", "?|")

	// Split by delimiter
	parts := strings.Split(text, "|")

	// Filter out empty strings and trim whitespace
	sentences := []string{}
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if len(trimmed) > 0 {
			sentences = append(sentences, trimmed)
		}
	}

	return sentences
}

// min returns the smaller of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
