# Remaining Issues and Required Fixes

**Date**: 2025-11-04
**Status**: Issues identified from user feedback

---

## Critical Issues Identified

### 1. ❌ Templates Showing Static Images Instead of Videos

**Problem**:
- Template selection in wizard (Step 2) shows static image thumbnails
- User expects to see video previews/animations like Fliki

**Current Behavior**:
- Templates display as static `<img>` elements
- No video preview functionality

**Required Fix**:
- Replace static images with video previews using `<video>` elements
- Add autoplay, loop, and muted attributes for preview
- Fallback to image if video not available

**Files to Modify**:
- `frontend/components/wizard-steps/TemplateStep.tsx`

**Implementation**:
```typescript
// Instead of:
<img src={template.thumbnail} />

// Use:
<video
  autoPlay
  loop
  muted
  playsInline
  poster={template.thumbnail}
  className="w-full h-full object-cover"
>
  <source src={template.previewVideo} type="video/mp4" />
</video>
```

---

### 2. ❌ Video Generation Progress Page Not Implemented

**Problem**:
- No live progress page during video generation
- User shown Fliki.ai example with animated progress bar and status updates
- Currently users see basic "Processing..." text without live updates

**Current Behavior**:
- After clicking "Generate Script" in Styles step, script appears immediately
- After submitting video creation, user redirected to videos list
- No intermediate progress page showing video generation status

**Required Fix**:
- Create dedicated video generation progress page (like AsyncJobStatus but integrated into wizard)
- Show animated progress bar (0% → 100%)
- Display status messages: "Generating voiceover...", "Creating scenes...", "Rendering video..."
- Real-time updates every 2 seconds via polling
- Show estimated time remaining

**Files to Create/Modify**:
1. Create new component: `frontend/components/VideoGenerationProgress.tsx`
2. Modify: `frontend/app/dashboard/create/page.tsx` to redirect to progress page
3. Create page: `frontend/app/dashboard/videos/[id]/generate/page.tsx`

**User Flow**:
```
User completes wizard → Click "Generate Video"
    ↓
POST /api/v1/videos/generate → Get {video_id}
    ↓
Redirect to /dashboard/videos/{video_id}/generate
    ↓
Show VideoGenerationProgress component
    ↓
Poll GET /api/v1/jobs/{video_id} every 2 seconds
    ↓
Display live progress: 0% → 25% → 50% → 75% → 100%
    ↓
On success: Redirect to /dashboard/videos/{video_id} (video player page)
```

---

### 3. ❌ Non-English Video Generation Failing

**Problem**:
- Videos created in languages other than English are failing
- User's screenshot shows "failed" status for non-English video
- Console shows no specific error about language

**Possible Causes**:
1. **Voice provider not supporting language**: Azure voice name `en-US-Neural2-A` being used for all languages
2. **Missing language-specific voices**: Need to map language codes to appropriate voice IDs
3. **Script generation failing**: LLM may not support non-English script generation
4. **FFmpeg encoding issues**: Character encoding problems with non-ASCII text

**Required Investigation**:
- Check Celery worker logs for actual error messages
- Test with different languages (Nepali, Spanish, Japanese)
- Verify Azure/Google TTS supports requested language
- Check if script content is properly encoded

**Files to Check**:
1. `services/video-processing-service/app/services/voice_generator.py` - Voice mapping
2. `services/video-processing-service/app/services/video_processor.py` - Language handling
3. `services/video-processing-service/app/tasks/video_tasks.py` - Celery task error handling

**Required Fix**:
Add language-to-voice mapping:
```python
# app/services/voice_generator.py
LANGUAGE_VOICE_MAP = {
    'en': 'en-US-Neural2-A',
    'ne': 'ne-NP-Standard-A',  # Nepali voice
    'ja': 'ja-JP-Neural2-B',   # Japanese voice
    'es': 'es-ES-Neural2-A',   # Spanish voice
    # ... add all 110+ languages
}

def get_voice_for_language(language_code: str, voice_provider: str) -> str:
    """Get appropriate voice ID for language and provider"""
    if language_code not in LANGUAGE_VOICE_MAP:
        logger.warning(f"No voice mapping for language: {language_code}, using default")
        return 'en-US-Neural2-A'  # Fallback to English

    return LANGUAGE_VOICE_MAP[language_code]
```

---

### 4. ❌ Invalid Thumbnail URLs (Console Errors)

**Problem**:
Console shows multiple errors:
```
GET https://storage.example.com/thumbnails/vid_239805084abd.jpg net::ERR_NAME_NOT_RESOLVED
GET http://localhost:8012/api/v1/videos/vid_d03a310dcc9c/thumbnail 500 (Internal Server Error)
Not allowed to load local resource: file:///tmp/scriptsensei/videos/.../thumbnail.jpg
```

**Root Causes**:
1. **Placeholder URLs**: Backend returning `storage.example.com` URLs (placeholder, not real)
2. **Thumbnail endpoint failing**: Returns 500 error
3. **File:// URLs**: Browsers cannot access local file:// URLs

**Current Backend Code** (likely issue):
```python
# app/services/video_processor.py
video_response = VideoResponse(
    id=video_id,
    thumbnail_url=f"https://storage.example.com/thumbnails/{video_id}.jpg",  # ❌ Placeholder!
    # ...
)
```

**Required Fix - Backend**:
```python
# services/video-processing-service/app/api/videos.py
@router.get("/{video_id}/thumbnail")
async def get_video_thumbnail(video_id: str):
    """Serve video thumbnail"""
    video = video_processor.get_job_status(video_id)

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Get thumbnail path from video metadata
    thumbnail_path = video_processor.get_thumbnail_path(video_id)

    if not thumbnail_path or not os.path.exists(thumbnail_path):
        raise HTTPException(status_code=404, detail="Thumbnail not found")

    return FileResponse(
        thumbnail_path,
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=3600"}
    )
```

**Required Fix - Video Processor**:
```python
# app/services/video_processor.py
def create_video_job(self, request: VideoRequest) -> VideoResponse:
    # ...

    # Generate actual thumbnail URL that points to API endpoint
    thumbnail_url = f"http://localhost:8012/api/v1/videos/{video_id}/thumbnail"

    video_response = VideoResponse(
        id=video_id,
        thumbnail_url=thumbnail_url,  # ✅ Real endpoint
        # ...
    )
```

---

### 5. ⚠️ HTML Validation Error (Minor)

**Problem**:
```
Warning: In HTML, <button> cannot be a descendant of <button>.
This will cause a hydration error.
```

**Location**: `VoiceSelectionModal` component

**Current Structure** (incorrect):
```tsx
<button>  {/* Outer button */}
  <div>
    <button>  {/* Nested button - ❌ Invalid HTML! */}
      Voice option
    </button>
  </div>
</button>
```

**Required Fix**:
Change inner button to `<div>` with role="button":
```tsx
<button onClick={handleOuterClick}>
  <div>
    <div
      role="button"
      tabIndex={0}
      onClick={handleInnerClick}
      onKeyPress={handleInnerKeyPress}
    >
      Voice option
    </div>
  </div>
</button>
```

**File to Modify**:
- `frontend/components/VoiceSelectionModal.tsx`

---

## Summary of Required Work

### Backend Fixes (Python/FastAPI)

1. **Implement thumbnail endpoint properly**
   - File: `services/video-processing-service/app/api/videos.py`
   - Add route: `GET /api/v1/videos/{video_id}/thumbnail`
   - Serve actual thumbnail file with FileResponse

2. **Fix video generation for non-English languages**
   - File: `services/video-processing-service/app/services/voice_generator.py`
   - Add language-to-voice mapping for all 110+ languages
   - Handle missing languages gracefully with fallback

3. **Improve error logging**
   - File: `services/video-processing-service/app/tasks/video_tasks.py`
   - Add detailed error logging for video generation failures
   - Return specific error messages for debugging

4. **Fix thumbnail URL generation**
   - File: `services/video-processing-service/app/services/video_processor.py`
   - Replace placeholder `storage.example.com` URLs
   - Use local API endpoint URLs: `http://localhost:8012/api/v1/videos/{id}/thumbnail`

### Frontend Fixes (React/Next.js)

1. **Add video previews to templates**
   - File: `frontend/components/wizard-steps/TemplateStep.tsx`
   - Replace `<img>` with `<video autoPlay loop muted>`
   - Add video preview URLs to template data

2. **Create video generation progress page**
   - Create: `frontend/components/VideoGenerationProgress.tsx`
   - Create: `frontend/app/dashboard/videos/[id]/generate/page.tsx`
   - Implement live polling and progress display
   - Add animated progress bar like Fliki

3. **Fix redirect after video creation**
   - File: `frontend/app/dashboard/create/page.tsx`
   - Change redirect from `/dashboard/videos` to `/dashboard/videos/{id}/generate`
   - Show progress page instead of videos list

4. **Fix nested button in VoiceSelectionModal**
   - File: `frontend/components/VoiceSelectionModal.tsx`
   - Replace nested `<button>` with `<div role="button">`
   - Fix HTML validation error

---

## Priority Order

### High Priority (Blockers)
1. ✅ **Fix non-English video generation** - Users cannot create videos in other languages
2. ✅ **Implement video generation progress page** - Poor UX without live feedback
3. ✅ **Fix thumbnail endpoint** - Console errors affecting user experience

### Medium Priority (UX Improvements)
4. ⚠️ **Add video previews to templates** - Better template selection experience
5. ⚠️ **Fix nested button HTML error** - HTML validation and accessibility

### Low Priority (Polish)
6. ℹ️ Add loading states and transitions
7. ℹ️ Improve error messages
8. ℹ️ Add retry functionality for failed videos

---

## Testing Checklist

### After Backend Fixes
- [ ] Create video in English → Should succeed
- [ ] Create video in Nepali → Should succeed (not fail)
- [ ] Create video in Spanish → Should succeed
- [ ] Create video in Japanese → Should succeed
- [ ] Thumbnail endpoint returns 200 (not 500)
- [ ] Thumbnail displays in videos list
- [ ] No console errors for `storage.example.com`

### After Frontend Fixes
- [ ] Template selection shows video previews (not static images)
- [ ] Video generation redirects to progress page
- [ ] Progress page shows live updates (0% → 100%)
- [ ] Progress page polls every 2 seconds
- [ ] Status messages update in real-time
- [ ] Completed video redirects to player page
- [ ] No HTML validation errors in console

---

## Console Errors Explained

### 1. `storage.example.com` Errors
```
GET https://storage.example.com/thumbnails/vid_239805084abd.jpg net::ERR_NAME_NOT_RESOLVED
```
**Cause**: Backend returning placeholder URL instead of real thumbnail endpoint
**Fix**: Update backend to return `http://localhost:8012/api/v1/videos/{id}/thumbnail`

### 2. Thumbnail 500 Error
```
GET http://localhost:8012/api/v1/videos/vid_d03a310dcc9c/thumbnail 500 (Internal Server Error)
```
**Cause**: Thumbnail endpoint exists but crashes/fails
**Fix**: Implement proper error handling and file serving in backend

### 3. File:// URL Blocked
```
Not allowed to load local resource: file:///tmp/scriptsensei/videos/.../thumbnail.jpg
```
**Cause**: Browser security prevents loading local file:// URLs
**Fix**: Already fixed in AsyncJobStatus with URL transformation, but may need to apply to videos list

### 4. Nested Button Warning
```
Warning: In HTML, <button> cannot be a descendant of <button>.
```
**Cause**: Invalid HTML structure in VoiceSelectionModal
**Fix**: Replace inner `<button>` with `<div role="button">`

### 5. WebSocket Errors
```
WebSocket connection to 'ws://localhost:4000/_next/webpack-hmr' failed
Failed to fetch RSC payload
```
**Cause**: Next.js dev server hot reload issues (not critical)
**Fix**: Restart Next.js dev server if persistent

---

## Notes

- **Templates**: Current templates are placeholders - need real video template library
- **Voice Mapping**: Requires comprehensive research for 110+ language voice IDs across multiple providers (Azure, Google, ElevenLabs)
- **Progress Updates**: Backend needs to emit granular progress updates (not just "pending" → "success")
- **Error Messages**: Need language-specific error messages for better user experience

---

**Next Actions for Developer**:
1. Start with fixing non-English video generation (highest impact)
2. Implement proper thumbnail serving
3. Create video generation progress page
4. Add video previews to templates
5. Fix HTML validation error

**Estimated Effort**:
- Backend fixes: 4-6 hours
- Frontend progress page: 2-3 hours
- Video previews: 1-2 hours
- HTML fixes: 30 minutes
- **Total**: 8-12 hours of development work
