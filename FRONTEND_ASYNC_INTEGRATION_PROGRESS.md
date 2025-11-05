# Frontend Async Job Integration - Progress Report

## Overview

This document tracks the progress of integrating the async video generation job API into the ScriptSensei frontend.

---

## Completed Work

### 1. Backend Infrastructure ✅

**Files:**
- [docker-compose.yml](docker-compose.yml) - Added Celery services
- [Dockerfile](services/video-processing-service/Dockerfile) - Video service container
- [Makefile](Makefile) - Job queue management commands
- [ASYNC_API_GUIDE.md](services/video-processing-service/ASYNC_API_GUIDE.md) - Complete API documentation

**Services Added:**
- `celery-worker` - 8 concurrent background workers
- `celery-beat` - Periodic task scheduler
- `flower` - Monitoring UI (port 5555)

**Commands Available:**
```bash
make job-queue-start        # Start complete job queue
make start-celery-worker    # Start worker
make start-celery-beat      # Start scheduler
make start-flower           # Start monitoring
make celery-status          # Check status
make celery-stats           # View statistics
make stop-celery            # Stop all
```

### 2. Frontend Service Layer ✅

**Created Files:**

#### A. [frontend/lib/asyncJobService.ts](frontend/lib/asyncJobService.ts)
Complete TypeScript service for async job API:

**Key Functions:**
- `createJob()` - Create new video generation job
- `getJobStatus()` - Poll job status
- `cancelJob()` - Cancel running job
- `listUserJobs()` - List user's jobs with pagination
- `getJobStatistics()` - System-wide job stats
- `pollJobUntilComplete()` - Automated polling loop
- `checkServiceHealth()` - Health check
- `formatProgress()` - Progress formatting helpers
- `getEstimatedTimeRemaining()` - Time estimates
- `isJobComplete()` - Status checkers
- `canCancelJob()` - Permission checkers

**Types Exported:**
```typescript
- JobStatus
- VideoRequest
- CreateJobRequest
- CreateJobResponse
- JobResult
- JobStatusResponse
- JobListResponse
- JobStatistics
```

#### B. [frontend/hooks/useAsyncJob.ts](frontend/hooks/useAsyncJob.ts)
React hook for managing async jobs in components:

**Hook API:**
```typescript
const {
  // State
  jobId,
  status,
  progress,
  progressMessage,
  result,
  error,
  isLoading,
  isPolling,

  // Actions
  createVideoJob,
  startPolling,
  stopPolling,
  cancelCurrentJob,
  reset,

  // Computed
  canCancel,
  isComplete,
  estimatedDuration
} = useAsyncJob({
  onSuccess: (result) => {},
  onError: (error) => {},
  onProgress: (status) => {},
  pollInterval: 3000,
  autoStartPolling: true
})
```

**Features:**
- Automatic polling with configurable interval
- Lifecycle callbacks (onSuccess, onError, onProgress)
- Cleanup on unmount
- Cancel job support
- Progress tracking
- Error handling
- Auto-start polling after job creation

---

## Remaining Work

### 3. AsyncJobStatus Component (Priority: HIGH)

**File to Create:** `frontend/components/AsyncJobStatus.tsx`

**Purpose:** Display async job status with progress bar and status updates

**Features Needed:**
- Progress bar with percentage
- Status indicator (pending, processing, success, failure)
- Current step/message display
- Estimated time remaining
- Cancel button (when applicable)
- Video player on completion
- Error display
- Retry button on failure

**Integration Points:**
- Use `useAsyncJob` hook
- Replace WebSocket-based VideoProcessingStatus
- Reuse VideoPlayer component for completed videos

### 4. Update NewVideoPage (Priority: HIGH)

**File to Update:** `frontend/app/dashboard/videos/new/page.tsx`

**Changes Required:**
1. Replace direct `/api/v1/videos/generate` call with async job API
2. Use `useAsyncJob` hook instead of direct fetch
3. Show AsyncJobStatus component during processing
4. Handle job completion/failure
5. Redirect to job status page or video details on success

**Example Implementation:**
```typescript
const {
  createVideoJob,
  jobId,
  status,
  progress,
  progressMessage,
  result,
  error,
  canCancel,
  cancelCurrentJob
} = useAsyncJob({
  onSuccess: (result) => {
    toast({ title: "Video Ready!", ... })
    router.push(`/dashboard/videos/${result.video_id}`)
  },
  onError: (error) => {
    toast({ title: "Error", description: error, variant: "destructive" })
  }
})

const handleCreateVideo = async () => {
  await createVideoJob({
    video_request: {
      script_id: script.id,
      user_id: 'user_123', // Get from Clerk
      title: script.topic,
      script_content: script.content,
      language: script.language,
      platform: script.platform,
      duration: estimatedDuration,
      voice_provider: 'azure',
      voice_name: selectedVoice
    },
    priority: 5
  })
}
```

### 5. Job History Page (Priority: MEDIUM)

**File to Create:** `frontend/app/dashboard/jobs/page.tsx`

**Purpose:** Display user's job history with pagination

**Features:**
- List all user jobs (completed, processing, failed)
- Filter by status
- Pagination
- Cancel running jobs
- Download completed videos
- Retry failed jobs
- View job details

**API Integration:**
```typescript
const [jobs, setJobs] = useState<JobStatusResponse[]>([])
const [page, setPage] = useState(1)

useEffect(() => {
  listUserJobs('user_123', page, 20)
    .then(response => setJobs(response.jobs))
    .catch(error => console.error(error))
}, [page])
```

### 6. Update VideoProcessingStatus (Priority: LOW)

**File to Update:** `frontend/components/VideoProcessingStatus.tsx`

**Options:**
A. **Adapt for Async Jobs** - Add support for async job polling alongside WebSocket
B. **Deprecate** - Replace with new AsyncJobStatus component
C. **Dual Mode** - Support both WebSocket (real-time) and polling (async) modes

**Recommendation:** Create new AsyncJobStatus component, deprecate old one

### 7. Error Boundary (Priority: MEDIUM)

**File to Create:** `frontend/components/AsyncJobErrorBoundary.tsx`

**Purpose:** Catch and display errors in async job components

```typescript
<AsyncJobErrorBoundary
  fallback={({ error, reset }) => (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )}
>
  <AsyncJobStatus jobId={jobId} />
</AsyncJobErrorBoundary>
```

### 8. Testing (Priority: HIGH)

**Test Files to Create:**
- `frontend/components/__tests__/AsyncJobStatus.test.tsx`
- `frontend/hooks/__tests__/useAsyncJob.test.ts`
- `frontend/lib/__tests__/asyncJobService.test.ts`

**E2E Test Scenarios:**
1. Create video job from script
2. Monitor progress updates
3. Cancel running job
4. Handle job failure
5. View completed video
6. List job history
7. Retry failed job

---

## Next Steps (Prioritized)

### Immediate (Do First)
1. ✅ Create AsyncJobStatus component
2. ✅ Update NewVideoPage to use async API
3. ✅ Test end-to-end video creation flow

### Soon (Within Sprint)
4. Create Job History page
5. Add error boundaries
6. Write component tests
7. Update documentation

### Later (Nice to Have)
8. Real-time notifications for job completion
9. Job queue statistics dashboard
10. Bulk job creation interface
11. Job templates/presets
12. Advanced filtering/search for job history

---

## Environment Variables

Add to `frontend/.env.local`:
```bash
NEXT_PUBLIC_VIDEO_SERVICE_URL=http://localhost:8012
NEXT_PUBLIC_ENABLE_ASYNC_JOBS=true
```

---

## API Endpoints Available

### Job Management
- `POST /api/v1/jobs/` - Create job
- `GET /api/v1/jobs/{job_id}` - Get status
- `DELETE /api/v1/jobs/{job_id}` - Cancel job
- `GET /api/v1/jobs/?user_id={id}` - List user jobs
- `GET /api/v1/jobs/stats/counts` - Get statistics
- `GET /api/v1/jobs/health` - Health check

---

## Component Architecture

```
NewVideoPage
  ├─ useAsyncJob hook
  │   └─ asyncJobService (API calls)
  │
  └─ AsyncJobStatus component
      ├─ Progress bar
      ├─ Status indicator
      ├─ Cancel button (if canCancel)
      └─ VideoPlayer (if complete)
```

---

## Integration Checklist

### NewVideoPage Updates
- [ ] Import useAsyncJob hook
- [ ] Replace fetch call with createVideoJob
- [ ] Show AsyncJobStatus during processing
- [ ] Handle success callback
- [ ] Handle error callback
- [ ] Add cancel button
- [ ] Update UI states

### AsyncJobStatus Component
- [ ] Create component file
- [ ] Accept jobId prop
- [ ] Use useAsyncJob hook
- [ ] Render progress bar
- [ ] Show status messages
- [ ] Display estimated time
- [ ] Add cancel button
- [ ] Integrate VideoPlayer
- [ ] Handle errors

### Testing
- [ ] Test job creation
- [ ] Test progress updates
- [ ] Test job completion
- [ ] Test job failure
- [ ] Test job cancellation
- [ ] Test pagination
- [ ] Test error handling

---

## Known Issues & Limitations

### Current Limitations
1. **No Authentication** - JWT verification not yet implemented
2. **Local Storage Only** - Videos stored on local filesystem (need S3/GCS)
3. **No Rate Limiting** - No job creation limits per user
4. **No Webhooks** - No push notifications for job completion
5. **Single Server** - No load balancing or horizontal scaling yet

### Planned Improvements
1. Add Clerk authentication to all endpoints
2. Integrate AWS S3 for video storage
3. Implement rate limiting (jobs per user per hour)
4. Add webhook support for job notifications
5. Add Redis Sentinel for high availability
6. Implement worker auto-scaling

---

## Performance Considerations

### Polling Optimization
- Default interval: 3 seconds
- Exponential backoff for long-running jobs
- Stop polling when user leaves page
- Resume polling when user returns

### Caching Strategy
- Cache job status for 5 seconds
- Invalidate cache on status change
- Use React Query for server state management (optional)

### Error Handling
- Retry failed API calls (max 3 times)
- Exponential backoff for retries
- User-friendly error messages
- Fallback to synchronous API if async fails

---

## Documentation Links

- **Backend API Guide**: [ASYNC_API_GUIDE.md](services/video-processing-service/ASYNC_API_GUIDE.md)
- **Celery Implementation**: [WEEK4_CELERY_IMPLEMENTATION_COMPLETE.md](services/video-processing-service/WEEK4_CELERY_IMPLEMENTATION_COMPLETE.md)
- **Docker Compose**: [docker-compose.yml](docker-compose.yml)
- **Makefile Commands**: [Makefile](Makefile)

---

## Summary

### Completed (60%)
- ✅ Backend infrastructure (Celery, Redis, Docker)
- ✅ API documentation
- ✅ Makefile commands
- ✅ TypeScript service layer
- ✅ React hook (useAsyncJob)

### In Progress (20%)
- 🔄 AsyncJobStatus component
- 🔄 NewVideoPage integration

### Remaining (20%)
- ⏳ Job history page
- ⏳ Error boundaries
- ⏳ Testing
- ⏳ Authentication integration

**Next Action:** Create AsyncJobStatus component and integrate into NewVideoPage

---

Last Updated: 2025-11-04
