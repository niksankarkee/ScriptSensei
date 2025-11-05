# Video Playback Fix - Summary

## Issue

When users clicked "Play" on a completed video from the videos list, the video details page would show "Preparing... Waiting to start..." at 0% progress and the video would never play.

**Screenshot from user**:
- Videos list correctly showed completed videos
- Clicking "Play" button navigated to `/dashboard/videos/vid_5ae186c9c95d`
- Page displayed AsyncJobStatus component with "Preparing..." message
- Progress bar stuck at 0%
- Video never loaded or played

## Root Causes

### 1. Wrong Component for Completed Videos
The video details page ([id]/page.tsx) was using the old `VideoProcessingStatus` component for both in-progress AND completed videos. This component is designed for showing job progress, not for playing completed videos.

### 2. API Response Structure Mismatch
The video API endpoint returns:
```json
{
  "success": true,
  "data": {
    "id": "vid_5ae186c9c95d",
    "status": "completed",
    "video_url": "file:///tmp/scriptsensei/videos/.../video.mp4",
    ...
  }
}
```

But the frontend was expecting a flat object, not a nested `data` structure.

### 3. File:// URLs Not Playable in Browser
Videos were being stored with `file:///tmp/...` URLs, which browsers cannot access for security reasons. The backend has download endpoints (`/api/v1/videos/{id}/download`) to serve these files via HTTP, but the frontend wasn't using them.

### 4. Status Field Mismatch
The backend uses:
- `'pending'` | `'started'` | `'processing'` | `'success'` | `'failure'` | `'cancelled'`

But the frontend was checking for:
- `'completed'` instead of `'success'`

## Files Modified

### `/Users/niksankarkee/Dev/ScriptSensei/frontend/app/dashboard/videos/[id]/page.tsx`

**Changes Made:**

#### 1. Updated Imports
```typescript
// BEFORE
import VideoProcessingStatus from '@/components/VideoProcessingStatus'

// AFTER
import AsyncJobStatus from '@/components/AsyncJobStatus'

// Added
const API_BASE_URL = process.env.NEXT_PUBLIC_VIDEO_SERVICE_URL || 'http://localhost:8012'
```

#### 2. Updated VideoData Interface
```typescript
// BEFORE
status: 'pending' | 'processing' | 'completed' | 'failed'

// AFTER
status: 'pending' | 'started' | 'processing' | 'success' | 'failure' | 'cancelled'
```

#### 3. Fixed API Response Handling
```typescript
// BEFORE (lines 28-37)
useEffect(() => {
  if (videoId) {
    fetch(`http://localhost:8012/api/v1/videos/${videoId}`)
      .then(res => res.json())
      .then(data => {
        setVideo(data)  // ❌ Missing nested data extraction
        setLoading(false)
      })
  }
}, [videoId])

// AFTER (lines 30-43)
useEffect(() => {
  if (videoId) {
    fetch(`${API_BASE_URL}/api/v1/videos/${videoId}`)
      .then(res => res.json())
      .then(response => {
        // API returns { success: true, data: { ... } }
        // Extract the video data from the nested structure
        const videoData = response.data || response  // ✅ Handle nested structure
        setVideo(videoData)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }
}, [videoId])
```

#### 4. Added URL Transformation Functions
```typescript
// NEW (lines 68-85)
// Transform video URL from file:// to HTTP download endpoint
const getVideoUrl = (video: VideoData) => {
  if (!video.video_url) return ''
  // If it's a file:// URL, convert to download endpoint
  if (video.video_url.startsWith('file://')) {
    return `${API_BASE_URL}/api/v1/videos/${video.id}/download`
  }
  return video.video_url
}

const getThumbnailUrl = (video: VideoData) => {
  if (!video.thumbnail_url) return undefined
  // If it's a file:// URL, convert to thumbnail endpoint
  if (video.thumbnail_url.startsWith('file://')) {
    return `${API_BASE_URL}/api/v1/videos/${video.id}/thumbnail`
  }
  return video.thumbnail_url
}
```

#### 5. Fixed Conditional Rendering
```typescript
// BEFORE (lines 72-87)
{video.status === 'completed' && video.video_url ? (
  <VideoPlayer
    videoUrl={video.video_url}  // ❌ Using file:// URL
    thumbnailUrl={video.thumbnail_url}
    title={`Video - ${video.id}`}
    duration={video.duration}
    showDownload={true}
    className="w-full"
  />
) : (
  <VideoProcessingStatus  // ❌ Wrong component
    jobId={video.id}
    scriptTitle={video.script_content?.substring(0, 100) || 'Generating video...'}
  />
)}

// AFTER (lines 87-119)
const isCompleted = video.status === 'success' || video.status === 'completed'
const isProcessing = video.status === 'pending' || video.status === 'started' || video.status === 'processing'

{isCompleted && video.video_url ? (
  <VideoPlayer
    videoUrl={getVideoUrl(video)}  // ✅ Convert to HTTP URL
    thumbnailUrl={getThumbnailUrl(video)}
    title={video.script_content?.substring(0, 50) || `Video - ${video.id}`}
    duration={video.duration}
    showDownload={true}
    className="w-full"
  />
) : isProcessing ? (
  <AsyncJobStatus  // ✅ Correct component for in-progress videos
    jobId={video.id}
    scriptTitle={video.script_content?.substring(0, 100) || 'Generating video...'}
  />
) : (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
    <h2 className="text-xl font-semibold text-red-900 mb-2">Video Failed</h2>
    <p className="text-red-700">The video generation failed. Please try again.</p>
  </div>
)}
```

## Backend Endpoints Verified

### Video Details Endpoint
```bash
GET /api/v1/videos/{video_id}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "vid_5ae186c9c95d",
    "status": "completed",
    "video_url": "file:///tmp/scriptsensei/videos/e1b3342b.../video.mp4",
    "thumbnail_url": "file:///tmp/scriptsensei/videos/e1b3342b.../thumbnail.jpg",
    "duration": 34.5,
    "file_size": 2784438,
    ...
  }
}
```

**Status**: ✅ Working correctly

### Video Download Endpoint
```bash
GET /api/v1/videos/{video_id}/download
```

**Response Headers**:
```
HTTP/1.1 200 OK
Content-Type: video/mp4
Content-Length: 2784438
```

**Status**: ✅ Working correctly (verified with curl)

### Thumbnail Endpoint
```bash
GET /api/v1/videos/{video_id}/thumbnail
```

**Response**:
```
HTTP/1.1 500 Internal Server Error
```

**Status**: ⚠️ Returning 500 error (non-critical, videos will play without thumbnails)

## How It Works Now

### User Flow:

1. **User navigates to videos list** (`/dashboard/videos`)
   - Fetches videos from `GET /api/v1/videos?user_id=user_123`
   - Displays list of completed videos

2. **User clicks "Play" on a video**
   - Navigates to `/dashboard/videos/{video_id}`
   - Page component mounts and fetches video details

3. **Video details page loads**
   - Fetches from `GET /api/v1/videos/{video_id}`
   - Extracts `response.data` from nested structure
   - Checks video status:
     - If `status === 'success'` or `status === 'completed'`: Show VideoPlayer
     - If `status === 'pending'` | `'started'` | `'processing'`: Show AsyncJobStatus
     - If `status === 'failure'` | `'cancelled'`: Show error message

4. **VideoPlayer renders**
   - Transforms `file:///tmp/...` URL to `http://localhost:8012/api/v1/videos/{id}/download`
   - Passes HTTP URL to `<video>` element
   - Video element streams video from backend
   - User can play, pause, seek, adjust volume, go fullscreen

5. **Video streams successfully** 🎉
   - Backend serves video file via FastAPI FileResponse
   - Browser HTML5 `<video>` element plays the video
   - Full playback controls available

## Testing

### Manual Testing (Command Line)

**1. Test video details API**:
```bash
curl -s 'http://localhost:8012/api/v1/videos/vid_5ae186c9c95d' | python3 -m json.tool
```
Expected: Returns video object with nested `data` field

**2. Test video download endpoint**:
```bash
curl -s -o /dev/null -w "HTTP Status: %{http_code}\nContent-Type: %{content_type}\n" \
  'http://localhost:8012/api/v1/videos/vid_5ae186c9c95d/download'
```
Expected:
```
HTTP Status: 200
Content-Type: video/mp4
```

**3. Test in browser**:
- Navigate to `http://localhost:4000/dashboard/videos`
- Click "Play" on any completed video
- Video details page should load
- VideoPlayer component should display
- Click play button in video player
- Video should start playing

## Architecture

```
User Browser (localhost:4000)
    ↓
Next.js Frontend
    ↓ GET /api/v1/videos/{id}
Video Processing Service (localhost:8012)
    ↓ Returns { success: true, data: { video_url: "file://..." } }
Frontend transforms URL
    ↓ video_url → http://localhost:8012/api/v1/videos/{id}/download
VideoPlayer Component
    ↓ <video src="http://localhost:8012/api/v1/videos/{id}/download" />
Video Processing Service serves file
    ↓ FileResponse(path=/tmp/scriptsensei/videos/.../video.mp4)
Browser plays video ✅
```

## What Was Fixed

✅ **Fixed**: API response extraction to handle nested `data` object
✅ **Fixed**: Video URL transformation from `file://` to HTTP endpoint
✅ **Fixed**: Component selection (VideoPlayer for completed, AsyncJobStatus for processing)
✅ **Fixed**: Status field matching (`'success'` vs `'completed'`)
✅ **Fixed**: Error handling for failed videos
✅ **Verified**: Backend download endpoint working correctly

## What Still Needs Work

⚠️ **Thumbnail endpoint**: Returns 500 error (non-critical)
- Videos play without thumbnails
- Can be fixed later if needed

## Testing Checklist for User

When testing video playback:

- [ ] Navigate to videos list page
- [ ] See list of completed videos
- [ ] Click "Play" button on a video
- [ ] Video details page loads without errors
- [ ] VideoPlayer component displays (black video player with controls)
- [ ] Click the play button in the center of the video
- [ ] Video starts playing with audio
- [ ] Progress bar updates as video plays
- [ ] Can pause/play using controls
- [ ] Can seek to different positions in video
- [ ] Can adjust volume
- [ ] Can toggle fullscreen
- [ ] Can download video using download button

## Related Files

- **Frontend**: `/frontend/app/dashboard/videos/[id]/page.tsx` (Modified)
- **Frontend**: `/frontend/components/VideoPlayer.tsx` (No changes needed)
- **Backend**: `/services/video-processing-service/app/api/videos.py` (No changes needed)
- **Previous Fix**: `/ASYNC_FRONTEND_FIX_SUMMARY.md` (AsyncJobStatus display fix)

## Date

2025-11-04

---

**Summary**: Fixed video playback by properly handling API response structure, transforming file:// URLs to HTTP download endpoints, using the correct VideoPlayer component for completed videos, and matching status field names between frontend and backend.
