PHASE 1: Core MVP (Weeks 1-5)
Week 1: Infrastructure & Port Updates
Day 1-2: Port Configuration & Environment Setup
Tasks:
Update port configurations across all files
Fix Next.js API gateway URL (8080 → 8000)
Configure LLM API keys in environment
Set up API client abstractions for multi-LLM support
Files to modify:
frontend/next.config.js (port 3000 → 4000)
frontend/package.json (dev script port)
docker-compose.yml (Grafana 3001 → 4001)
.env (add all API keys)
Create .env.example with placeholder keys
Day 3-5: Content Service - Script Generator (TDD)
Feature: AI-powered script generation with multi-LLM support Tests to write first:
TestGenerateScript_WithDeepSeek_Success
TestGenerateScript_InvalidTopic_ReturnsError
TestGenerateScript_LLMFallback_WhenPrimaryFails
TestGenerateScript_SavesToDatabase
TestAnalyzeScriptQuality_ReturnsScores
Implementation:
Multi-LLM orchestrator (DeepSeek → Gemini → GPT fallback)
Script quality analyzer (Hook Score, SEO Score, Engagement Score)
Template system integration
Database persistence
API Endpoints:
POST /api/v1/scripts/generate
POST /api/v1/scripts/analyze
GET /api/v1/scripts/:id
PUT /api/v1/scripts/:id
DELETE /api/v1/scripts/:id
Week 2: Voice Service & Basic TTS
Day 1-3: Voice Service Foundation (TDD)
Feature: Multi-provider TTS with voice selection Tests to write first:
TestSynthesizeSpeech_AzureTTS_Success
TestListVoices_GroupedByLanguage
TestVoiceSelection_ValidatesLanguage
TestTTSFallback_WhenProviderFails
TestAudioStorage_SavesToMinIO
Implementation:
Azure Cognitive Services integration (primary)
Google Cloud TTS integration (fallback)
Voice catalog (2000+ voices)
Audio file storage (MinIO)
Multi-language support
API Endpoints:
POST /api/v1/voices/synthesize
GET /api/v1/voices/list
GET /api/v1/voices/preview/:voiceId
POST /api/v1/voices/clone (premium)
Day 4-5: Voice Cloning (Premium Feature - TDD)
Feature: ElevenLabs voice cloning Tests to write first:
TestCloneVoice_MinimumAudioDuration
TestCloneVoice_SavesProfile
TestCloneVoice_CalculatesSimilarityScore
TestUseClonedVoice_InVideoGeneration
Week 3: Video Processing Service - Core Generation
Day 1-3: Video Service Foundation (TDD)
Feature: Basic text-to-video with stock footage Tests to write first:
TestGenerateVideo_FromScript_Success
TestFetchStockFootage_FromPexels
TestVideoComposition_FFmpeg
TestVideoStatus_Tracking
TestVideoStorage_MinIO
Implementation:
Pexels API integration (stock videos)
FFmpeg video composition
Scene detection and timing
Progress tracking (RabbitMQ)
Video storage and CDN
API Endpoints:
POST /api/v1/videos/generate
GET /api/v1/videos/:id/status
GET /api/v1/videos/:id/download
DELETE /api/v1/videos/:id
POST /api/v1/videos/render (background job)
Day 4-5: Platform-Specific Optimization (TDD)
Feature: TikTok, YouTube Shorts, Instagram Reels generators Tests to write first:
TestTikTokOptimization_9x16_60s
TestYouTubeShortsOptimization_HookFirst3s
TestInstagramReelsOptimization_Captions
TestPlatformSpecificAspectRatio
Week 4: Frontend - Dashboard & Core UI
Day 1-2: Authentication & User Dashboard (TDD)
Feature: Clerk authentication + user dashboard Tests to write:
TestDashboard_DisplaysUserStats
TestDashboard_ListsRecentVideos
TestDashboard_ShowsUsageQuota
TestProtectedRoutes_RequireAuth
Components to build:
Dashboard layout (Shadcn UI)
Usage statistics cards
Recent videos list
Quick action buttons
Pages:
/dashboard
/dashboard/videos
/dashboard/scripts
/dashboard/settings
Day 3-5: Script Editor & Generator UI (TDD)
Feature: AI script generation interface Tests to write:
TestScriptEditor_GenerateFromTopic
TestScriptEditor_EditAndPreview
TestScriptEditor_SaveDraft
TestScriptEditor_QualityScoreDisplay
Components:
Rich text editor (TipTap or Slate)
AI generation form
Quality score visualizer
Template selector
Real-time preview
Week 5: Video Creation Workflow
Day 1-3: Video Generator UI (TDD)
Feature: Complete video creation workflow Tests to write:
TestVideoCreator_SelectScript
TestVideoCreator_ChooseVoice
TestVideoCreator_PreviewBeforeRender
TestVideoCreator_PlatformSelection
TestVideoCreator_SubmitToQueue
Components:
Script selector
Voice picker (with audio preview)
Platform selector (TikTok/YouTube/Instagram)
Video settings panel
Generation queue display
Day 4-5: Video Library & Management (TDD)
Feature: Video library with download/share Tests to write:
TestVideoLibrary_DisplaysAllVideos
TestVideoLibrary_FilterByPlatform
TestVideoLibrary_SearchByTitle
TestVideoLibrary_DeleteVideo
TestVideoLibrary_DownloadMP4
Components:
Video grid/list view
Filter and search
Video player with preview
Download button
Share options
📅 PHASE 2: Advanced Features (Weeks 6-10)
Week 6: Translation Service
Day 1-3: Multi-Language Translation (TDD)
Feature: 100+ language support with Gemini Tests to write:
TestTranslate_TextToMultipleLanguages
TestTranslate_DetectSourceLanguage
TestTranslate_CacheTranslations
TestTranslate_PreserveFormatting
TestBulkTranslate_Scripts
Implementation:
Gemini 2.0 Flash integration
Language detection
Translation caching (Redis)
Bulk translation API
Format preservation
API Endpoints:
POST /api/v1/translate
POST /api/v1/translate/bulk
GET /api/v1/languages/supported
POST /api/v1/translate/detect
Day 4-5: Localization Features (TDD)
Feature: Regional customization (Nepal, Japan, SEA) Tests to write:
TestRegionalCalendar_BikramSambat
TestRegionalCurrency_NPR_JPY_Display
TestRegionalDialects_Selection
TestFestivalReferences_ByRegion
Week 7: Analytics Service
Day 1-3: Usage Analytics (TDD)
Feature: Track user activity and resource usage Tests to write:
TestTrackEvent_VideoGeneration
TestAggregateUsage_ByUser
TestQuotaTracking_BySubscriptionTier
TestAnalyticsDashboard_DataRetrieval
TestExportAnalytics_CSV
Implementation:
Event tracking system
InfluxDB time-series storage
Quota management
Usage reports
API Endpoints:
POST /api/v1/analytics/track
GET /api/v1/analytics/usage/:userId
GET /api/v1/analytics/dashboard
GET /api/v1/analytics/export
Day 4-5: Analytics Dashboard UI (TDD)
Feature: Visualization with charts Tests to write:
TestDashboard_DisplaysCharts
TestDashboard_FiltersDateRange
TestDashboard_ExportsData
Components:
Chart.js/Recharts integration
Usage graphs
Quota progress bars
Export functionality
Week 8: Trend Analysis Service
Day 1-3: Social Media Trend Scraping (TDD)
Feature: Track trending topics across platforms Tests to write:
TestFetchTikTokTrends_CreativeCenter
TestFetchYouTubeTrends_API
TestAggregateTrends_ByRegion
TestTrendScoring_Relevance
TestTrendRefresh_Hourly
Implementation:
TikTok Creative Center API
YouTube Trends API
Google Trends integration
Trend scoring algorithm
Scheduled updates (cron)
API Endpoints:
GET /api/v1/trends/current
GET /api/v1/trends/platform/:platform
GET /api/v1/trends/region/:region
POST /api/v1/trends/analyze-topic
Day 4-5: Trend Dashboard UI (TDD)
Feature: Trending topics dashboard Components:
Trending hashtags display
Topic suggestion engine
Regional filters
Platform filters
"Generate from trend" button
Week 9: Advanced Video Features
Day 1-2: Bulk Video Creator (TDD)
Feature: Generate multiple videos from CSV Tests to write:
TestBulkUpload_ValidateCSV
TestBulkGeneration_CreatesJobs
TestBulkProgress_Tracking
TestBulkDownload_ZipFile
Implementation:
CSV parser and validator
Parallel job processing (10-50 workers)
Progress tracking UI
Batch download
Day 3-4: Template Library (TDD)
Feature: Pre-made script templates Tests to write:
TestTemplates_ListByCategory
TestTemplates_Search
TestTemplates_UseTemplate
TestTemplates_CustomTemplates
Implementation:
Template database schema
Category system
Template preview
Custom template creation
Day 5: AI Avatars Integration (TDD)
Feature: AI-generated presenters (premium) Tests to write:
TestAvatarSelection_List
TestAvatarVideo_WithScript
TestAvatarCustomization_Premium
Implementation:
Replicate API integration (D-ID/HeyGen alternative)
Avatar library
Premium gating
Week 10: Subscriptions & Polish
Day 1-3: Stripe Integration (TDD)
Feature: Subscription management Tests to write:
TestCreateSubscription_StripeCheckout
TestWebhook_SubscriptionCreated
TestQuotaUpdate_OnSubscriptionChange
TestCancelSubscription_MaintainsData
TestUpgrade_Downgrade_Plans
Implementation:
Stripe Checkout integration
Webhook handlers
Subscription status sync
Quota enforcement
Payment history
API Endpoints:
POST /api/v1/subscriptions/create-checkout
POST /api/v1/subscriptions/webhook
GET /api/v1/subscriptions/status
POST /api/v1/subscriptions/cancel
POST /api/v1/subscriptions/upgrade
Day 4-5: Team Collaboration (TDD)
Feature: Multi-user teams (Business tier) Tests to write:
TestInviteTeamMember_SendsEmail
TestSharedVideoAccess_TeamMembers
TestRolePermissions_Admin_Member
TestTeamUsageQuota_Shared
Components:
Team management UI
Role-based permissions
Shared video library
Team analytics
🗂️ File Structure
ScriptSensei/
├── frontend/ # Next.js 14 (Port 4000)
│ ├── app/
│ │ ├── (auth)/
│ │ │ ├── sign-in/[[...sign-in]]/page.tsx
│ │ │ └── sign-up/[[...sign-up]]/page.tsx
│ │ ├── dashboard/
│ │ │ ├── page.tsx # Dashboard home
│ │ │ ├── scripts/
│ │ │ │ ├── page.tsx # Script library
│ │ │ │ ├── new/page.tsx # Script generator
│ │ │ │ └── [id]/edit/page.tsx # Script editor
│ │ │ ├── videos/
│ │ │ │ ├── page.tsx # Video library
│ │ │ │ ├── create/page.tsx # Video creator
│ │ │ │ └── [id]/page.tsx # Video detail
│ │ │ ├── templates/page.tsx # Template library
│ │ │ ├── trends/page.tsx # Trending topics
│ │ │ ├── analytics/page.tsx # Analytics dashboard
│ │ │ ├── team/page.tsx # Team management
│ │ │ └── settings/page.tsx # User settings
│ │ └── api/ # API routes (optional)
│ ├── components/
│ │ ├── ui/ # Shadcn UI components
│ │ ├── dashboard/
│ │ │ ├── DashboardStats.tsx
│ │ │ ├── RecentVideos.tsx
│ │ │ └── QuickActions.tsx
│ │ ├── scripts/
│ │ │ ├── ScriptEditor.tsx
│ │ │ ├── AIGenerator.tsx
│ │ │ ├── QualityScore.tsx
│ │ │ └── TemplateSelector.tsx
│ │ ├── videos/
│ │ │ ├── VideoCreator.tsx
│ │ │ ├── VoiceSelector.tsx
│ │ │ ├── PlatformSelector.tsx
│ │ │ ├── VideoPlayer.tsx
│ │ │ └── VideoGrid.tsx
│ │ └── common/
│ │ ├── Navbar.tsx
│ │ ├── Sidebar.tsx
│ │ └── LoadingStates.tsx
│ ├── lib/
│ │ ├── api/ # API client
│ │ ├── hooks/ # React hooks
│ │ └── utils/ # Utilities
│ └── **tests**/ # Frontend tests
│
├── services/
│ ├── content-service/ # Go - Port 8011
│ │ ├── cmd/main.go
│ │ ├── internal/
│ │ │ ├── handlers/
│ │ │ │ ├── script_handler.go
│ │ │ │ ├── script_handler_test.go
│ │ │ │ ├── template_handler.go
│ │ │ │ └── template_handler_test.go
│ │ │ ├── services/
│ │ │ │ ├── llm_orchestrator.go
│ │ │ │ ├── llm_orchestrator_test.go
│ │ │ │ ├── script_generator.go
│ │ │ │ ├── script_generator_test.go
│ │ │ │ ├── quality_analyzer.go
│ │ │ │ └── quality_analyzer_test.go
│ │ │ ├── models/
│ │ │ ├── config/
│ │ │ └── database/
│ │ └── Makefile
│ │
│ ├── video-processing-service/ # Python - Port 8012
│ │ ├── src/
│ │ │ ├── main.py
│ │ │ ├── handlers/
│ │ │ │ ├── video_handler.py
│ │ │ │ └── **init**.py
│ │ │ ├── services/
│ │ │ │ ├── video_generator.py
│ │ │ │ ├── ffmpeg_processor.py
│ │ │ │ ├── stock_footage.py
│ │ │ │ └── platform_optimizer.py
│ │ │ ├── models/
│ │ │ └── config/
│ │ ├── tests/
│ │ │ ├── unit/
│ │ │ │ ├── test_video_generator.py
│ │ │ │ ├── test_ffmpeg_processor.py
│ │ │ │ └── test_stock_footage.py
│ │ │ └── integration/
│ │ ├── requirements.txt
│ │ └── Makefile
│ │
│ ├── voice-service/ # Go - Port 8013
│ │ ├── cmd/main.go
│ │ ├── internal/
│ │ │ ├── handlers/
│ │ │ │ ├── tts_handler.go
│ │ │ │ ├── tts_handler_test.go
│ │ │ │ ├── clone_handler.go
│ │ │ │ └── clone_handler_test.go
│ │ │ ├── services/
│ │ │ │ ├── azure_tts.go
│ │ │ │ ├── azure_tts_test.go
│ │ │ │ ├── elevenlabs.go
│ │ │ │ ├── elevenlabs_test.go
│ │ │ │ └── voice_catalog.go
│ │ │ └── models/
│ │ └── Makefile
│ │
│ ├── translation-service/ # Node.js - Port 8014
│ │ ├── src/
│ │ │ ├── index.ts
│ │ │ ├── handlers/
│ │ │ ├── services/
│ │ │ │ ├── gemini-translator.ts
│ │ │ │ └── translation-cache.ts
│ │ │ └── models/
│ │ ├── tests/
│ │ │ └── unit/
│ │ ├── package.json
│ │ └── tsconfig.json
│ │
│ ├── analytics-service/ # Go - Port 8015
│ │ ├── cmd/main.go
│ │ ├── internal/
│ │ │ ├── handlers/
│ │ │ │ ├── analytics_handler.go
│ │ │ │ └── analytics_handler_test.go
│ │ │ ├── services/
│ │ │ │ ├── event_tracker.go
│ │ │ │ ├── event_tracker_test.go
│ │ │ │ ├── usage_aggregator.go
│ │ │ │ └── quota_manager.go
│ │ │ └── models/
│ │ └── Makefile
│ │
│ └── trend-service/ # Python - Port 8016
│ ├── src/
│ │ ├── main.py
│ │ ├── handlers/
│ │ ├── services/
│ │ │ ├── tiktok_trends.py
│ │ │ ├── youtube_trends.py
│ │ │ ├── trend_aggregator.py
│ │ │ └── trend_scorer.py
│ │ └── models/
│ ├── tests/
│ └── requirements.txt
│
└── scripts/
├── setup-api-keys.sh # Helper to configure all API keys
└── test-all-services.sh # Run all tests across services
🧪 Testing Strategy (Strict TDD)
Every Feature Follows Red-Green-Refactor:
RED: Write failing test first
GREEN: Write minimum code to pass
REFACTOR: Improve code quality
Test Coverage Requirements:
Unit Tests: 80%+ coverage
Integration Tests: All critical paths
E2E Tests: All user workflows
Example TDD Workflow:

# 1. Write test first (RED)

cd services/content-service

# Edit: internal/services/script_generator_test.go

make test-unit # Should FAIL

# 2. Implement feature (GREEN)

# Edit: internal/services/script_generator.go

make test-unit # Should PASS

# 3. Refactor (REFACTOR)

# Improve code while keeping tests green

make test-unit # Still PASS
🔄 Development Workflow
Daily Routine:
Pull latest code
Run make dev to start infrastructure
Pick next feature from plan
Write tests first (TDD)
Implement feature
Run all tests
Commit with descriptive message
Push to branch
Before Each Commit:
make test # All tests must pass
make lint # Code quality checks
make format # Auto-format code
📊 Success Metrics
Week 1-5 (Phase 1) Deliverables:
✅ AI script generation working
✅ Text-to-speech with 2000+ voices
✅ Basic video generation (TikTok, YouTube, Instagram)
✅ User dashboard with video library
✅ All tests passing (80%+ coverage)
Week 6-10 (Phase 2) Deliverables:
✅ 100+ language translation
✅ Analytics dashboard
✅ Trend analysis
✅ Bulk video creation
✅ Stripe subscriptions
✅ Team collaboration
✅ All 40+ features implemented
