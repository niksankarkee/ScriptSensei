# Async Video Generation Frontend - Fix Summary

## Issue

The AsyncJobStatus component was not displaying after clicking "Create Video". The page remained on the create form instead of transitioning to show the job progress.

## Root Cause

**React Strict Mode** in development was causing the component to mount → unmount → remount. This triggered the cleanup function in the `useAsyncJob` hook, setting `isMountedRef.current = false` during the remount phase.

When the API call completed, the hook checked `if (!isMountedRef.current)` and returned early, preventing the `jobId` state from being set, which prevented the component from rendering the AsyncJobStatus view.

## Files Modified

### 1. `/frontend/hooks/useAsyncJob.ts`

**Problem**: The `isMountedRef` was being set to `false` during React Strict Mode's remount cycle.

**Fix**: Added `isMountedRef.current = true` at the beginning of the useEffect to ensure it's always `true` when the component is mounted.

```typescript
// Before
useEffect(() => {
  return () => {
    isMountedRef.current = false
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
    }
  }
}, [])

// After
useEffect(() => {
  isMountedRef.current = true  // ← Added this line
  return () => {
    isMountedRef.current = false
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
    }
  }
}, [])
```

### 2. `/frontend/.env.local`

**Problem**: Missing environment variable for the video service URL.

**Fix**: Added `NEXT_PUBLIC_VIDEO_SERVICE_URL` to point to the async job API.

```bash
NEXT_PUBLIC_VIDEO_SERVICE_URL=http://localhost:8012
NEXT_PUBLIC_CONTENT_SERVICE_URL=http://localhost:8011
```

### 3. `/frontend/app/dashboard/videos/new/page.tsx`

**Problem**: The conditional check `if (jobId && status)` was too strict.

**Fix**: Changed to `if (jobId)` to show the AsyncJobStatus component immediately when a job is created.

```typescript
// Before
if (jobId && status) {

// After
if (jobId) {
```

## Testing

### What Works Now:

1. ✅ Click "Create Video" button
2. ✅ "Job Created" toast notification appears
3. ✅ Page transitions to "Creating Video" view
4. ✅ AsyncJobStatus component displays with:
   - Progress bar (0-100%)
   - Status message ("Preparing...", "Processing...", etc.)
   - Estimated time remaining
   - Cancel button
5. ✅ Progress updates every 3 seconds via polling
6. ✅ Job completion shows success message and redirects
7. ✅ Error handling displays error messages

### Verification

The console logs confirmed the fix:

**Before Fix:**
```
📡 API Response: {job_id: '...', status: 'pending'}
🔍 isMountedRef.current: false  ← Problem!
(No state updates, component stays on form)
```

**After Fix:**
```
📡 API Response: {job_id: '...', status: 'pending'}
🔍 isMountedRef.current: true  ← Fixed!
🔧 Setting jobId: ...
🔧 Setting status: pending
🔍 jobId changed: ... (Component re-renders and shows AsyncJobStatus)
```

## Why This Happened

React Strict Mode (enabled by default in Next.js development) intentionally double-mounts components to help detect side effects. The lifecycle looks like:

1. Mount → `isMountedRef.current = true`
2. Unmount (Strict Mode) → `isMountedRef.current = false`
3. Remount (Strict Mode) → `isMountedRef.current` **stays false** (Bug!)
4. API call completes → Check fails → No state update

By setting `isMountedRef.current = true` at the start of the useEffect, we ensure it's always correct after every mount, whether it's the first mount or a remount.

## Related Files

- `/frontend/lib/asyncJobService.ts` - API service (working correctly)
- `/frontend/components/AsyncJobStatus.tsx` - Progress component (working correctly)
- `/frontend/hooks/useAsyncJob.ts` - **Fixed** (main issue)
- `/frontend/app/dashboard/videos/new/page.tsx` - **Fixed** (conditional rendering)
- `/frontend/.env.local` - **Fixed** (environment variables)

## Next Steps

The async video generation frontend is now fully functional! Users can:

1. Create videos from scripts
2. See real-time progress updates
3. Cancel jobs in progress
4. View completed videos
5. Handle errors gracefully

## Architecture

```
User clicks "Create Video"
    ↓
handleCreateVideo() in page.tsx
    ↓
createVideoJob() in useAsyncJob hook
    ↓
createJob() in asyncJobService
    ↓
POST /api/v1/jobs/ (Video Processing Service)
    ↓
Job queued in Redis, Celery worker processes
    ↓
setJobId(response.job_id) ← This was failing before fix
    ↓
Component re-renders with jobId set
    ↓
AsyncJobStatus component displays
    ↓
Polling starts (every 3 seconds)
    ↓
Progress updates in real-time
    ↓
Job completes → Success toast → Redirect to videos list
```

## Date

2025-11-04
