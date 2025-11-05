# Phase 6: Backend API Requirements

**Date**: 2025-11-05
**Status**: Documentation Complete
**Implementation Phase**: Phase 6 (Backend Integration)

---

## 📋 Overview

This document outlines all the backend API endpoints and data structures required to fully integrate the interactive scene editor with the backend services. These APIs will enable persistent storage and real-time updates for all scene editing operations.

---

## 🎯 Core API Requirements

### 1. Scene Management APIs

#### **GET** `/api/v1/videos/{videoId}/scenes`

**Purpose**: Retrieve all scenes for a video with their layers

**Response**:
```json
{
  "success": true,
  "data": {
    "scenes": [
      {
        "id": "scene-uuid-1",
        "video_id": "video-uuid",
        "scene_number": 1,
        "text": "Welcome to our amazing product demonstration...",
        "duration": 8.5,
        "start_time": 0,
        "end_time": 8.5,
        "is_expanded": false,
        "created_at": "2025-11-05T10:30:00Z",
        "updated_at": "2025-11-05T10:30:00Z",
        "layers": [
          {
            "id": "layer-uuid-1",
            "scene_id": "scene-uuid-1",
            "type": "audio",
            "name": "Upbeat Corporate",
            "enabled": true,
            "duration": 8.5,
            "start_time": 0,
            "end_time": 8.5,
            "order_index": 1,
            "properties": {
              "audio_id": "audio-123",
              "audio_url": "https://cdn.example.com/audio/upbeat.mp3",
              "volume": 0.7,
              "fade_in": 0.5,
              "fade_out": 0.5
            }
          },
          {
            "id": "layer-uuid-2",
            "scene_id": "scene-uuid-1",
            "type": "voiceover",
            "name": "Rose (Female, US)",
            "enabled": true,
            "duration": 8.0,
            "start_time": 0,
            "end_time": 8.0,
            "order_index": 2,
            "properties": {
              "voice_id": "en-US-Neural2-A",
              "voice_name": "Rose",
              "language": "en-US",
              "gender": "female",
              "style": "conversational",
              "text": "Welcome to our amazing product demonstration...",
              "speed": 1.0,
              "pitch": 1.0
            }
          },
          {
            "id": "layer-uuid-3",
            "scene_id": "scene-uuid-1",
            "type": "avatar",
            "name": "Amy",
            "enabled": true,
            "duration": 8.5,
            "start_time": 0,
            "end_time": 8.5,
            "order_index": 3,
            "properties": {
              "avatar_id": "avatar-amy-casual",
              "avatar_url": "https://cdn.example.com/avatars/amy.png",
              "position": { "x": 50, "y": 50 },
              "scale": 1.0,
              "animation": "talking"
            }
          },
          {
            "id": "layer-uuid-4",
            "scene_id": "scene-uuid-1",
            "type": "text",
            "name": "Text: Welcome to our...",
            "enabled": true,
            "duration": 3.0,
            "start_time": 0,
            "end_time": 3.0,
            "order_index": 4,
            "properties": {
              "text": "Welcome to our product",
              "font_family": "Inter",
              "font_size": 32,
              "font_weight": "bold",
              "font_style": "normal",
              "color": "#FFFFFF",
              "text_align": "center",
              "position": { "x": 50, "y": 80 },
              "animation": "fadeIn"
            }
          },
          {
            "id": "layer-uuid-5",
            "scene_id": "scene-uuid-1",
            "type": "media",
            "name": "Product Hero Image",
            "enabled": true,
            "duration": 8.5,
            "start_time": 0,
            "end_time": 8.5,
            "order_index": 5,
            "properties": {
              "media_id": "media-456",
              "media_url": "https://cdn.example.com/images/product.jpg",
              "media_type": "image",
              "position": { "x": 50, "y": 50 },
              "scale": 1.0,
              "opacity": 1.0
            }
          }
        ]
      }
    ]
  }
}
```

---

#### **PUT** `/api/v1/videos/{videoId}/scenes/{sceneId}`

**Purpose**: Update a scene's properties

**Request Body**:
```json
{
  "text": "Updated scene narration text",
  "duration": 10.0,
  "is_expanded": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Scene updated successfully",
  "data": {
    "scene": { /* updated scene object */ }
  }
}
```

---

### 2. Layer Management APIs

#### **POST** `/api/v1/scenes/{sceneId}/layers`

**Purpose**: Add a new layer to a scene

**Request Body**:
```json
{
  "type": "audio",
  "name": "Background Music",
  "enabled": true,
  "duration": 8.5,
  "start_time": 0,
  "end_time": 8.5,
  "order_index": 1,
  "properties": {
    "audio_id": "audio-789",
    "audio_url": "https://cdn.example.com/audio/bgmusic.mp3",
    "volume": 0.5
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Layer added successfully",
  "data": {
    "layer": { /* created layer object */ }
  }
}
```

---

#### **PUT** `/api/v1/layers/{layerId}`

**Purpose**: Update a layer's properties

**Request Body**:
```json
{
  "name": "Updated Layer Name",
  "enabled": false,
  "properties": {
    "volume": 0.8,
    "fade_in": 1.0
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Layer updated successfully",
  "data": {
    "layer": { /* updated layer object */ }
  }
}
```

---

#### **DELETE** `/api/v1/layers/{layerId}`

**Purpose**: Delete a layer from a scene

**Response**:
```json
{
  "success": true,
  "message": "Layer deleted successfully"
}
```

---

#### **PUT** `/api/v1/layers/{layerId}/toggle-visibility`

**Purpose**: Toggle layer visibility (enabled/disabled)

**Request Body**:
```json
{
  "enabled": false
}
```

**Response**:
```json
{
  "success": true,
  "message": "Layer visibility updated",
  "data": {
    "layer": { /* updated layer object */ }
  }
}
```

---

#### **PUT** `/api/v1/layers/reorder`

**Purpose**: Reorder layers within a scene

**Request Body**:
```json
{
  "scene_id": "scene-uuid-1",
  "layer_orders": [
    { "layer_id": "layer-uuid-1", "order_index": 3 },
    { "layer_id": "layer-uuid-2", "order_index": 1 },
    { "layer_id": "layer-uuid-3", "order_index": 2 }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Layers reordered successfully"
}
```

---

### 3. Audio Library APIs

#### **GET** `/api/v1/audio/library`

**Purpose**: Get audio library (stock, user-uploaded, favorites)

**Query Parameters**:
- `type`: `stock | my | favorites`
- `category`: `music | sound_effects`
- `search`: search query string
- `page`: page number (default: 1)
- `limit`: items per page (default: 20)

**Response**:
```json
{
  "success": true,
  "data": {
    "audio": [
      {
        "id": "audio-123",
        "title": "Upbeat Corporate",
        "artist": "AudioCo",
        "duration": 120,
        "category": "music",
        "tags": ["corporate", "upbeat", "energetic"],
        "url": "https://cdn.example.com/audio/upbeat.mp3",
        "waveform_url": "https://cdn.example.com/waveforms/upbeat.json",
        "thumbnail_url": "https://cdn.example.com/thumbnails/audio.png",
        "is_premium": false,
        "is_favorite": false
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 10,
      "total_items": 200,
      "items_per_page": 20
    }
  }
}
```

---

#### **POST** `/api/v1/audio/upload`

**Purpose**: Upload custom audio file

**Request**: `multipart/form-data`
- `file`: audio file (mp3, wav, m4a)
- `title`: audio title
- `category`: `music | sound_effects`

**Response**:
```json
{
  "success": true,
  "message": "Audio uploaded successfully",
  "data": {
    "audio": { /* created audio object */ }
  }
}
```

---

#### **POST** `/api/v1/audio/{audioId}/favorite`

**Purpose**: Add/remove audio from favorites

**Request Body**:
```json
{
  "is_favorite": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Audio favorite status updated"
}
```

---

### 4. Voice Library APIs

#### **GET** `/api/v1/voices`

**Purpose**: Get available voices for voiceover

**Query Parameters**:
- `language`: language code (e.g., `en-US`)
- `gender`: `male | female | child`
- `category`: `standard | ultra | studio`
- `search`: search query string

**Response**:
```json
{
  "success": true,
  "data": {
    "voices": [
      {
        "id": "en-US-Neural2-A",
        "name": "Rose",
        "language": "English",
        "language_code": "en-US",
        "dialect": "United States",
        "gender": "female",
        "style": "conversational",
        "category": "standard",
        "sample_url": "https://cdn.example.com/voices/rose-sample.mp3",
        "is_premium": false
      }
    ]
  }
}
```

---

#### **POST** `/api/v1/voices/generate`

**Purpose**: Generate voiceover from text

**Request Body**:
```json
{
  "voice_id": "en-US-Neural2-A",
  "text": "Welcome to our product demonstration",
  "speed": 1.0,
  "pitch": 1.0,
  "volume": 1.0
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "audio_url": "https://cdn.example.com/generated/voiceover-123.mp3",
    "duration": 3.5,
    "job_id": "job-uuid-123"
  }
}
```

---

### 5. Avatar Library APIs

#### **GET** `/api/v1/avatars`

**Purpose**: Get available avatars

**Query Parameters**:
- `gender`: `male | female | all`
- `category`: `stock | my | generated`
- `search`: search query string
- `page`: page number
- `limit`: items per page

**Response**:
```json
{
  "success": true,
  "data": {
    "avatars": [
      {
        "id": "avatar-amy-casual",
        "name": "Amy",
        "gender": "female",
        "style": "casual",
        "thumbnail_url": "https://cdn.example.com/avatars/amy-thumb.png",
        "preview_url": "https://cdn.example.com/avatars/amy.png",
        "video_url": "https://cdn.example.com/avatars/amy-preview.mp4",
        "is_premium": false,
        "variations": [
          {
            "id": "avatar-amy-professional",
            "name": "Amy (Professional)",
            "thumbnail_url": "https://cdn.example.com/avatars/amy-pro-thumb.png"
          }
        ]
      }
    ],
    "pagination": { /* pagination object */ }
  }
}
```

---

### 6. Media Library APIs

#### **GET** `/api/v1/media/library`

**Purpose**: Get media library (images, videos, GIFs)

**Query Parameters**:
- `type`: `all | image | video | gif`
- `source`: `stock | ai | uploaded`
- `category`: category filter
- `search`: search query
- `page`: page number
- `limit`: items per page

**Response**:
```json
{
  "success": true,
  "data": {
    "media": [
      {
        "id": "media-456",
        "type": "image",
        "title": "Product Hero Image",
        "url": "https://cdn.example.com/images/product.jpg",
        "thumbnail_url": "https://cdn.example.com/images/product-thumb.jpg",
        "source": "stock",
        "category": "Business",
        "tags": ["product", "technology"],
        "dimensions": { "width": 1920, "height": 1080 },
        "duration": null,
        "is_premium": false
      },
      {
        "id": "media-789",
        "type": "video",
        "title": "Office Background",
        "url": "https://cdn.example.com/videos/office.mp4",
        "thumbnail_url": "https://cdn.example.com/videos/office-thumb.jpg",
        "source": "stock",
        "category": "Business",
        "tags": ["office", "workspace"],
        "dimensions": { "width": 1920, "height": 1080 },
        "duration": 15.5,
        "is_premium": false
      }
    ],
    "pagination": { /* pagination object */ }
  }
}
```

---

#### **POST** `/api/v1/media/upload`

**Purpose**: Upload custom media file

**Request**: `multipart/form-data`
- `file`: media file (jpg, png, gif, mp4, mov)
- `title`: media title
- `category`: category name

**Response**:
```json
{
  "success": true,
  "message": "Media uploaded successfully",
  "data": {
    "media": { /* created media object */ }
  }
}
```

---

#### **POST** `/api/v1/media/generate-ai`

**Purpose**: Generate AI image from prompt

**Request Body**:
```json
{
  "prompt": "A futuristic cityscape at sunset",
  "style": "cinematic",
  "aspect_ratio": "16:9",
  "quality": "high"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "job_id": "ai-job-123",
    "status": "processing",
    "estimated_time": 30
  }
}
```

---

#### **GET** `/api/v1/media/ai-status/{jobId}`

**Purpose**: Check AI generation status

**Response**:
```json
{
  "success": true,
  "data": {
    "job_id": "ai-job-123",
    "status": "completed",
    "media": { /* generated media object */ }
  }
}
```

---

### 7. Video Regeneration API

#### **POST** `/api/v1/videos/{videoId}/regenerate`

**Purpose**: Regenerate video with updated scenes/layers

**Request Body**:
```json
{
  "scenes": ["scene-uuid-1", "scene-uuid-2"],
  "full_regeneration": false
}
```

**Response**:
```json
{
  "success": true,
  "message": "Video regeneration started",
  "data": {
    "job_id": "regen-job-456",
    "estimated_time": 120,
    "status": "processing"
  }
}
```

---

#### **GET** `/api/v1/videos/{videoId}/regeneration-status`

**Purpose**: Check video regeneration status

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "processing",
    "progress": 45,
    "current_scene": 2,
    "total_scenes": 5,
    "estimated_time_remaining": 60
  }
}
```

---

## 🔐 Authentication & Authorization

All API endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Permission Levels:
- **Free User**: Limited to basic features, watermarked videos
- **Pro User**: Full access to stock assets, no watermark
- **Business User**: API access, team collaboration, white-label

---

## 📊 Database Schema Requirements

### Tables to Add/Modify:

#### **scenes_layers**
```sql
CREATE TABLE scenes_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('audio', 'voiceover', 'text', 'media', 'shape', 'avatar', 'effect')),
  name VARCHAR(255) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  duration FLOAT NOT NULL,
  start_time FLOAT NOT NULL,
  end_time FLOAT NOT NULL,
  order_index INTEGER NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scenes_layers_scene_id ON scenes_layers(scene_id);
CREATE INDEX idx_scenes_layers_type ON scenes_layers(type);
```

#### **audio_library**
```sql
CREATE TABLE audio_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255),
  duration FLOAT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('music', 'sound_effects')),
  tags TEXT[],
  url TEXT NOT NULL,
  waveform_url TEXT,
  thumbnail_url TEXT,
  source VARCHAR(50) NOT NULL CHECK (source IN ('stock', 'uploaded', 'generated')),
  is_premium BOOLEAN DEFAULT false,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audio_library_category ON audio_library(category);
CREATE INDEX idx_audio_library_source ON audio_library(source);
CREATE INDEX idx_audio_library_user_id ON audio_library(user_id);
```

#### **audio_favorites**
```sql
CREATE TABLE audio_favorites (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  audio_id UUID REFERENCES audio_library(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, audio_id)
);
```

#### **avatars**
```sql
CREATE TABLE avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'neutral')),
  style VARCHAR(50),
  thumbnail_url TEXT NOT NULL,
  preview_url TEXT NOT NULL,
  video_url TEXT,
  source VARCHAR(50) NOT NULL CHECK (source IN ('stock', 'custom', 'generated')),
  is_premium BOOLEAN DEFAULT false,
  user_id UUID REFERENCES users(id),
  parent_avatar_id UUID REFERENCES avatars(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_avatars_gender ON avatars(gender);
CREATE INDEX idx_avatars_source ON avatars(source);
CREATE INDEX idx_avatars_user_id ON avatars(user_id);
```

#### **media_library**
```sql
CREATE TABLE media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'video', 'gif')),
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  source VARCHAR(50) NOT NULL CHECK (source IN ('stock', 'ai', 'uploaded')),
  category VARCHAR(100),
  tags TEXT[],
  dimensions JSONB,
  duration FLOAT,
  is_premium BOOLEAN DEFAULT false,
  user_id UUID REFERENCES users(id),
  ai_prompt TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_media_library_type ON media_library(type);
CREATE INDEX idx_media_library_source ON media_library(source);
CREATE INDEX idx_media_library_user_id ON media_library(user_id);
```

---

## 🔄 WebSocket Events (Real-time Updates)

For collaborative editing and live updates:

### Client → Server Events:

```javascript
// Scene updated
socket.emit('scene:update', {
  video_id: 'video-uuid',
  scene_id: 'scene-uuid',
  changes: { text: 'Updated text' }
})

// Layer updated
socket.emit('layer:update', {
  layer_id: 'layer-uuid',
  changes: { enabled: false }
})

// Layer reordered
socket.emit('layers:reorder', {
  scene_id: 'scene-uuid',
  layer_orders: [...]
})
```

### Server → Client Events:

```javascript
// Scene updated by another user
socket.on('scene:updated', (data) => {
  // Update local state
})

// Layer updated by another user
socket.on('layer:updated', (data) => {
  // Update local state
})

// Video regeneration completed
socket.on('video:regenerated', (data) => {
  // Refresh video player
})

// Video regeneration progress
socket.on('video:regeneration:progress', (data) => {
  // Update progress bar
})
```

---

## 🎬 Video Rendering Pipeline

### POST `/api/v1/videos/{videoId}/render`

**Purpose**: Trigger full video rendering with all scene edits

**Request Body**:
```json
{
  "quality": "1080p",
  "aspect_ratio": "16:9",
  "format": "mp4",
  "include_watermark": false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "job_id": "render-job-789",
    "estimated_time": 180,
    "queue_position": 3
  }
}
```

---

## 🧪 Testing Endpoints

All API endpoints should include:
- ✅ Unit tests for business logic
- ✅ Integration tests with database
- ✅ E2E tests for critical flows
- ✅ Load testing for scalability

---

## 📈 Performance Requirements

- **API Response Time**: < 500ms for GET requests
- **Audio/Voice Generation**: < 10 seconds
- **AI Image Generation**: < 60 seconds
- **Video Rendering**: < 5 minutes for 60-second video
- **Concurrent Users**: Support 1000+ simultaneous editors

---

## 🔒 Security Considerations

1. **Rate Limiting**: Implement per-user rate limits
2. **File Upload Validation**: Verify file types and sizes
3. **CORS**: Configure proper CORS headers
4. **Input Sanitization**: Prevent XSS and SQL injection
5. **Authorization**: Verify user owns resources before modification
6. **Encryption**: HTTPS for all API calls
7. **Token Expiration**: JWT tokens expire after 24 hours

---

## 📝 Implementation Priority

### Phase 6.1: Core Layer Management (Week 1)
- Scene and layer CRUD endpoints
- Layer visibility toggle API
- Layer reordering API

### Phase 6.2: Asset Libraries (Week 2)
- Audio library API
- Voice library API
- Avatar library API
- Media library API

### Phase 6.3: Asset Integration (Week 3)
- Audio upload/selection
- Voice generation
- Avatar selection
- Media upload/AI generation

### Phase 6.4: Video Regeneration (Week 4)
- Video rendering pipeline
- Progress tracking
- WebSocket real-time updates

### Phase 6.5: Optimization (Week 5)
- Caching strategies
- Performance optimization
- Load testing
- Documentation

---

## ✅ Acceptance Criteria

**Phase 6 Complete When**:
- [ ] All API endpoints implemented and tested
- [ ] Database schema created and migrated
- [ ] Integration tests passing
- [ ] Frontend successfully calls all APIs
- [ ] Video regeneration works end-to-end
- [ ] WebSocket real-time updates functional
- [ ] Performance targets met
- [ ] Security audit passed
- [ ] API documentation published

---

## 📚 Related Documentation

- [FLIKI_INTERACTIVE_SCENE_EDITOR_IMPLEMENTATION.md](./FLIKI_INTERACTIVE_SCENE_EDITOR_IMPLEMENTATION.md)
- [FLIKI_SCENE_EDITOR_PHASE_1-4_7_COMPLETE.md](./FLIKI_SCENE_EDITOR_PHASE_1-4_7_COMPLETE.md)
- [INTERACTIVE_SCENE_EDITOR_TESTING_GUIDE.md](./INTERACTIVE_SCENE_EDITOR_TESTING_GUIDE.md)

---

**Next Steps**: Begin Phase 6.1 implementation with scene and layer management endpoints.
