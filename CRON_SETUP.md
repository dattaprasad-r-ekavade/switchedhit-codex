# Cron Webhook Configuration Guide

This document explains how to set up automated scheduled tasks (cron jobs) for the SwitchedHit platform using external webhook services. Since the application runs on serverless infrastructure (Vercel), traditional cron jobs won't work, so we use external services to trigger webhooks on a schedule.

## Available Webhook Endpoints

### 1. Timeline Advancement
**Endpoint:** `POST /api/cron/advance-timeline`  
**Purpose:** Advances the game timeline by 1 day (or more), triggers player aging, retirements, and youth replacements  
**Recommended Schedule:** Daily at midnight (00:00 UTC)  
**Cron Expression:** `0 0 * * *`

---

## Authentication

All webhook endpoints require authentication via a Bearer token:

```bash
Authorization: Bearer YOUR_CRON_SECRET
```

### Setting Up Authentication

1. **Generate a secure secret:**
   ```bash
   # On Linux/Mac:
   openssl rand -base64 32
   
   # On Windows (PowerShell):
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
   ```

2. **Add to environment variables:**
   - **Local:** Add `CRON_SECRET=your-secret-here` to `.env`
   - **Production (Vercel):** Add in Project Settings → Environment Variables

---

## Recommended Cron Services

### Option 1: cron-job.org (Recommended - Free & Reliable)

**Website:** https://cron-job.org

**Setup Instructions:**

1. **Create a free account** at cron-job.org
2. **Create a new cron job** with these settings:
   - **Title:** `SwitchedHit - Daily Timeline`
   - **URL:** `https://your-app-domain.vercel.app/api/cron/advance-timeline`
   - **Request Method:** POST
   - **Schedule:** `0 0 * * *` (Daily at midnight UTC)
   - **Request Headers:**
     ```
     Authorization: Bearer YOUR_CRON_SECRET
     Content-Type: application/json
     ```
   - **Request Body:** `{}`
   - **Enable Notifications:** ✅ (recommended for failure alerts)

3. **Test the job** using the "Execute now" button

**Pros:**
- Free tier is generous
- Reliable execution
- Email notifications on failures
- Execution history and logs
- No credit card required

**Cons:**
- External dependency
- Requires account creation

---

### Option 2: GitHub Actions (Free & No External Service)

**Setup Instructions:**

1. **Create `.github/workflows/daily-timeline.yml`** in your repository:

```yaml
name: Daily Timeline Advancement

on:
  schedule:
    # Runs daily at 00:00 UTC
    - cron: '0 0 * * *'
  workflow_dispatch:  # Allows manual triggering from GitHub UI

jobs:
  advance-timeline:
    runs-on: ubuntu-latest
    steps:
      - name: Advance Game Timeline
        run: |
          curl -X POST https://your-app-domain.vercel.app/api/cron/advance-timeline \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            -d '{}' \
            --fail-with-body
```

2. **Add CRON_SECRET to GitHub Secrets:**
   - Go to your repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `CRON_SECRET`
   - Value: Your cron secret (same as in Vercel)

3. **Update the URL** in the workflow file to your actual Vercel domain

**Pros:**
- Free on public and private repos
- No external service needed
- Integrated with your repository
- Can manually trigger from GitHub UI
- Execution logs in Actions tab

**Cons:**
- Requires GitHub account
- Minimum interval is 5 minutes (not an issue for daily jobs)
- May experience slight delays during GitHub's peak times

---

### Option 3: EasyCron (Alternative)

**Website:** https://www.easycron.com

**Setup Instructions:**

1. Create a free account
2. Add a new cron job:
   - **URL:** `https://your-app-domain.vercel.app/api/cron/advance-timeline`
   - **When to execute:** Daily at 00:00
   - **HTTP Method:** POST
   - **HTTP Headers:**
     ```
     Authorization: Bearer YOUR_CRON_SECRET
     Content-Type: application/json
     ```

**Pros:**
- Simple interface
- Free tier available

**Cons:**
- Free tier limited to 1 cron job
- Requires account

---

### Option 4: Vercel Cron Jobs (Paid Plans Only)

**Note:** Only available on Vercel Pro, Enterprise plans, and for Hobby plan production deployments.

**Setup Instructions:**

1. **Create `vercel.json`** in project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/advance-timeline",
      "schedule": "0 0 * * *"
    }
  ]
}
```

2. Deploy to Vercel - the cron job will be automatically configured

**Pros:**
- Native Vercel integration
- No external service needed
- Reliable execution

**Cons:**
- Requires paid plan (or production deployment on Hobby)
- Limited to specific schedule formats

---

## Testing Your Webhook

### Manual Test with cURL

```bash
curl -X POST https://your-app-domain.vercel.app/api/cron/advance-timeline \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
```json
{
  "success": true,
  "gameTime": {
    "currentDate": "2025-03-02T00:00:00.000Z",
    "currentSeason": "2025-26",
    "dayNumber": 1,
    "weekNumber": 0
  },
  "advanced": 1,
  "message": "Timeline advanced by 1 day(s)"
}
```

### Health Check

```bash
curl -X GET https://your-app-domain.vercel.app/api/cron/advance-timeline \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected Response:**
```json
{
  "status": "ready",
  "endpoint": "/api/cron/advance-timeline",
  "message": "Cron webhook is configured correctly"
}
```

---

## Advanced Usage

### Advance Multiple Days

You can advance the timeline by multiple days in a single request:

```bash
curl -X POST https://your-app-domain.vercel.app/api/cron/advance-timeline \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"days": 7}'
```

This is useful for:
- Testing aging mechanics
- Catching up after downtime
- Seasonal simulations

---

## Monitoring & Troubleshooting

### Check Vercel Function Logs

1. Go to your Vercel dashboard
2. Select your project
3. Click on "Functions" tab
4. Find `/api/cron/advance-timeline` executions
5. Review logs for errors

### Common Issues

**401 Unauthorized:**
- Check that `CRON_SECRET` is set correctly in Vercel environment variables
- Verify the Authorization header format: `Bearer YOUR_SECRET`
- Ensure no extra spaces or newlines in the secret

**500 Server Error:**
- Check Vercel function logs for detailed error messages
- Verify database connection is working
- Check if Prisma client is generated

**Timeout:**
- Player aging for large rosters may take time
- Consider increasing `maxDuration` in the route file (Pro plan required)
- Check if database is responding

### Monitoring Best Practices

1. **Enable notifications** in your cron service (e.g., cron-job.org email alerts)
2. **Set up monitoring** using Vercel's built-in analytics
3. **Check execution history** regularly in your cron service dashboard
4. **Review game timeline** in admin dashboard to ensure it's advancing correctly

---

## Security Best Practices

1. ✅ Use a strong, randomly generated `CRON_SECRET` (32+ characters)
2. ✅ Never commit secrets to Git (use `.env` and `.env.example`)
3. ✅ Rotate secrets periodically (every 90 days recommended)
4. ✅ Monitor webhook access logs for suspicious activity
5. ✅ Use HTTPS for all webhook URLs
6. ✅ Set up IP allowlisting if your cron service supports it

---

## Quick Reference Table

| Cron Task | Endpoint | Schedule | Cron Expression |
|-----------|----------|----------|-----------------|
| **Timeline Advancement** | `POST /api/cron/advance-timeline` | Daily at midnight UTC | `0 0 * * *` |

---

## Future Cron Tasks

As the platform grows, additional cron tasks may be added:

- **Match Auto-Simulation:** `POST /api/cron/simulate-matches` - TBD
- **Leaderboard Refresh:** `POST /api/cron/refresh-standings` - TBD
- **Weekly Reports:** `POST /api/cron/generate-reports` - TBD

This document will be updated when new endpoints are available.

---

## Support

If you encounter issues setting up cron jobs:

1. Check this documentation for troubleshooting steps
2. Review Vercel function logs
3. Test the endpoint manually with cURL
4. Check that environment variables are set correctly

---

**Last Updated:** October 23, 2025
