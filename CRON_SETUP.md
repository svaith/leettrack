# 10:00 PM Profile Refresh Setup

LeetTrack automatically refreshes all user profiles at exactly 10:00 PM every day to keep statistics up-to-date. This document explains how to set up the daily refresh cron job.

## How It Works

1. The system has a secure API endpoint at `/api/cron/refresh-profiles` that refreshes all user profiles
2. This endpoint should be called at 10:00 PM daily via a scheduled job
3. The endpoint will only process requests that arrive between 10:00 PM and 10:05 PM (to account for timing variations)
4. All user profiles are updated in a single batch operation

## Setup Options

### Option 1: Vercel Cron Jobs (Recommended)

If deploying on Vercel, add this to your `vercel.json` file:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-profiles",
      "schedule": "0 22 * * *"
    }
  ]
}
```

This will run the refresh job every day at 10:00 PM UTC.

### Option 2: External Cron Service

You can use an external service like [Cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com) to call your endpoint daily:

1. Set up a POST request to `https://your-domain.com/api/cron/refresh-profiles`
2. Add an Authorization header: `Bearer YOUR_CRON_SECRET`
3. Schedule it to run at 10:00 PM in your desired timezone

### Environment Variables

Add this to your `.env.local` file and to your deployment environment:

```
CRON_SECRET=your-secure-random-string
```

This secret protects your endpoint from unauthorized access.

## Manual Triggering

For testing purposes, you can manually trigger the refresh by sending a POST request with:
- Authorization header: `Bearer YOUR_CRON_SECRET`
- x-manual-trigger header: `true`

This bypasses the time check and allows refreshing profiles at any time.

## Monitoring

The cron endpoint returns a JSON response with:
- Number of profiles successfully refreshed
- Number of profiles that failed to refresh
- Current server time

You can set up monitoring to alert you if the job fails or if too many profile refreshes are failing.