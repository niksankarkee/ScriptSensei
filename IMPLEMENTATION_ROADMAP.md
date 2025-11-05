# ScriptSensei Implementation Roadmap

**Status**: MVP Phase 1 in Progress
**Last Updated**: January 2025
**Completion**: ~40% Complete

This document provides a step-by-step implementation roadmap to complete the ScriptSensei MVP. Each section indicates current status and remaining work.

---

## Table of Contents

1. [Project Status Overview](#project-status-overview)
2. [Phase 1: Backend Services (Weeks 1-4)](#phase-1-backend-services)
3. [Phase 2: Frontend Pages & Integration (Weeks 5-6)](#phase-2-frontend-integration)
4. [Phase 3: Testing & Quality (Week 7)](#phase-3-testing--quality)
5. [Phase 4: Polish & Launch (Week 8)](#phase-4-polish--launch)
6. [Critical Dependencies](#critical-dependencies)
7. [Quick Start Guide](#quick-start-guide)

---

## Project Status Overview

### ✅ **Completed (40%)**

**Infrastructure**:
- ✅ Docker Compose with all services (PostgreSQL, Redis, RabbitMQ, etc.)
- ✅ Database schema designed and migrations ready
- ✅ Environment configuration templates
- ✅ Makefile for service management
- ✅ Project documentation

**Frontend**:
- ✅ Next.js 14 setup with TypeScript
- ✅ 15 React components (VideoCreationWizard, VideoLibrary, Analytics, etc.)
- ✅ API client infrastructure (axios with interceptors)
- ✅ 6 service modules (content, video, voice, analytics, trend, media)
- ✅ WebSocket hook for real-time updates
- ✅ Backend integration documentation

**Content Service (Go)** - 60% Complete:
- ✅ LLM Orchestrator with fallback logic
- ✅ DeepSeek V3 provider integration
- ✅ Gemini Flash provider integration
- ✅ Script models and handlers
- ✅ Repository pattern
- ✅ Database integration
- ⏳ Missing: Claude/GPT providers, quality scoring, template system

### 🟡 **In Progress (30%)**

**Auth Service (Go)** - 40% Complete:
- ✅ Basic structure
- ✅ Clerk JWT verification setup
- ⏳ Missing: Complete auth middleware, user profile management

**Video Processing Service (Python)** - 30% Complete:
- ✅ FastAPI structure
- ✅ WebSocket setup for progress
- ⏳ Missing: FFmpeg integration, scene composition, rendering pipeline

### 🔴 **Not Started (30%)**

**Voice Service (Go)** - 0%
**Translation Service (Node.js)** - 0%
**Analytics Service (Go)** - 0%
**Trend Service (Python)** - 0%
**Frontend Pages** - 0%
**Tests (TDD)** - 0%
**Kong API Gateway** - 0%

---

## Phase 1: Backend Services (Weeks 1-4)

### Week 1: Content Service Completion

#### Task 1.1: Add Additional LLM Providers (8 hours)

**Status**: ⏳ Pending
**Priority**: Medium
**Files to Create/Modify**:
- `/services/content-service/internal/services/claude_provider.go`
- `/services/content-service/internal/services/openai_provider.go`

**Implementation Steps**:

1. **Claude Haiku Provider** (`claude_provider.go`):
```go
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

type ClaudeProvider struct {
    apiKey  string
    baseURL string
    client  *http.Client
}

func NewClaudeProvider(apiKey string) *ClaudeProvider {
    return &ClaudeProvider{
        apiKey:  apiKey,
        baseURL: "https://api.anthropic.com",
        client: &http.Client{
            Timeout: 60 * time.Second,
        },
    }
}

func (p *ClaudeProvider) Name() string {
    return "Claude"
}

func (p *ClaudeProvider) GenerateText(ctx context.Context, prompt string, options map[string]interface{}) (string, error) {
    // Implementation for Claude API
    // Model: claude-3-haiku-20240307
    // Cost: $0.25/$1.25 per M tokens

    payload := map[string]interface{}{
        "model": "claude-3-haiku-20240307",
        "max_tokens": 2048,
        "messages": []map[string]string{
            {"role": "user", "content": prompt},
        },
    }

    if temp, ok := options["temperature"]; ok {
        payload["temperature"] = temp
    }

    jsonData, _ := json.Marshal(payload)
    req, _ := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/v1/messages", bytes.NewBuffer(jsonData))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("x-api-key", p.apiKey)
    req.Header.Set("anthropic-version", "2023-06-01")

    resp, err := p.client.Do(req)
    if err != nil {
        return "", fmt.Errorf("Claude API request failed: %w", err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)

    var result struct {
        Content []struct {
            Type string `json:"type"`
            Text string `json:"text"`
        } `json:"content"`
    }

    if err := json.Unmarshal(body, &result); err != nil {
        return "", fmt.Errorf("failed to parse Claude response: %w", err)
    }

    if len(result.Content) > 0 {
        return result.Content[0].Text, nil
    }

    return "", fmt.Errorf("Claude returned no content")
}
```

2. **Update Main to Include New Providers**:
```go
// cmd/main.go
providers := []services.LLMProvider{
    services.NewDeepSeekProvider(os.Getenv("DEEPSEEK_API_KEY"), ""),
    services.NewGeminiProvider(os.Getenv("GEMINI_API_KEY")),
    services.NewClaudeProvider(os.Getenv("CLAUDE_API_KEY")),
    services.NewOpenAIProvider(os.Getenv("OPENAI_API_KEY")),
}
orchestrator := services.NewLLMOrchestrator(providers)
```

**Testing**:
```bash
cd services/content-service
go test ./internal/services -v -run TestClaudeProvider
```

---

#### Task 1.2: Implement Script Quality Scoring (6 hours)

**Status**: ⏳ Pending
**Priority**: High
**Files to Create**:
- `/services/content-service/internal/services/quality_scorer.go`
- `/services/content-service/internal/services/quality_scorer_test.go`

**Implementation**:

```go
package services

import (
    "regexp"
    "strings"
    "github.com/scriptsensei/content-service/internal/models"
)

type QualityScorer struct{}

func NewQualityScorer() *QualityScorer {
    return &QualityScorer{}
}

// AnalyzeScript performs quality analysis on a generated script
func (qs *QualityScorer) AnalyzeScript(content string, platform string) *models.ScriptQualityScore {
    hookScore := qs.calculateHookScore(content, platform)
    engagementScore := qs.calculateEngagementScore(content)
    seoScore := qs.calculateSEOScore(content)
    readabilityScore := qs.calculateReadabilityScore(content)

    overallScore := (hookScore + engagementScore + seoScore + readabilityScore) / 4

    suggestions := qs.generateSuggestions(hookScore, engagementScore, seoScore, readabilityScore)

    return &models.ScriptQualityScore{
        HookScore:       hookScore,
        EngagementScore: engagementScore,
        SEOScore:        seoScore,
        ReadabilityScore: readabilityScore,
        OverallScore:    overallScore,
        Suggestions:     suggestions,
    }
}

func (qs *QualityScorer) calculateHookScore(content string, platform string) int {
    // Get first 3 seconds worth of content (approx 10-15 words)
    words := strings.Fields(content)
    if len(words) < 5 {
        return 20 // Too short
    }

    hookWords := words[:min(15, len(words))]
    hookText := strings.Join(hookWords, " ")

    score := 50 // Base score

    // Check for question mark (engaging start)
    if strings.Contains(hookText, "?") {
        score += 15
    }

    // Check for power words
    powerWords := []string{"imagine", "discover", "secret", "you", "shocking", "amazing", "never", "must"}
    for _, pw := range powerWords {
        if strings.Contains(strings.ToLower(hookText), pw) {
            score += 5
            break
        }
    }

    // Platform-specific bonus
    if platform == "TikTok" && (strings.HasPrefix(hookText, "Did you") || strings.HasPrefix(hookText, "Have you")) {
        score += 10
    }

    // Check for numbers (specific facts are engaging)
    if regexp.MustCompile(`\d+`).MatchString(hookText) {
        score += 10
    }

    return min(100, score)
}

func (qs *QualityScorer) calculateEngagementScore(content string) int {
    score := 50

    // Check for questions throughout (increases engagement)
    questionCount := strings.Count(content, "?")
    score += min(20, questionCount*5)

    // Check for calls to action
    ctaKeywords := []string{"comment", "like", "subscribe", "share", "follow", "click"}
    for _, cta := range ctaKeywords {
        if strings.Contains(strings.ToLower(content), cta) {
            score += 10
            break
        }
    }

    // Check for emotional words
    emotionalWords := []string{"love", "hate", "amazing", "incredible", "shocking", "unbelievable"}
    for _, ew := range emotionalWords {
        if strings.Contains(strings.ToLower(content), ew) {
            score += 5
            break
        }
    }

    // Check for direct address ("you")
    youCount := strings.Count(strings.ToLower(content), "you")
    if youCount > 0 {
        score += min(15, youCount*3)
    }

    return min(100, score)
}

func (qs *QualityScorer) calculateSEOScore(content string) int {
    score := 50

    // Word count check (300-800 words is optimal for SEO)
    wordCount := len(strings.Fields(content))
    if wordCount >= 100 && wordCount <= 500 {
        score += 20
    } else if wordCount > 50 {
        score += 10
    }

    // Check for keyword density (not too many repeated words)
    words := strings.Fields(strings.ToLower(content))
    wordFreq := make(map[string]int)
    for _, word := range words {
        if len(word) > 4 { // Only count meaningful words
            wordFreq[word]++
        }
    }

    // Find most repeated word
    maxFreq := 0
    for _, freq := range wordFreq {
        if freq > maxFreq {
            maxFreq = freq
        }
    }

    // Keyword stuffing check (should not exceed 3% frequency)
    if wordCount > 0 {
        density := float64(maxFreq) / float64(wordCount)
        if density < 0.03 {
            score += 20
        } else if density < 0.05 {
            score += 10
        }
    }

    // Check for hashtag-friendly content
    if strings.Contains(content, "#") {
        score += 10
    }

    return min(100, score)
}

func (qs *QualityScorer) calculateReadabilityScore(content string) int {
    score := 50

    sentences := splitIntoSentences(content)
    words := strings.Fields(content)

    if len(sentences) == 0 || len(words) == 0 {
        return 20
    }

    // Average words per sentence (8-15 is optimal for videos)
    avgWordsPerSentence := float64(len(words)) / float64(len(sentences))

    if avgWordsPerSentence >= 8 && avgWordsPerSentence <= 15 {
        score += 25
    } else if avgWordsPerSentence >= 5 && avgWordsPerSentence <= 20 {
        score += 15
    } else {
        score += 5
    }

    // Check for simple language (fewer complex words)
    complexWords := 0
    for _, word := range words {
        if len(word) > 10 {
            complexWords++
        }
    }

    complexityRatio := float64(complexWords) / float64(len(words))
    if complexityRatio < 0.1 {
        score += 25
    } else if complexityRatio < 0.2 {
        score += 15
    }

    return min(100, score)
}

func (qs *QualityScorer) generateSuggestions(hook, engagement, seo, readability int) []string {
    suggestions := []string{}

    if hook < 60 {
        suggestions = append(suggestions, "Start with a stronger hook - try a question, surprising fact, or bold statement")
    }

    if engagement < 60 {
        suggestions = append(suggestions, "Add more direct address ('you', 'your') to increase engagement")
        suggestions = append(suggestions, "Include a clear call-to-action (comment, like, subscribe)")
    }

    if seo < 60 {
        suggestions = append(suggestions, "Optimize keyword usage - ensure key topics appear naturally 2-3 times")
    }

    if readability < 60 {
        suggestions = append(suggestions, "Simplify language - shorter sentences and simpler words work better for video")
    }

    return suggestions
}

func splitIntoSentences(text string) []string {
    // Simple sentence splitting
    text = strings.ReplaceAll(text, ". ", ".|")
    text = strings.ReplaceAll(text, "! ", "!|")
    text = strings.ReplaceAll(text, "? ", "?|")
    return strings.Split(text, "|")
}

func min(a, b int) int {
    if a < b {
        return a
    }
    return b
}
```

**Integration**:
Update `script_handler.go` to use quality scorer:
```go
// In GenerateScript handler, after script generation:
scorer := services.NewQualityScorer()
qualityScores := scorer.AnalyzeScript(script.Content, scriptReq.Platform)

// Add to script record
scriptRecord.QualityScores = qualityScores
```

**Testing**:
```go
// quality_scorer_test.go
func TestQualityScorer_CalculateHookScore(t *testing.T) {
    scorer := NewQualityScorer()

    tests := []struct {
        name     string
        content  string
        platform string
        minScore int
    }{
        {
            name:     "Strong TikTok Hook",
            content:  "Did you know that 90% of people don't know this secret?",
            platform: "TikTok",
            minScore: 70,
        },
        {
            name:     "Weak Hook",
            content:  "Hello everyone",
            platform: "YouTube",
            minScore: 20,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            score := scorer.calculateHookScore(tt.content, tt.platform)
            if score < tt.minScore {
                t.Errorf("Expected score >= %d, got %d", tt.minScore, score)
            }
        })
    }
}
```

---

#### Task 1.3: Template Management System (8 hours)

**Status**: ⏳ Pending
**Priority**: Medium
**Files to Create**:
- `/services/content-service/internal/repository/template_repository.go`
- `/services/content-service/internal/services/template_service.go`
- `/services/content-service/internal/handlers/template_handler.go`

**Database Seed Data**:
Create `/scripts/seed-templates.sql`:
```sql
-- Insert initial templates
INSERT INTO templates (id, name, description, category, platform, content, variables, is_premium, usage_count) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'TikTok Viral Hook', 'Attention-grabbing opening for viral TikTok videos', 'social_media', 'TikTok',
 'Did you know {{topic}}? Here''s what most people don''t realize... [Continue with engaging facts] Don''t forget to {{cta}}!',
 ARRAY['topic', 'cta'], false, 0),

('550e8400-e29b-41d4-a716-446655440002', 'YouTube Tutorial', 'Step-by-step educational format', 'education', 'YouTube',
 'In this video, I''ll show you {{topic}}. By the end, you''ll know how to {{outcome}}. Let''s get started!',
 ARRAY['topic', 'outcome'], false, 0),

('550e8400-e29b-41d4-a716-446655440003', 'Instagram Product Showcase', 'Product highlight for Instagram Reels', 'marketing', 'Instagram',
 'Check out {{product_name}}! Here''s why you need this: [Feature 1], [Feature 2], [Feature 3]. Link in bio!',
 ARRAY['product_name'], false, 0);
```

**Template Service** (`template_service.go`):
```go
package services

import (
    "context"
    "strings"
    "github.com/google/uuid"
    "github.com/scriptsensei/content-service/internal/models"
    "github.com/scriptsensei/content-service/internal/repository"
)

type TemplateService struct {
    templateRepo *repository.TemplateRepository
}

func NewTemplateService(repo *repository.TemplateRepository) *TemplateService {
    return &TemplateService{templateRepo: repo}
}

// ApplyTemplate fills in template variables with provided values
func (ts *TemplateService) ApplyTemplate(ctx context.Context, templateID uuid.UUID, variables map[string]string) (string, error) {
    template, err := ts.templateRepo.GetByID(ctx, templateID)
    if err != nil {
        return "", err
    }

    content := template.Content

    // Replace all variables
    for key, value := range variables {
        placeholder := "{{" + key + "}}"
        content = strings.ReplaceAll(content, placeholder, value)
    }

    // Increment usage count
    _ = ts.templateRepo.IncrementUsage(ctx, templateID)

    return content, nil
}

// ListTemplates returns templates filtered by category and platform
func (ts *TemplateService) ListTemplates(ctx context.Context, category string, platform string, isPremium *bool) ([]*models.Template, error) {
    return ts.templateRepo.List(ctx, category, platform, isPremium)
}
```

---

### Week 2: Video Processing Service

#### Task 2.1: FFmpeg Integration (12 hours)

**Status**: ⏳ Pending
**Priority**: Critical
**Files to Create**:
- `/services/video-processing-service/app/services/video_renderer.py`
- `/services/video-processing-service/app/services/ffmpeg_wrapper.py`
- `/services/video-processing-service/app/services/scene_compositor.py`

**Prerequisites**:
```bash
# Install FFmpeg
brew install ffmpeg  # macOS
# OR
sudo apt-get install ffmpeg  # Linux

# Python dependencies
cd services/video-processing-service
pip install ffmpeg-python pillow
```

**FFmpeg Wrapper** (`ffmpeg_wrapper.py`):
```python
import ffmpeg
import os
from typing import List, Tuple, Optional
from pathlib import Path

class FFmpegWrapper:
    """Wrapper for FFmpeg operations"""

    @staticmethod
    def create_video_from_images(
        image_paths: List[str],
        durations: List[float],
        audio_path: Optional[str],
        output_path: str,
        resolution: Tuple[int, int] = (1080, 1920),  # 9:16 vertical
        fps: int = 30
    ) -> bool:
        """
        Create video from images with specified durations

        Args:
            image_paths: List of image file paths
            durations: Duration for each image in seconds
            audio_path: Path to audio file (optional)
            output_path: Output video path
            resolution: (width, height) tuple
            fps: Frames per second

        Returns:
            True if successful
        """
        try:
            # Create temp directory for processed images
            temp_dir = Path("/tmp/video_frames")
            temp_dir.mkdir(exist_ok=True)

            # Process each image
            frame_num = 0
            for img_path, duration in zip(image_paths, durations):
                # Resize and pad image to fit resolution
                (
                    ffmpeg
                    .input(img_path)
                    .filter('scale', resolution[0], resolution[1], force_original_aspect_ratio='decrease')
                    .filter('pad', resolution[0], resolution[1], '(ow-iw)/2', '(oh-ih)/2')
                    .output(str(temp_dir / f"frame_{frame_num:04d}.png"))
                    .overwrite_output()
                    .run(capture_stdout=True, capture_stderr=True)
                )

                # Duplicate frames for duration
                num_frames = int(duration * fps)
                for _ in range(num_frames):
                    frame_num += 1

            # Create video from frames
            input_pattern = str(temp_dir / "frame_%04d.png")

            video = ffmpeg.input(input_pattern, framerate=fps)

            # Add audio if provided
            if audio_path and os.path.exists(audio_path):
                audio = ffmpeg.input(audio_path)
                output = ffmpeg.output(
                    video, audio, output_path,
                    vcodec='libx264',
                    acodec='aac',
                    strict='experimental',
                    shortest=None  # Match video duration
                )
            else:
                output = ffmpeg.output(
                    video, output_path,
                    vcodec='libx264'
                )

            output.overwrite_output().run(capture_stdout=True, capture_stderr=True)

            # Cleanup temp files
            for f in temp_dir.glob("frame_*.png"):
                f.unlink()

            return True

        except ffmpeg.Error as e:
            print(f"FFmpeg error: {e.stderr.decode()}")
            return False
        except Exception as e:
            print(f"Error creating video: {str(e)}")
            return False

    @staticmethod
    def add_text_overlay(
        input_video: str,
        output_video: str,
        text: str,
        position: str = "center",
        font_size: int = 48,
        font_color: str = "white",
        start_time: float = 0,
        duration: Optional[float] = None
    ) -> bool:
        """Add text overlay to video"""
        try:
            # Build drawtext filter
            drawtext = f"text='{text}':fontsize={font_size}:fontcolor={font_color}"

            if position == "center":
                drawtext += ":x=(w-text_w)/2:y=(h-text_h)/2"
            elif position == "top":
                drawtext += ":x=(w-text_w)/2:y=50"
            elif position == "bottom":
                drawtext += ":x=(w-text_w)/2:y=h-text_h-50"

            # Add timing
            drawtext += f":enable='between(t,{start_time},"
            if duration:
                drawtext += f"{start_time + duration})'"
            else:
                drawtext += "100)'"  # Show till end

            (
                ffmpeg
                .input(input_video)
                .filter('drawtext', text=text, fontsize=font_size, fontcolor=font_color)
                .output(output_video)
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )

            return True

        except ffmpeg.Error as e:
            print(f"FFmpeg error: {e.stderr.decode()}")
            return False

    @staticmethod
    def convert_aspect_ratio(
        input_video: str,
        output_video: str,
        aspect_ratio: str = "9:16"  # TikTok/Instagram vertical
    ) -> bool:
        """Convert video to different aspect ratio"""
        try:
            if aspect_ratio == "9:16":
                width, height = 1080, 1920
            elif aspect_ratio == "16:9":
                width, height = 1920, 1080
            elif aspect_ratio == "1:1":
                width, height = 1080, 1080
            elif aspect_ratio == "4:5":
                width, height = 1080, 1350
            else:
                raise ValueError(f"Unsupported aspect ratio: {aspect_ratio}")

            (
                ffmpeg
                .input(input_video)
                .filter('scale', width, height, force_original_aspect_ratio='decrease')
                .filter('pad', width, height, '(ow-iw)/2', '(oh-ih)/2')
                .output(output_video)
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )

            return True

        except ffmpeg.Error as e:
            print(f"FFmpeg error: {e.stderr.decode()}")
            return False
```

**Video Renderer** (`video_renderer.py`):
```python
from typing import List, Dict, Optional
import asyncio
from pathlib import Path
import uuid
from .ffmpeg_wrapper import FFmpegWrapper
from .scene_compositor import SceneCompositor
from ..models.video import Scene, VideoGenerationRequest

class VideoRenderer:
    """Main video rendering engine"""

    def __init__(self, output_dir: str = "/tmp/videos"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.ffmpeg = FFmpegWrapper()
        self.compositor = SceneCompositor()

    async def render_video(
        self,
        request: VideoGenerationRequest,
        scenes: List[Scene],
        progress_callback: Optional[callable] = None
    ) -> str:
        """
        Render complete video from scenes

        Args:
            request: Video generation request
            scenes: List of scenes with media and text
            progress_callback: Function to call with progress updates

        Returns:
            Path to rendered video file
        """
        video_id = str(uuid.uuid4())
        output_path = str(self.output_dir / f"{video_id}.mp4")

        try:
            # Step 1: Prepare scenes (10%)
            if progress_callback:
                await progress_callback(10, "Preparing scenes...")

            image_paths = []
            durations = []

            for i, scene in enumerate(scenes):
                # Download or generate media for scene
                media_path = await self.compositor.get_scene_media(scene)
                image_paths.append(media_path)
                durations.append(scene.duration)

                if progress_callback:
                    progress = 10 + (i + 1) / len(scenes) * 30
                    await progress_callback(int(progress), f"Processing scene {i+1}/{len(scenes)}")

            # Step 2: Generate audio/voice (40%)
            if progress_callback:
                await progress_callback(40, "Generating voiceover...")

            audio_path = await self.generate_audio(request, scenes)

            # Step 3: Composite video (60%)
            if progress_callback:
                await progress_callback(60, "Compositing video...")

            # Get resolution based on aspect ratio
            resolution = self.get_resolution(request.aspect_ratio)

            success = self.ffmpeg.create_video_from_images(
                image_paths=image_paths,
                durations=durations,
                audio_path=audio_path,
                output_path=output_path,
                resolution=resolution,
                fps=30
            )

            if not success:
                raise Exception("FFmpeg video creation failed")

            # Step 4: Add text overlays (80%)
            if progress_callback:
                await progress_callback(80, "Adding text overlays...")

            output_with_text = str(self.output_dir / f"{video_id}_text.mp4")
            await self.add_text_overlays(output_path, output_with_text, scenes)

            # Step 5: Final optimization (90%)
            if progress_callback:
                await progress_callback(90, "Optimizing video...")

            final_output = await self.optimize_for_platform(
                output_with_text,
                request.platform
            )

            # Step 6: Complete (100%)
            if progress_callback:
                await progress_callback(100, "Video generation complete!")

            return final_output

        except Exception as e:
            print(f"Error rendering video: {str(e)}")
            raise

    async def generate_audio(self, request: VideoGenerationRequest, scenes: List[Scene]) -> str:
        """Generate audio/voiceover for video"""
        # TODO: Integration with Voice Service
        # For now, return None (silent video)
        return None

    async def add_text_overlays(self, input_path: str, output_path: str, scenes: List[Scene]) -> None:
        """Add text overlays for each scene"""
        current_time = 0
        temp_path = input_path

        for i, scene in enumerate(scenes):
            if scene.text:
                next_path = output_path if i == len(scenes) - 1 else f"{output_path}_temp_{i}.mp4"

                self.ffmpeg.add_text_overlay(
                    input_video=temp_path,
                    output_video=next_path,
                    text=scene.text,
                    position="bottom",
                    start_time=current_time,
                    duration=scene.duration
                )

                temp_path = next_path

            current_time += scene.duration

    async def optimize_for_platform(self, input_path: str, platform: str) -> str:
        """Platform-specific optimizations"""
        output_path = input_path.replace(".mp4", f"_{platform.lower()}.mp4")

        # Platform-specific aspect ratios
        aspect_ratios = {
            "tiktok": "9:16",
            "instagram": "9:16",
            "youtube": "16:9",
            "facebook": "1:1",
        }

        aspect_ratio = aspect_ratios.get(platform.lower(), "16:9")

        self.ffmpeg.convert_aspect_ratio(input_path, output_path, aspect_ratio)

        return output_path

    @staticmethod
    def get_resolution(aspect_ratio: str) -> tuple:
        """Get resolution tuple from aspect ratio string"""
        ratios = {
            "9:16": (1080, 1920),
            "16:9": (1920, 1080),
            "1:1": (1080, 1080),
            "4:5": (1080, 1350),
        }
        return ratios.get(aspect_ratio, (1920, 1080))
```

**Testing**:
```python
# test_video_renderer.py
import pytest
from app.services.video_renderer import VideoRenderer
from app.models.video import Scene, VideoGenerationRequest

@pytest.mark.asyncio
async def test_video_rendering():
    renderer = VideoRenderer()

    request = VideoGenerationRequest(
        script_id="test-123",
        title="Test Video",
        platform="youtube",
        aspect_ratio="16:9"
    )

    scenes = [
        Scene(
            scene_number=1,
            text="Test scene 1",
            duration=3.0,
            media_url="https://via.placeholder.com/1920x1080"
        ),
        Scene(
            scene_number=2,
            text="Test scene 2",
            duration=3.0,
            media_url="https://via.placeholder.com/1920x1080"
        ),
    ]

    output_path = await renderer.render_video(request, scenes)

    assert output_path is not None
    assert Path(output_path).exists()
```

---

#### Task 2.2: Scene Generation from Script (8 hours)

**Status**: ⏳ Pending
**Priority**: High
**Files to Create**:
- `/services/video-processing-service/app/services/script_parser.py`
- `/services/video-processing-service/app/services/scene_generator.py`

**Script Parser** (`script_parser.py`):
```python
import re
from typing import List
from ..models.video import Scene

class ScriptParser:
    """Parse script content into scenes"""

    @staticmethod
    def parse_script_to_scenes(
        script_content: str,
        target_duration: int = 60
    ) -> List[Scene]:
        """
        Break script into scenes (5-10 seconds each)

        Args:
            script_content: Full script text
            target_duration: Total video duration in seconds

        Returns:
            List of Scene objects
        """
        # Split by sentences or paragraphs
        sentences = ScriptParser._split_into_sentences(script_content)

        # Calculate words per minute (assume 150 WPM speaking rate)
        words_per_second = 150 / 60  # ~2.5 words/second

        scenes = []
        current_text = []
        current_duration = 0
        scene_num = 1

        for sentence in sentences:
            word_count = len(sentence.split())
            sentence_duration = word_count / words_per_second

            # If adding this sentence exceeds 10 seconds, create new scene
            if current_duration + sentence_duration > 10 and current_text:
                scenes.append(Scene(
                    scene_number=scene_num,
                    text=" ".join(current_text),
                    duration=round(current_duration, 1),
                    start_time=sum(s.duration for s in scenes),
                    end_time=sum(s.duration for s in scenes) + current_duration
                ))

                scene_num += 1
                current_text = [sentence]
                current_duration = sentence_duration
            else:
                current_text.append(sentence)
                current_duration += sentence_duration

        # Add remaining text as final scene
        if current_text:
            scenes.append(Scene(
                scene_number=scene_num,
                text=" ".join(current_text),
                duration=round(current_duration, 1),
                start_time=sum(s.duration for s in scenes),
                end_time=sum(s.duration for s in scenes) + current_duration
            ))

        return scenes

    @staticmethod
    def _split_into_sentences(text: str) -> List[str]:
        """Split text into sentences"""
        # Simple sentence splitting
        text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
```

---

### Week 3: Voice Service

#### Task 3.1: Azure TTS Integration (10 hours)

**Status**: ⏳ Pending
**Priority**: Critical
**Files to Create**:
- `/services/voice-service/internal/providers/azure_tts.go`
- `/services/voice-service/internal/services/voice_service.go`
- `/services/voice-service/internal/handlers/voice_handler.go`

**Azure TTS Provider** (`azure_tts.go`):
```go
package providers

import (
    "bytes"
    "context"
    "encoding/xml"
    "fmt"
    "io"
    "net/http"
    "time"
)

type AzureTTSProvider struct {
    apiKey  string
    region  string
    client  *http.Client
}

type SSMLRequest struct {
    XMLName xml.Name `xml:"speak"`
    Version string   `xml:"version,attr"`
    Lang    string   `xml:"xml:lang,attr"`
    Voice   Voice    `xml:"voice"`
}

type Voice struct {
    Name string `xml:"name,attr"`
    Text string `xml:",chardata"`
}

func NewAzureTTSProvider(apiKey, region string) *AzureTTSProvider {
    return &AzureTTSProvider{
        apiKey: apiKey,
        region: region,
        client: &http.Client{
            Timeout: 30 * time.Second,
        },
    }
}

func (p *AzureTTSProvider) SynthesizeSpeech(ctx context.Context, text string, voiceID string, language string) ([]byte, error) {
    // Build SSML
    ssml := SSMLRequest{
        Version: "1.0",
        Lang:    language,
        Voice: Voice{
            Name: voiceID,
            Text: text,
        },
    }

    ssmlBytes, err := xml.Marshal(ssml)
    if err != nil {
        return nil, fmt.Errorf("failed to marshal SSML: %w", err)
    }

    // Create request
    url := fmt.Sprintf("https://%s.tts.speech.microsoft.com/cognitiveservices/v1", p.region)
    req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(ssmlBytes))
    if err != nil {
        return nil, fmt.Errorf("failed to create request: %w", err)
    }

    // Set headers
    req.Header.Set("Ocp-Apim-Subscription-Key", p.apiKey)
    req.Header.Set("Content-Type", "application/ssml+xml")
    req.Header.Set("X-Microsoft-OutputFormat", "audio-16khz-128kbitrate-mono-mp3")

    // Send request
    resp, err := p.client.Do(req)
    if err != nil {
        return nil, fmt.Errorf("Azure TTS request failed: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("Azure TTS failed with status %d: %s", resp.StatusCode, string(body))
    }

    // Read audio data
    audioData, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, fmt.Errorf("failed to read audio data: %w", err)
    }

    return audioData, nil
}

// List of available Azure voices
var AzureVoices = []VoiceInfo{
    {ID: "en-US-JennyNeural", Name: "Jenny", Language: "en-US", Gender: "Female"},
    {ID: "en-US-GuyNeural", Name: "Guy", Language: "en-US", Gender: "Male"},
    {ID: "ja-JP-NanamiNeural", Name: "Nanami", Language: "ja-JP", Gender: "Female"},
    {ID: "hi-IN-SwaraNeural", Name: "Swara", Language: "hi-IN", Gender: "Female"},
    // Add more voices...
}

type VoiceInfo struct {
    ID       string
    Name     string
    Language string
    Gender   string
}
```

---

### Week 4: Additional Services

I'll create a separate focused plan for remaining services. For now, this roadmap gives you a comprehensive starting point.

---

## Phase 2: Frontend Integration (Weeks 5-6)

### Week 5: Next.js Pages

#### Task 5.1: Create Dashboard Page

**Status**: ⏳ Pending
**Files to Create**:
- `/frontend/app/dashboard/page.tsx`
- `/frontend/app/dashboard/layout.tsx`

**Implementation**:
```typescript
// app/dashboard/page.tsx
import { VideoLibrary } from '@/components/VideoLibrary'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard title="Videos" value="24" change="+12%" />
          <StatCard title="Views" value="12.5K" change="+23%" />
          <StatCard title="Engagement" value="8.2%" change="+1.5%" />
          <StatCard title="Watch Time" value="4.2h" change="+18%" />
        </div>

        {/* Recent videos */}
        <VideoLibrary />

        {/* Analytics */}
        <AnalyticsDashboard />
      </main>
    </div>
  )
}
```

---

## Phase 3: Testing & Quality (Week 7)

### TDD Implementation

Following the CLAUDE.md TDD policy:

1. **Write tests FIRST** (Red phase)
2. **Implement code** (Green phase)
3. **Refactor** (Refactor phase)

**Test Coverage Requirements**:
- Backend: >80%
- Frontend: >70%
- All critical paths covered

---

## Phase 4: Polish & Launch (Week 8)

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] API keys obtained and configured
- [ ] Kong Gateway set up
- [ ] Docker containers tested
- [ ] Performance optimization
- [ ] Security audit
- [ ] User acceptance testing

---

## Critical Dependencies

### Required API Keys

| Service | Priority | Cost | Status |
|---------|----------|------|--------|
| DeepSeek V3 | Critical | Pay-as-you-go | ⏳ Need key |
| Azure Speech | Critical | $16/1M chars | ⏳ Need key |
| Clerk Auth | Critical | Free tier | ⏳ Need key |
| Pexels API | High | FREE | ⏳ Need key |
| Gemini 2.0 Flash | Medium | $0.10/$0.40 per M | ⏳ Have key |

---

## Quick Start Guide

### 1. Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Add API keys to .env
nano .env
```

### 2. Start Infrastructure

```bash
# Start all services
make docker-up

# Run database migrations
make migrate-db

# Seed templates
psql -U scriptsensei -d scriptsensei -f scripts/seed-templates.sql
```

### 3. Start Development

```bash
# Terminal 1: Content Service
make start-content-service

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Video Processing
cd services/video-processing-service
source venv/bin/activate
python -m uvicorn app.main:app --reload
```

### 4. Test

```bash
# Test Content Service
curl http://localhost:8011/api/v1/health

# Test Frontend
open http://localhost:3000

# Generate test script
curl -X POST http://localhost:8011/api/v1/scripts/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"AI in Healthcare","platform":"YouTube","duration":60,"language":"en"}'
```

---

## Summary

**Current Status**: 40% Complete

**Next Immediate Tasks**:
1. Add Claude/GPT providers to Content Service (8h)
2. Implement quality scoring (6h)
3. Start FFmpeg integration in Video Processing (12h)
4. Set up Azure TTS in Voice Service (10h)

**Estimated Time to MVP**: 6-8 weeks (assuming 20-30 hours/week)

**Blockers**:
- Need API keys (DeepSeek, Azure, Clerk)
- FFmpeg must be installed
- PostgreSQL must be running

---

**For detailed backend integration examples, see**: [frontend/BACKEND_INTEGRATION.md](frontend/BACKEND_INTEGRATION.md)

**For project overview, see**: [README.md](README.md)

**For architectural details, see**: [ScriptSensei_Technical_Implementation_Guide.md](ScriptSensei_Technical_Implementation_Guide.md)
