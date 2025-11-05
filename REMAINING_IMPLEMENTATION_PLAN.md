# ScriptSensei - Remaining Implementation Plan

**Date**: 2025-11-05
**Current Completion**: ~45% Complete
**Status**: MVP Phase 1 In Progress

---

## 📊 Project Status Overview

### ✅ What's Complete (45%)

#### Infrastructure & Setup
- ✅ Docker Compose with all services (PostgreSQL, Redis, RabbitMQ, MongoDB, Elasticsearch, MinIO, InfluxDB, Prometheus, Grafana)
- ✅ Database schema designed and migrations ready
- ✅ Makefile for service management
- ✅ Comprehensive documentation

#### Frontend (75% Complete)
- ✅ Next.js 14 with TypeScript
- ✅ 15+ React components
- ✅ API client infrastructure
- ✅ **Fliki-style interactive scene editor (80% complete)**
  - ✅ AudioPickerModal, AvatarPickerModal, TextEditorModal
  - ✅ Clickable layers with hover effects
  - ✅ Functional right sidebar tools
  - ⏳ Canvas manipulation (pending)
  - ⏳ Backend API integration (pending)

#### Backend Services
- ✅ **Content Service (Go)** - 60% Complete
  - ✅ LLM Orchestrator with DeepSeek V3 & Gemini Flash
  - ✅ Script models and handlers
  - ⏳ Missing: Claude/GPT providers, quality scoring, template system
- ✅ **Auth Service (Go)** - 40% Complete
  - ✅ Basic structure, Clerk JWT verification
  - ⏳ Missing: Complete auth middleware, user profile management
- ✅ **Video Processing Service (Python)** - 30% Complete
  - ✅ FastAPI structure, WebSocket setup
  - ⏳ Missing: FFmpeg integration, scene composition, rendering pipeline

---

## 🔴 Remaining Work (55%)

### Critical Path - Backend Services

#### 1. Content Service Completion (Week 1-2)
**Priority**: HIGH | **Time**: 22 hours

##### Task 1.1: Add Additional LLM Providers (8 hours)
**Files to Create**:
- `/services/content-service/internal/services/claude_provider.go`
- `/services/content-service/internal/services/openai_provider.go`
- `/services/content-service/internal/services/claude_provider_test.go`
- `/services/content-service/internal/services/openai_provider_test.go`

**Implementation Steps**:
1. **Claude Haiku Provider**:
   - Model: `claude-3-haiku-20240307`
   - Cost: $0.25/$1.25 per M tokens
   - API: Anthropic Messages API
   - Timeout: 60 seconds
   - Retry logic with exponential backoff

2. **OpenAI GPT-4o-mini Provider**:
   - Model: `gpt-4o-mini`
   - Cost: $0.15/$0.60 per M tokens
   - API: OpenAI Chat Completions
   - Streaming support
   - Function calling capability

3. **Update LLM Orchestrator**:
   - Add providers to fallback chain
   - Update provider selection logic
   - Add cost tracking per provider
   - Implement usage quotas

**Testing**:
```bash
cd services/content-service
go test ./internal/services -v -run TestClaudeProvider
go test ./internal/services -v -run TestOpenAIProvider
go test ./internal/services -v -run TestLLMOrchestrator
```

**Environment Variables Needed**:
```bash
CLAUDE_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

---

##### Task 1.2: Implement Script Quality Scoring (6 hours)
**Files to Create**:
- `/services/content-service/internal/services/quality_scorer.go`
- `/services/content-service/internal/services/quality_scorer_test.go`

**Quality Metrics to Implement**:
1. **Hook Score (0-100)**:
   - First 3 seconds analysis
   - Question detection
   - Power words check
   - Platform-specific optimization
   - Number/stat inclusion

2. **Engagement Score (0-100)**:
   - Question frequency
   - Call-to-action detection
   - Emotional word analysis
   - Direct address ("you") usage
   - Interactive elements

3. **SEO Score (0-100)**:
   - Word count optimization (100-500 words)
   - Keyword density check
   - Hashtag presence
   - Platform compliance

4. **Readability Score (0-100)**:
   - Average words per sentence (8-15 optimal)
   - Complex word ratio
   - Sentence variety
   - Mobile-friendly language

**Integration**:
- Add quality scoring to script generation handler
- Store scores in database
- Return scores in API response
- Generate improvement suggestions

**Testing**:
```go
func TestQualityScorer_CalculateHookScore(t *testing.T)
func TestQualityScorer_CalculateEngagementScore(t *testing.T)
func TestQualityScorer_CalculateSEOScore(t *testing.T)
func TestQualityScorer_CalculateReadabilityScore(t *testing.T)
func TestQualityScorer_AnalyzeScript(t *testing.T)
```

---

##### Task 1.3: Template Management System (8 hours)
**Files to Create**:
- `/services/content-service/internal/repository/template_repository.go`
- `/services/content-service/internal/services/template_service.go`
- `/services/content-service/internal/handlers/template_handler.go`
- `/services/content-service/internal/handlers/template_handler_test.go`
- `/scripts/seed-templates.sql`

**Template Features**:
1. **Variable Substitution**:
   - Support for `{{variable_name}}` placeholders
   - Conditional sections: `{{if condition}}...{{/if}}`
   - Loops: `{{for item in items}}...{{/for}}`

2. **Template Categories**:
   - Social Media (TikTok, Instagram, YouTube)
   - Education (Tutorial, Explainer)
   - Marketing (Product Demo, Ad)
   - Entertainment (Story, Comedy)

3. **Template Management**:
   - Create/Read/Update/Delete templates
   - Template versioning
   - Usage tracking
   - Popular template ranking

**Initial Templates to Seed** (10 templates):
```sql
-- TikTok Viral Hook
-- YouTube Tutorial
-- Instagram Product Showcase
-- Educational Explainer
-- Product Demo
-- How-To Guide
-- News Update
-- Recipe Video
-- Travel Vlog
-- Fitness Routine
```

**API Endpoints**:
```
GET    /api/v1/templates?category=social_media&platform=TikTok
GET    /api/v1/templates/{template_id}
POST   /api/v1/templates
PUT    /api/v1/templates/{template_id}
DELETE /api/v1/templates/{template_id}
POST   /api/v1/templates/{template_id}/apply
```

---

#### 2. Video Processing Service Completion (Week 2-3)
**Priority**: CRITICAL | **Time**: 32 hours

##### Task 2.1: FFmpeg Integration (12 hours)
**Files to Create**:
- `/services/video-processing-service/app/services/ffmpeg_wrapper.py`
- `/services/video-processing-service/app/services/video_renderer.py`
- `/services/video-processing-service/app/services/scene_compositor.py`
- `/services/video-processing-service/tests/test_ffmpeg_wrapper.py`
- `/services/video-processing-service/tests/test_video_renderer.py`

**Prerequisites**:
```bash
# Install FFmpeg
brew install ffmpeg  # macOS
# OR
sudo apt-get install ffmpeg  # Linux

# Python dependencies
pip install ffmpeg-python pillow
```

**FFmpeg Wrapper Features**:
1. **Video Creation from Images**:
   - Create video from image sequence
   - Support multiple durations per image
   - Add audio track
   - Resolution control (720p, 1080p, 4K)
   - Aspect ratio conversion (9:16, 16:9, 1:1, 4:5)

2. **Text Overlay**:
   - Dynamic text positioning
   - Font customization
   - Color and size control
   - Timing control (start/end)
   - Animation support

3. **Audio Mixing**:
   - Background music
   - Voiceover track
   - Volume control
   - Fade in/out
   - Audio ducking

**Video Renderer Pipeline**:
```
Input → Scene Assembly (10%) → Audio Generation (40%) →
Video Composition (60%) → Text Overlays (80%) →
Platform Optimization (90%) → Complete (100%)
```

**Platform Optimizations**:
- **TikTok**: 9:16, 15-60s, fast cuts every 2-3s
- **YouTube**: 16:9, intro hook, chapters, end screen
- **Instagram**: 9:16, 15-90s, cover frame selection
- **Facebook**: 1:1, auto-play friendly

**Testing**:
```python
@pytest.mark.asyncio
async def test_video_rendering():
    renderer = VideoRenderer()
    output = await renderer.render_video(request, scenes)
    assert Path(output).exists()
    assert get_video_duration(output) == expected_duration
```

---

##### Task 2.2: Scene Generation from Script (8 hours)
**Files to Create**:
- `/services/video-processing-service/app/services/script_parser.py`
- `/services/video-processing-service/app/services/scene_generator.py`
- `/services/video-processing-service/tests/test_script_parser.py`

**Script Parser Features**:
1. **Text Analysis**:
   - Split into 5-10 second scenes
   - Calculate speaking duration (150 WPM)
   - Identify key concepts per scene
   - Extract visual keywords

2. **Scene Structure**:
   ```python
   {
     "scene_number": 1,
     "text": "Scene narration",
     "duration": 5.2,
     "start_time": 0,
     "end_time": 5.2,
     "keywords": ["sunset", "beach"],
     "mood": "calm",
     "visual_type": "landscape"
   }
   ```

3. **Visual Matching**:
   - Query stock APIs (Pexels, Pixabay)
   - AI image generation fallback
   - Template-based backgrounds
   - Cache popular visuals

**Integration with Video Renderer**:
```python
scenes = script_parser.parse_script_to_scenes(script_content)
for scene in scenes:
    media = scene_generator.get_scene_media(scene)
    scene.media_url = media
output = video_renderer.render_video(request, scenes)
```

---

##### Task 2.3: Progress Tracking & WebSocket (6 hours)
**Files to Modify**:
- `/services/video-processing-service/app/main.py`
- `/services/video-processing-service/app/websocket.py`

**WebSocket Events**:
```python
# Server → Client
await websocket.send_json({
    "event": "video:progress",
    "data": {
        "video_id": "uuid",
        "progress": 45,
        "stage": "Compositing video...",
        "current_scene": 2,
        "total_scenes": 5
    }
})

# Completion event
await websocket.send_json({
    "event": "video:complete",
    "data": {
        "video_id": "uuid",
        "video_url": "https://cdn.../video.mp4",
        "duration": 60.5,
        "file_size": 15728640
    }
})

# Error event
await websocket.send_json({
    "event": "video:error",
    "data": {
        "video_id": "uuid",
        "error": "FFmpeg rendering failed",
        "details": "..."
    }
})
```

**Frontend Integration**:
```typescript
const ws = new WebSocket('ws://localhost:8012/ws/video/{videoId}')
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  if (data.event === 'video:progress') {
    updateProgressBar(data.data.progress)
  }
}
```

---

##### Task 2.4: Celery Task Queue Setup (6 hours)
**Files to Create**:
- `/services/video-processing-service/app/celery_app.py`
- `/services/video-processing-service/app/tasks/video_tasks.py`
- `/services/video-processing-service/app/tasks/scene_tasks.py`

**Celery Configuration**:
```python
# celery_app.py
from celery import Celery

celery_app = Celery(
    'video_processing',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

celery_app.conf.update(
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=10
)
```

**Video Generation Task**:
```python
@celery_app.task(bind=True, max_retries=3)
def generate_video_task(self, video_id: str, script_content: str, options: dict):
    try:
        # Parse script
        scenes = script_parser.parse_script_to_scenes(script_content)

        # Render video
        renderer = VideoRenderer()
        output = await renderer.render_video(
            options,
            scenes,
            progress_callback=lambda p, s: self.update_state(
                state='PROGRESS',
                meta={'progress': p, 'stage': s}
            )
        )

        return {'video_url': output, 'status': 'completed'}
    except Exception as e:
        self.retry(exc=e, countdown=60)
```

**Running Celery Worker**:
```bash
cd services/video-processing-service
celery -A app.celery_app worker --loglevel=info --concurrency=4
```

---

#### 3. Voice Service Implementation (Week 3-4)
**Priority**: CRITICAL | **Time**: 18 hours

##### Task 3.1: Azure TTS Integration (10 hours)
**Files to Create**:
- `/services/voice-service/internal/providers/azure_tts.go`
- `/services/voice-service/internal/services/voice_service.go`
- `/services/voice-service/internal/handlers/voice_handler.go`
- `/services/voice-service/internal/models/voice.go`
- `/services/voice-service/internal/providers/azure_tts_test.go`

**Azure TTS Provider Features**:
1. **Speech Synthesis**:
   - SSML generation
   - Multi-language support (20 languages for MVP)
   - Neural voice quality
   - Speed/pitch control
   - Output format: MP3 (16kHz, 128kbps)

2. **Voice Library** (20 Voices for MVP):
   - **English (US)**: Jenny, Guy, Aria, Davis
   - **Japanese**: Nanami, Keita
   - **Nepali**: (Custom if available, fallback to Hindi)
   - **Hindi**: Swara, Madhur
   - **Indonesian**: Ardi, Gadis
   - **Spanish**: Elvira, Alvaro
   - **French**: Denise, Henri
   - **German**: Katja, Conrad
   - **Portuguese**: Francisca, Antonio
   - **Chinese**: Xiaoxiao, Yunyang

3. **API Endpoints**:
   ```
   GET    /api/v1/voices?language=en-US&gender=female
   POST   /api/v1/voices/synthesize
   GET    /api/v1/voices/{voice_id}/sample
   POST   /api/v1/voices/clone (for future)
   ```

**Implementation**:
```go
type AzureTTSProvider struct {
    apiKey  string
    region  string
    client  *http.Client
}

func (p *AzureTTSProvider) SynthesizeSpeech(
    ctx context.Context,
    text string,
    voiceID string,
    language string,
    options *SynthesisOptions,
) ([]byte, error) {
    // Build SSML
    ssml := buildSSML(text, voiceID, language, options)

    // Call Azure API
    audioData, err := p.callAzureAPI(ctx, ssml)
    if err != nil {
        return nil, err
    }

    // Save to storage
    audioURL, err := p.storage.Upload(audioData, "audio/mpeg")

    return audioData, nil
}
```

**Testing**:
```go
func TestAzureTTSProvider_SynthesizeSpeech(t *testing.T) {
    provider := NewAzureTTSProvider(apiKey, region)

    audio, err := provider.SynthesizeSpeech(
        context.Background(),
        "Hello world",
        "en-US-JennyNeural",
        "en-US",
        &SynthesisOptions{Speed: 1.0, Pitch: 1.0},
    )

    assert.NoError(t, err)
    assert.NotEmpty(t, audio)
    assert.Greater(t, len(audio), 1000) // At least 1KB
}
```

**Environment Variables**:
```bash
AZURE_SPEECH_KEY=your-key
AZURE_SPEECH_REGION=eastus
```

---

##### Task 3.2: Voice Profile Management (4 hours)
**Files to Create**:
- `/services/voice-service/internal/repository/voice_repository.go`
- `/services/voice-service/internal/services/voice_profile_service.go`

**Voice Profile Features**:
1. **User Voice Preferences**:
   - Favorite voices
   - Recent voices
   - Custom voice clones (future)

2. **Voice Caching**:
   - Cache frequently used voice samples
   - Pre-generate common phrases
   - TTL: 24 hours

3. **Usage Tracking**:
   - Characters synthesized per user
   - Voice usage statistics
   - Cost tracking

---

##### Task 3.3: Multi-Provider Support (4 hours)
**Files to Create**:
- `/services/voice-service/internal/providers/elevenlabs.go`
- `/services/voice-service/internal/providers/google_tts.go`
- `/services/voice-service/internal/services/voice_orchestrator.go`

**Provider Fallback Logic**:
```go
type VoiceOrchestrator struct {
    providers []VoiceProvider
}

func (o *VoiceOrchestrator) Synthesize(ctx context.Context, req *SynthesisRequest) ([]byte, error) {
    for i, provider := range o.providers {
        audio, err := provider.SynthesizeSpeech(ctx, req)
        if err == nil {
            return audio, nil
        }

        log.Warnf("Provider %s failed: %v", provider.Name(), err)

        if i < len(o.providers)-1 {
            log.Infof("Falling back to provider %s", o.providers[i+1].Name())
        }
    }

    return nil, errors.New("all voice providers failed")
}
```

**Provider Priority**:
1. **Primary**: Azure TTS (best quality, cost-effective)
2. **Secondary**: Google Cloud TTS (backup)
3. **Tertiary**: ElevenLabs (premium voices)

---

#### 4. Translation Service Implementation (Week 4)
**Priority**: HIGH | **Time**: 12 hours

##### Task 4.1: Google Translate Integration (6 hours)
**Files to Create**:
- `/services/translation-service/src/providers/google-translate.js`
- `/services/translation-service/src/services/translation-service.js`
- `/services/translation-service/src/routes/translation-routes.js`
- `/services/translation-service/tests/translation.test.js`

**Translation Features**:
1. **Language Support** (5 languages for MVP):
   - English (en)
   - Japanese (ja)
   - Nepali (ne)
   - Hindi (hi)
   - Indonesian (id)

2. **Translation Functions**:
   - Text translation
   - Language detection
   - Batch translation
   - Translation caching

3. **API Endpoints**:
   ```
   POST   /api/v1/translate
   POST   /api/v1/translate/batch
   GET    /api/v1/languages
   POST   /api/v1/detect-language
   ```

**Implementation**:
```javascript
const { Translate } = require('@google-cloud/translate').v2;

class GoogleTranslateProvider {
  constructor(apiKey) {
    this.translate = new Translate({ key: apiKey });
  }

  async translateText(text, sourceLang, targetLang) {
    // Check cache first
    const cached = await this.getCachedTranslation(text, targetLang);
    if (cached) return cached;

    // Translate
    const [translation] = await this.translate.translate(text, {
      from: sourceLang,
      to: targetLang
    });

    // Cache result
    await this.cacheTranslation(text, targetLang, translation);

    return translation;
  }

  async detectLanguage(text) {
    const [detection] = await this.translate.detect(text);
    return {
      language: detection.language,
      confidence: detection.confidence
    };
  }
}
```

**Testing**:
```javascript
describe('TranslationService', () => {
  it('should translate text successfully', async () => {
    const result = await translationService.translate('Hello', 'en', 'ja');
    expect(result).toBe('こんにちは');
  });

  it('should detect language', async () => {
    const result = await translationService.detectLanguage('Namaste');
    expect(result.language).toBe('ne');
  });

  it('should cache translations', async () => {
    await translationService.translate('Hello', 'en', 'ja');
    const spy = jest.spyOn(translationService, 'fetchFromAPI');
    await translationService.translate('Hello', 'en', 'ja');
    expect(spy).not.toHaveBeenCalled();
  });
});
```

**Environment Variables**:
```bash
GOOGLE_TRANSLATE_API_KEY=your-key
REDIS_URL=redis://localhost:6379
```

---

##### Task 4.2: Translation Caching Strategy (3 hours)
**Files to Create**:
- `/services/translation-service/src/cache/translation-cache.js`

**Caching Strategy**:
```javascript
class TranslationCache {
  constructor(redisClient) {
    this.redis = redisClient;
    this.ttl = 7 * 24 * 60 * 60; // 7 days
  }

  getCacheKey(text, targetLang) {
    const hash = crypto.createHash('md5').update(text).digest('hex');
    return `translation:${targetLang}:${hash}`;
  }

  async get(text, targetLang) {
    const key = this.getCacheKey(text, targetLang);
    return await this.redis.get(key);
  }

  async set(text, targetLang, translation) {
    const key = this.getCacheKey(text, targetLang);
    await this.redis.setex(key, this.ttl, translation);
  }
}
```

**Cache Hit Rate Target**: >70%

---

##### Task 4.3: Batch Translation Optimization (3 hours)
**Implementation**:
```javascript
async batchTranslate(texts, sourceLang, targetLang) {
  // Split into uncached and cached
  const uncached = [];
  const results = new Map();

  for (const text of texts) {
    const cached = await this.getCachedTranslation(text, targetLang);
    if (cached) {
      results.set(text, cached);
    } else {
      uncached.push(text);
    }
  }

  // Batch translate uncached
  if (uncached.length > 0) {
    const translations = await this.translate.translate(uncached, {
      from: sourceLang,
      to: targetLang
    });

    for (let i = 0; i < uncached.length; i++) {
      results.set(uncached[i], translations[0][i]);
      await this.cacheTranslation(uncached[i], targetLang, translations[0][i]);
    }
  }

  return Array.from(results.values());
}
```

---

#### 5. Analytics Service Implementation (Week 5)
**Priority**: MEDIUM | **Time**: 16 hours

##### Task 5.1: Analytics Data Collection (8 hours)
**Files to Create**:
- `/services/analytics-service/internal/collectors/event_collector.go`
- `/services/analytics-service/internal/services/analytics_service.go`
- `/services/analytics-service/internal/handlers/analytics_handler.go`
- `/services/analytics-service/internal/models/analytics.go`

**Events to Track**:
1. **User Events**:
   - User signup
   - User login
   - Subscription changes
   - Feature usage

2. **Video Events**:
   - Video created
   - Video completed
   - Video downloaded
   - Video shared

3. **Content Events**:
   - Script generated
   - Template used
   - Voice selected
   - Media added

**Event Schema**:
```go
type Event struct {
    ID         string                 `json:"id"`
    UserID     string                 `json:"user_id"`
    EventType  string                 `json:"event_type"`
    Timestamp  time.Time              `json:"timestamp"`
    Properties map[string]interface{} `json:"properties"`
    SessionID  string                 `json:"session_id"`
}
```

**API Endpoints**:
```
POST   /api/v1/analytics/events
GET    /api/v1/analytics/users/{user_id}/stats
GET    /api/v1/analytics/videos/{video_id}/stats
GET    /api/v1/analytics/dashboard
```

---

##### Task 5.2: InfluxDB Integration (4 hours)
**Files to Create**:
- `/services/analytics-service/internal/storage/influxdb_client.go`

**Metrics Storage**:
```go
type InfluxDBClient struct {
    client   influxdb2.Client
    writeAPI api.WriteAPIBlocking
}

func (c *InfluxDBClient) WriteEvent(event *Event) error {
    p := influxdb2.NewPoint(
        event.EventType,
        map[string]string{
            "user_id": event.UserID,
        },
        map[string]interface{}{
            "count": 1,
        },
        event.Timestamp,
    )

    return c.writeAPI.WritePoint(context.Background(), p)
}

func (c *InfluxDBClient) QueryUserStats(userID string, timeRange string) (*UserStats, error) {
    query := fmt.Sprintf(`
        from(bucket: "analytics")
        |> range(start: %s)
        |> filter(fn: (r) => r["user_id"] == "%s")
        |> group(columns: ["_measurement"])
        |> count()
    `, timeRange, userID)

    result, err := c.client.QueryAPI(org).Query(context.Background(), query)
    // Parse and return stats
}
```

---

##### Task 5.3: Analytics Dashboard API (4 hours)
**Dashboard Metrics**:
```go
type DashboardStats struct {
    TotalUsers       int64                  `json:"total_users"`
    ActiveUsers      int64                  `json:"active_users"`
    VideosCreated    int64                  `json:"videos_created"`
    TotalViews       int64                  `json:"total_views"`
    AvgVideoLength   float64                `json:"avg_video_length"`
    PopularPlatforms []PlatformStats        `json:"popular_platforms"`
    RevenueMetrics   *RevenueMetrics        `json:"revenue_metrics"`
    UserGrowth       []TimeSeriesPoint      `json:"user_growth"`
}
```

---

#### 6. Trend Service Implementation (Week 5-6)
**Priority**: MEDIUM | **Time**: 20 hours

##### Task 6.1: Trend Data Collection (8 hours)
**Files to Create**:
- `/services/trend-service/app/collectors/tiktok_collector.py`
- `/services/trend-service/app/collectors/youtube_collector.py`
- `/services/trend-service/app/collectors/google_trends_collector.py`

**Data Sources**:
1. **TikTok Creative Center API**:
   - Trending hashtags
   - Trending sounds
   - Top videos

2. **YouTube Trends API**:
   - Trending videos by region
   - Search trends
   - Category trends

3. **Google Trends**:
   - Search volume
   - Regional interest
   - Related queries

**Collection Schedule**:
```python
@celery.task
def collect_tiktok_trends():
    collector = TikTokCollector()
    trends = collector.fetch_trending_hashtags()
    for trend in trends:
        save_trend(trend)

# Schedule: Every hour
celery.conf.beat_schedule = {
    'collect-tiktok-trends': {
        'task': 'app.tasks.collect_tiktok_trends',
        'schedule': crontab(minute=0),  # Every hour
    },
}
```

---

##### Task 6.2: Trend Analysis Engine (8 hours)
**Files to Create**:
- `/services/trend-service/app/analyzers/trend_analyzer.py`
- `/services/trend-service/app/ml/trend_predictor.py`

**Trend Scoring Algorithm**:
```python
def calculate_trend_score(trend_data):
    """
    Trend Score = (Growth Rate × 0.3) +
                  (Volume × 0.25) +
                  (Engagement × 0.25) +
                  (Recency × 0.2)
    """
    growth_rate = calculate_growth_rate(trend_data)
    volume = normalize_volume(trend_data['volume'])
    engagement = calculate_engagement_rate(trend_data)
    recency = calculate_recency_score(trend_data['timestamp'])

    score = (growth_rate * 0.3 +
             volume * 0.25 +
             engagement * 0.25 +
             recency * 0.2)

    return min(100, max(0, score))
```

---

##### Task 6.3: Trend API & Dashboard (4 hours)
**API Endpoints**:
```
GET    /api/v1/trends/current?platform=tiktok&region=us
GET    /api/v1/trends/platform/{platform}
GET    /api/v1/trends/region/{region}
GET    /api/v1/trends/predict
GET    /api/v1/trends/hashtags?category=entertainment
```

---

#### 7. Kong API Gateway Setup (Week 6)
**Priority**: HIGH | **Time**: 8 hours

##### Task 7.1: Kong Configuration (4 hours)
**Files to Create**:
- `/infrastructure/kong/kong.yml`
- `/scripts/configure-kong.sh`

**Kong Configuration**:
```yaml
services:
  - name: content-service
    url: http://content-service:8011
    routes:
      - name: content-route
        paths:
          - /api/v1/scripts
          - /api/v1/templates
        methods:
          - GET
          - POST
          - PUT
          - DELETE
    plugins:
      - name: jwt
        config:
          uri_param_names:
            - jwt
      - name: rate-limiting
        config:
          minute: 100

  - name: video-service
    url: http://video-service:8012
    routes:
      - name: video-route
        paths:
          - /api/v1/videos
        methods:
          - GET
          - POST
          - PUT
          - DELETE
```

**JWT Verification Plugin**:
```yaml
plugins:
  - name: jwt
    config:
      uri_param_names:
        - jwt
      cookie_names:
        - jwt
      key_claim_name: kid
      secret_is_base64: false
      claims_to_verify:
        - exp
```

---

##### Task 7.2: Service Registration (4 hours)
**Script**:
```bash
#!/bin/bash
# configure-kong.sh

# Add Content Service
curl -i -X POST http://localhost:8001/services \
  --data name=content-service \
  --data url='http://content-service:8011'

# Add Route
curl -i -X POST http://localhost:8001/services/content-service/routes \
  --data 'paths[]=/api/v1/scripts' \
  --data 'methods[]=GET' \
  --data 'methods[]=POST'

# Add JWT Plugin
curl -i -X POST http://localhost:8001/services/content-service/plugins \
  --data name=jwt

# Repeat for other services...
```

---

### Frontend Remaining Work

#### 8. Frontend Pages & Integration (Week 7-8)
**Priority**: HIGH | **Time**: 24 hours

##### Task 8.1: Dashboard Page (6 hours)
**Files to Create**:
- `/frontend/app/dashboard/page.tsx`
- `/frontend/components/Dashboard/QuickStats.tsx`
- `/frontend/components/Dashboard/RecentVideos.tsx`

##### Task 8.2: Script Editor Page (6 hours)
**Files to Create**:
- `/frontend/app/dashboard/scripts/new/page.tsx`
- `/frontend/components/ScriptEditor/EditorToolbar.tsx`

##### Task 8.3: Video Details Backend Integration (6 hours)
**Tasks**:
- Connect AudioPickerModal to real audio API
- Connect AvatarPickerModal to real avatar API
- Connect TextEditorModal to layer update API
- Implement layer CRUD operations
- Add video regeneration trigger

##### Task 8.4: Video Library Page (6 hours)
**Files to Create**:
- `/frontend/app/dashboard/videos/page.tsx`
- `/frontend/components/VideoLibrary/VideoGrid.tsx`
- `/frontend/components/VideoLibrary/VideoFilters.tsx`

---

### Phase 6: Backend APIs for Scene Editor (Week 7)
**Priority**: CRITICAL | **Time**: 30 hours

See [PHASE_6_API_REQUIREMENTS.md](./PHASE_6_API_REQUIREMENTS.md) for detailed specifications.

**Summary**:
1. Scene Management APIs (8 hours)
2. Layer Management APIs (8 hours)
3. Audio Library APIs (4 hours)
4. Voice Library APIs (4 hours)
5. Avatar Library APIs (3 hours)
6. Media Library APIs (3 hours)

---

### Testing & Quality Assurance (Week 8-9)
**Priority**: HIGH | **Time**: 40 hours

#### Task 9.1: Backend Unit Tests
**Coverage Target**: >80%

**Services to Test**:
- Content Service: LLM providers, quality scoring, templates
- Video Service: FFmpeg wrapper, video renderer, scene parser
- Voice Service: Azure TTS, voice orchestrator
- Translation Service: Google Translate, caching
- Analytics Service: Event collection, InfluxDB
- Trend Service: Data collection, trend analysis

**Test Framework**:
- Go: `testify` library
- Python: `pytest`
- Node.js: `jest`

**Running Tests**:
```bash
# Go services
cd services/content-service && go test ./... -v -cover

# Python services
cd services/video-processing-service && pytest --cov

# Node.js services
cd services/translation-service && npm test
```

---

#### Task 9.2: Integration Tests (10 hours)
**Test Scenarios**:
1. **Script → Video Flow**:
   - Generate script
   - Create video from script
   - Verify video output

2. **Auth → Content Flow**:
   - User login
   - Generate script (authenticated)
   - Verify script saved

3. **Video → Voice → Render Flow**:
   - Create video request
   - Generate voiceover
   - Render with voice
   - Verify output

---

#### Task 9.3: E2E Tests (10 hours)
**Test Framework**: Playwright

**Test Scenarios**:
```typescript
test('User can create video end-to-end', async ({ page }) => {
  // 1. Login
  await page.goto('/');
  await page.click('text=Sign In');
  await login(page);

  // 2. Create script
  await page.goto('/dashboard/scripts/new');
  await page.fill('[name="topic"]', 'AI in Healthcare');
  await page.selectOption('[name="platform"]', 'YouTube');
  await page.click('button:has-text("Generate Script")');
  await page.waitForSelector('text=Script generated');

  // 3. Create video
  await page.click('button:has-text("Create Video")');
  await page.waitForSelector('text=Video generation started', { timeout: 60000 });

  // 4. Verify video
  await page.waitForSelector('[data-testid="video-player"]', { timeout: 300000 });
  const videoSrc = await page.getAttribute('[data-testid="video-player"]', 'src');
  expect(videoSrc).toContain('.mp4');
});
```

---

#### Task 9.4: Load Testing (5 hours)
**Tool**: k6

**Load Test Scenarios**:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
};

export default function () {
  // Test script generation endpoint
  let response = http.post('http://localhost:8011/api/v1/scripts/generate', {
    topic: 'Test Topic',
    platform: 'YouTube',
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
```

**Performance Targets**:
- API Response Time: <2s (p95)
- Video Generation: <2 minutes
- Concurrent Users: 100+
- Error Rate: <1%

---

### DevOps & Deployment (Week 9-10)
**Priority**: HIGH | **Time**: 20 hours

#### Task 10.1: CI/CD Pipeline (10 hours)
**Files to Create**:
- `/.github/workflows/test.yml`
- `/.github/workflows/deploy.yml`
- `/.github/workflows/docker-build.yml`

**GitHub Actions Workflow**:
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test-go:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      - name: Run Go tests
        run: |
          cd services/content-service
          go test -v -cover ./...

  test-python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Run Python tests
        run: |
          cd services/video-processing-service
          pip install -r requirements.txt
          pytest --cov --cov-report=xml

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Run Frontend tests
        run: |
          cd frontend
          npm install
          npm test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Start services
        run: docker-compose up -d
      - name: Run E2E tests
        run: |
          cd frontend
          npx playwright test
```

---

#### Task 10.2: Docker Images (5 hours)
**Dockerfiles to Create**:
- `/services/content-service/Dockerfile`
- `/services/video-processing-service/Dockerfile`
- `/services/voice-service/Dockerfile`
- `/services/translation-service/Dockerfile`
- `/services/analytics-service/Dockerfile`
- `/services/trend-service/Dockerfile`
- `/frontend/Dockerfile`

**Multi-stage Build Example**:
```dockerfile
# Build stage
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main cmd/main.go

# Run stage
FROM alpine:3.18
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 8011
CMD ["./main"]
```

---

#### Task 10.3: Kubernetes Manifests (5 hours)
**Files to Create**:
- `/infrastructure/k8s/content-service.yaml`
- `/infrastructure/k8s/video-service.yaml`
- `/infrastructure/k8s/voice-service.yaml`
- `/infrastructure/k8s/ingress.yaml`

**Deployment Example**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: content-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: content-service
  template:
    metadata:
      labels:
        app: content-service
    spec:
      containers:
      - name: content-service
        image: scriptsensei/content-service:latest
        ports:
        - containerPort: 8011
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8011
          initialDelaySeconds: 30
          periodSeconds: 10
```

---

## 📊 Estimated Timeline

### Sprint Breakdown (10-12 weeks to MVP completion)

| Week | Focus Area | Tasks | Hours |
|------|------------|-------|-------|
| **Week 1-2** | Content Service | LLM providers, quality scoring, templates | 22h |
| **Week 2-3** | Video Processing | FFmpeg, rendering, WebSocket, Celery | 32h |
| **Week 3-4** | Voice Service | Azure TTS, multi-provider, profiles | 18h |
| **Week 4** | Translation | Google Translate, caching, batch | 12h |
| **Week 5** | Analytics | Event collection, InfluxDB, dashboard | 16h |
| **Week 5-6** | Trend Service | Data collection, analysis, API | 20h |
| **Week 6** | API Gateway | Kong setup, JWT verification | 8h |
| **Week 7** | Phase 6 Backend | Scene/layer/audio/avatar/media APIs | 30h |
| **Week 7-8** | Frontend | Dashboard, script editor, video integration | 24h |
| **Week 8-9** | Testing | Unit, integration, E2E, load tests | 40h |
| **Week 9-10** | DevOps | CI/CD, Docker, Kubernetes | 20h |
| **Week 10-11** | Bug Fixes | Fix issues, polish features | 20h |
| **Week 11-12** | Launch Prep | Documentation, security audit, deployment | 16h |

**Total Estimated Time**: ~278 hours (assuming 20-30 hours/week = 10-14 weeks)

---

## 🎯 Success Criteria

### MVP Launch Checklist

#### Core Features (Must Have)
- [ ] User authentication (Clerk)
- [ ] Script generation with 3+ LLM providers
- [ ] Quality scoring for scripts
- [ ] Template system (10+ templates)
- [ ] Video generation from script
- [ ] FFmpeg rendering pipeline
- [ ] Voice synthesis (20+ voices)
- [ ] Audio library with stock audio
- [ ] Avatar library with stock avatars
- [ ] Text editing with formatting
- [ ] Layer management (CRUD)
- [ ] 5 language support
- [ ] Platform optimization (YouTube, TikTok)
- [ ] Dashboard with analytics
- [ ] Video library
- [ ] Kong API Gateway

#### Technical Requirements
- [ ] >80% test coverage (backend)
- [ ] >70% test coverage (frontend)
- [ ] <2s API response time (p95)
- [ ] <2min video generation
- [ ] All services containerized
- [ ] CI/CD pipeline working
- [ ] Database migrations automated
- [ ] Monitoring & logging setup

#### Documentation
- [ ] API documentation complete
- [ ] User guide written
- [ ] Developer setup guide
- [ ] Architecture diagrams
- [ ] Troubleshooting guide

---

## 🔑 Critical Dependencies

### Required API Keys
| Service | Priority | Cost | Status |
|---------|----------|------|--------|
| DeepSeek V3 | CRITICAL | Pay-as-you-go | ⏳ Need |
| Azure Speech | CRITICAL | $16/1M chars | ⏳ Need |
| Clerk Auth | CRITICAL | Free tier available | ⏳ Need |
| Google Translate | HIGH | $20/1M chars | ⏳ Need |
| Pexels API | HIGH | FREE | ⏳ Need |
| Google Gemini | MEDIUM | $0.10/$0.40 per M | ✅ Have |
| OpenAI GPT | MEDIUM | $0.15/$0.60 per M | ⏳ Need |
| Anthropic Claude | MEDIUM | $0.25/$1.25 per M | ⏳ Need |

### External Services
- ✅ PostgreSQL (containerized)
- ✅ Redis (containerized)
- ✅ RabbitMQ (containerized)
- ✅ MongoDB (containerized)
- ✅ Elasticsearch (containerized)
- ✅ MinIO (containerized)
- ✅ InfluxDB (containerized)
- ⏳ Kong Gateway (needs configuration)
- ⏳ S3 or CDN (for production)

---

## 💰 Estimated Costs (Monthly)

### Development Phase
- **Infrastructure**: $0 (local Docker)
- **API Testing**: ~$50 (LLM/TTS API calls)
- **Total**: ~$50/month

### Production (1000 users, 10K videos/month)
- **Azure TTS**: ~$160 (10M characters)
- **LLM APIs**: ~$200 (script generation)
- **Google Translate**: ~$100 (5M characters)
- **Database**: ~$50 (PostgreSQL)
- **Storage**: ~$30 (S3/CDN)
- **Hosting**: ~$200 (Kubernetes cluster)
- **Total**: ~$740/month

**Revenue Target**: $5,000 MRR (100 paying users @ $50/month)
**Profit Margin**: ~85% after operational costs

---

## 🚨 Known Risks & Mitigation

### Technical Risks
1. **FFmpeg Performance**:
   - Risk: Slow video rendering
   - Mitigation: GPU acceleration, parallel processing, queue system

2. **LLM Provider Downtime**:
   - Risk: Service unavailable
   - Mitigation: Multi-provider fallback, caching, retry logic

3. **Storage Costs**:
   - Risk: High storage costs for videos
   - Mitigation: Automatic cleanup, tiered storage, compression

### Business Risks
1. **API Cost Overruns**:
   - Risk: LLM/TTS costs exceed revenue
   - Mitigation: Usage quotas, rate limiting, cost monitoring

2. **Competition**:
   - Risk: Established players (Fliki, Synthesia)
   - Mitigation: Focus on emerging markets, better localization

---

## 📚 Learning Resources

### For Development
- **Go**: https://gobyexample.com/
- **Python/FastAPI**: https://fastapi.tiangolo.com/
- **Next.js 14**: https://nextjs.org/docs
- **FFmpeg**: https://ffmpeg.org/documentation.html
- **Kong Gateway**: https://docs.konghq.com/
- **Celery**: https://docs.celeryproject.org/

### For Deployment
- **Docker**: https://docs.docker.com/
- **Kubernetes**: https://kubernetes.io/docs/
- **GitHub Actions**: https://docs.github.com/en/actions

---

## 📝 Notes

### Best Practices
1. **Write tests first** (TDD approach per CLAUDE.md)
2. **Commit frequently** with descriptive messages
3. **Review code** before merging
4. **Document as you go** (don't leave for later)
5. **Monitor costs** (set up billing alerts)

### Development Tips
1. Use `make dev` to start all services
2. Run tests before committing (`make test`)
3. Check logs with `docker-compose logs -f [service]`
4. Use Postman/Insomnia for API testing
5. Profile slow endpoints with pprof (Go) or cProfile (Python)

---

## �� Summary

### What's Left to Build (55%):
1. ✅ **Backend Services** (40%):
   - Content Service: LLM providers, quality scoring, templates
   - Video Processing: FFmpeg, rendering, Celery
   - Voice Service: Azure TTS, multi-provider
   - Translation: Google Translate, caching
   - Analytics: Event collection, InfluxDB
   - Trend Service: Data collection, analysis

2. ✅ **APIs** (15%):
   - Phase 6: Scene/layer/audio/avatar/media APIs
   - Kong Gateway configuration
   - JWT verification

3. ✅ **Frontend** (25%):
   - Dashboard page
   - Script editor page
   - Video details backend integration
   - Video library page

4. ✅ **Testing & DevOps** (20%):
   - Unit tests (>80% coverage)
   - Integration tests
   - E2E tests
   - CI/CD pipeline
   - Docker images
   - Kubernetes manifests

### Next Immediate Steps:
1. Obtain required API keys (DeepSeek, Azure, Clerk)
2. Start with Content Service completion (Week 1-2)
3. Then Video Processing Service (Week 2-3)
4. Then Voice Service (Week 3-4)
5. Continue with other services and frontend

### Estimated Time to MVP:
**10-14 weeks** (assuming 20-30 hours/week of development)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-05
**Next Review**: Weekly during development

🚀 **Let's build ScriptSensei!**
