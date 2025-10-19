# 🚀 Backend Deployment Guide

## Current Status

Your app is currently running in **offline/local mode**. The frontend works, but data won't persist to the cloud.

## Quick Deploy

### 1. **Check Amplify Status**

```bash
amplify status
```

You should see:
- ✅ API (playblocks)
- ✅ Auth (playblocksc5368d85)
- ✅ Function (playblocksfunction)
- ✅ Storage (playblocksstorage)

### 2. **Deploy Backend**

```bash
amplify push
```

This will:
- Deploy Lambda function with all endpoints
- Set up API Gateway
- Configure DynamoDB table
- Enable CORS

**Time:** ~5-10 minutes

### 3. **Test Backend**

```bash
# Get the API endpoint
amplify status

# Test the preferences endpoint
curl https://YOUR_API_ENDPOINT/dev/preferences
```

### 4. **Refresh Your App**

Once deployed:
1. Refresh the browser (http://localhost:3000)
2. The ⚠️ "Offline Mode" banner should disappear
3. Your data will now persist to DynamoDB

---

## What's Already Set Up

### ✅ Backend Code (Already Implemented)

**Lambda Function** (`amplify/backend/function/playblocksfunction/src/app.js`):

1. **Preferences Endpoints:**
   - `GET /preferences` - Fetch user preferences
   - `POST /preferences` - Save user preferences

2. **Data Endpoints:**
   - `GET /events` - Fetch calendar events
   - `GET /tasks` - Fetch tasks

3. **Calendar Import:**
   - `POST /import/ics` - Import .ics calendar files

4. **Plan Generation:**
   - `POST /plan/generate` - AI-powered task scheduling

### ✅ DynamoDB Schema

**Table:** `playblockstable-dev`

**Keys:**
- PK (Partition Key): `USER#<userId>`
- SK (Sort Key): Different patterns for different data types

**Data Patterns:**
```
USER#anonymous    PROFILE#preferences     { maxBlock, breaks, etc. }
USER#anonymous    EVENT#event-uuid        { title, start, end, etc. }
USER#anonymous    TASK#task-uuid          { title, duration, etc. }
```

---

## Testing After Deployment

### 1. **Test Preferences**

```bash
# Save preferences
curl -X POST https://YOUR_API_ENDPOINT/dev/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "maxBlock": 120,
      "breakMinutes": 15,
      "workHoursStart": "09:00",
      "workHoursEnd": "17:00"
    }
  }'

# Get preferences
curl https://YOUR_API_ENDPOINT/dev/preferences
```

### 2. **Test Calendar Import**

Upload a `.ics` file through the app:
1. Go to Step 1 (Import)
2. Drop your calendar file
3. Check DynamoDB table for stored events

### 3. **Test Plan Generation**

1. Go to `/plan` page
2. Add some tasks
3. Click "Generate Plan"
4. Should see scheduled blocks

---

## Offline Mode (Current State)

The app gracefully handles backend unavailability:

### ✅ What Works Offline:
- ✅ Calendar import (parsed locally)
- ✅ Viewing events in calendar grid
- ✅ Setting preferences (stored in browser state)
- ✅ Adding tasks
- ✅ Full UI/UX experience

### ❌ What Doesn't Work Offline:
- ❌ Data persistence (won't survive page refresh)
- ❌ Plan generation (requires Lambda function)
- ❌ Cross-device sync
- ❌ User authentication benefits

---

## Deployment Commands

### Full Deployment

```bash
# Deploy all changes
amplify push

# Deploy with confirmation prompts
amplify push --yes

# Deploy specific category
amplify push function
amplify push api
```

### Check What Changed

```bash
amplify status
```

Output shows:
- **Create** - New resources
- **Update** - Modified resources
- **No Change** - Unchanged resources

### View Backend Logs

```bash
# View Lambda logs
amplify console api

# Or use AWS Console
# CloudWatch → Log Groups → /aws/lambda/playblocksfunction-*
```

---

## Troubleshooting

### Issue: "amplify: command not found"

**Install Amplify CLI:**
```bash
npm install -g @aws-amplify/cli
amplify configure
```

### Issue: "No credentials found"

**Configure AWS credentials:**
```bash
amplify configure
```

Follow the prompts to set up AWS access.

### Issue: "Resource already exists"

**Pull cloud state:**
```bash
amplify pull
```

### Issue: CORS Errors

**Update API Gateway CORS:**
```bash
amplify update api
# Select "REST API"
# Configure CORS settings
amplify push
```

---

## Alternative: Test with Mock Backend

If you can't deploy right now, you can test the Lambda function locally:

```bash
cd amplify/backend/function/playblocksfunction/src

# Install dependencies
npm install

# Run test script
node test-plan-generate.js
```

This tests the plan generation algorithm locally.

---

## Cost Estimate

### AWS Free Tier Includes:
- **Lambda:** 1M free requests/month
- **API Gateway:** 1M free requests/month  
- **DynamoDB:** 25GB storage, 25 read/write units
- **Cognito:** 50,000 monthly active users

**Estimated Monthly Cost:** $0 (under free tier for development)

---

## Next Steps

1. **Deploy Backend:**
   ```bash
   amplify push
   ```

2. **Test Endpoints:**
   - Check API Gateway in AWS Console
   - Test each endpoint with curl
   - Verify DynamoDB data

3. **Deploy Frontend:**
   ```bash
   npm run build
   amplify publish
   # or
   vercel deploy
   ```

4. **Monitor:**
   - CloudWatch logs for errors
   - DynamoDB metrics
   - API Gateway metrics

---

## Quick Reference

| Feature | Endpoint | Method |
|---------|----------|--------|
| Get Preferences | `/preferences` | GET |
| Save Preferences | `/preferences` | POST |
| Get Events | `/events` | GET |
| Get Tasks | `/tasks` | GET |
| Import Calendar | `/import/ics` | POST |
| Generate Plan | `/plan/generate` | POST |

**Base URL:** `https://bi6vs9an4k.execute-api.us-east-1.amazonaws.com/dev`

---

**Ready to deploy? Run `amplify push` now! 🚀**

