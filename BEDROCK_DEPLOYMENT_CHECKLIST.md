# Bedrock Integration Deployment Checklist

## Pre-Deployment Checklist

### ✅ Code Changes Complete
- [x] Added `@aws-sdk/client-bedrock-runtime` to Lambda package.json
- [x] Implemented `/tasks/parse` endpoint in app.js
- [x] Added `parseTasks()` function to src/lib/api.js
- [x] Enhanced ImportStep component with syllabus UI
- [x] Updated IAM permissions in custom-policies.json
- [x] No linting errors

### 📋 Pre-Deployment Steps

1. **Enable Bedrock in AWS Console**
   ```bash
   # Login to AWS Console
   # Navigate to: Bedrock > Model access
   # Region: us-east-1 (or your region)
   # Click "Manage model access"
   # Enable: Anthropic Claude 3.5 Sonnet v2
   # Submit request (approval is usually instant)
   ```

2. **Install Dependencies**
   ```bash
   cd amplify/backend/function/playblocksfunction/src
   npm install
   # Should install @aws-sdk/client-bedrock-runtime@^3.709.0
   ```

3. **Review Changes**
   ```bash
   # Check modified files
   git status
   
   # Review changes
   git diff amplify/backend/function/playblocksfunction/src/app.js
   git diff amplify/backend/function/playblocksfunction/custom-policies.json
   ```

## Deployment Steps

### Step 1: Deploy Backend
```bash
# Deploy all backend changes
amplify push

# When prompted:
# ✔ Are you sure you want to continue? (Y/n) › yes
# ✔ Do you want to update code for Graphql API › No (we're using REST API)
# ✔ Do you want to update code for Lambda function playblocksfunction › Yes
```

**Expected Output**:
```
✔ All resources are updated in the cloud

REST API endpoint: https://bi6vs9an4k.execute-api.us-east-1.amazonaws.com/dev
```

### Step 2: Verify Bedrock Permissions
```bash
# Check Lambda execution role has Bedrock permissions
aws iam get-role-policy \
  --role-name amplify-playblocks-dev-xxxxxx-playblocksfunction-lambda-role \
  --policy-name amplify-playblocks-dev-xxxxxx-playblocksfunction-lambda-policy

# Should include bedrock:InvokeModel action
```

### Step 3: Test Backend Endpoint
```bash
# Run the test script
node test-bedrock-parse.js
```

**Expected Success Output**:
```
✅ Success! Parsed tasks:
📊 Total tasks extracted: 8
```

**If Test Fails**:
- Check CloudWatch Logs:
  ```bash
  aws logs tail /aws/lambda/playblocksfunction-dev --follow
  ```
- Verify Bedrock model access in AWS Console
- Check IAM permissions were applied

### Step 4: Test Frontend Locally
```bash
# Start development server
npm run dev

# Open browser: http://localhost:3000
# Navigate to Import step
# Paste sample syllabus
# Click "Parse Tasks with AI"
```

### Step 5: Deploy Frontend (Optional)
```bash
# If using Amplify Hosting
amplify publish

# Or deploy to your hosting provider
npm run build
# Upload build artifacts
```

## Post-Deployment Verification

### ✅ Backend Verification
- [ ] Lambda function updated with new code
- [ ] Bedrock SDK dependency installed
- [ ] IAM role includes bedrock:InvokeModel permission
- [ ] Test script runs successfully
- [ ] CloudWatch logs show successful Bedrock calls

### ✅ Frontend Verification
- [ ] ImportStep component shows syllabus textarea
- [ ] "Parse Tasks with AI" button visible
- [ ] Clicking button triggers API call
- [ ] Loading state displays during parsing
- [ ] Parsed tasks render correctly
- [ ] Error messages display on failure

### ✅ Integration Testing
- [ ] Paste short syllabus → Tasks extracted
- [ ] Paste long syllabus (500+ words) → Tasks extracted
- [ ] Paste invalid text → Error handled gracefully
- [ ] Extracted tasks saved to DynamoDB
- [ ] Tasks visible in Plan step
- [ ] Task metadata (duration, deadline, priority) correct

## Common Issues & Solutions

### Issue 1: "AccessDeniedException: User is not authorized"
**Cause**: Bedrock permissions not applied or model access not granted

**Solution**:
```bash
# Re-push to apply IAM changes
amplify push

# Verify model access in AWS Console
# Bedrock > Model access > Check Claude 3.5 Sonnet status
```

### Issue 2: "ModelNotFoundException"
**Cause**: Model ID incorrect or not available in region

**Solution**:
- Verify model ID: `anthropic.claude-3-5-sonnet-20241022-v2:0`
- Check region supports Claude 3.5 Sonnet
- Try in us-east-1 region if current region doesn't support it

### Issue 3: "ThrottlingException"
**Cause**: Bedrock rate limit exceeded

**Solution**:
- Wait a few seconds and retry
- Implement exponential backoff in production
- Check service quotas in AWS Console

### Issue 4: Tasks Not Saving to DynamoDB
**Cause**: DynamoDB table name not configured or permissions issue

**Solution**:
```bash
# Check environment variables
aws lambda get-function-configuration \
  --function-name playblocksfunction-dev \
  --query 'Environment.Variables'

# Should include STORAGE_PLAYBLOCKSSTORAGE_NAME
```

### Issue 5: Empty Task Array Returned
**Cause**: AI couldn't parse syllabus or JSON extraction failed

**Solution**:
- Check CloudWatch logs for Bedrock response
- Verify syllabus has clear task descriptions
- Test with example syllabus from test-bedrock-parse.js

## Monitoring & Costs

### CloudWatch Metrics to Monitor
```bash
# Lambda invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=playblocksfunction-dev \
  --start-time 2025-10-19T00:00:00Z \
  --end-time 2025-10-19T23:59:59Z \
  --period 3600 \
  --statistics Sum

# Lambda errors
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=playblocksfunction-dev \
  --start-time 2025-10-19T00:00:00Z \
  --end-time 2025-10-19T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

### Estimated Costs (per 1000 requests)
- **Lambda**: $0.02 (assumes 1s execution time)
- **Bedrock**: $10 (assumes avg 1000 tokens per request)
- **DynamoDB**: $0.01 (write operations)
- **Total**: ~$10/1000 requests

**Cost Optimization**:
- Cache common syllabus results
- Implement request throttling
- Use shorter prompts when possible

## Rollback Plan

If issues occur after deployment:

### Rollback Backend
```bash
# Revert code changes
git checkout HEAD~1 amplify/backend/function/playblocksfunction/

# Re-deploy
amplify push
```

### Disable Feature in Frontend
```javascript
// In ImportStep.jsx, comment out the syllabus section
// Or add a feature flag:
const ENABLE_AI_PARSING = false;

{ENABLE_AI_PARSING && (
  <section className="syllabus-section">
    {/* ... */}
  </section>
)}
```

## Success Criteria

Deployment is successful when:
- ✅ Test script passes without errors
- ✅ UI allows pasting syllabus and parsing tasks
- ✅ Extracted tasks display with correct metadata
- ✅ Tasks saved to DynamoDB and visible in /tasks endpoint
- ✅ No console errors in browser
- ✅ CloudWatch shows successful Bedrock invocations
- ✅ Total deployment time < 10 minutes

## Next Steps After Deployment

1. **User Testing**:
   - Test with real course syllabi
   - Gather feedback on task extraction accuracy
   - Identify edge cases

2. **Performance Optimization**:
   - Add caching layer for repeated syllabi
   - Implement progressive loading for large syllabi
   - Optimize Bedrock prompt for faster responses

3. **Feature Enhancements**:
   - Add task editing before saving
   - Support PDF syllabus uploads
   - Batch process multiple syllabi

4. **Monitoring Setup**:
   - Set up CloudWatch alarms for errors
   - Track Bedrock costs daily
   - Monitor task extraction success rate

## Documentation

Updated documentation files:
- `BEDROCK_INTEGRATION.md` - Complete integration guide
- `BEDROCK_DEPLOYMENT_CHECKLIST.md` - This file
- `test-bedrock-parse.js` - Test script
- `ARCHITECTURE.md` - Update with Bedrock flow (if needed)

## Sign-off

**Developer**: _______________ Date: ___________

**Tester**: _______________ Date: ___________

**Deployment Status**:
- [ ] Development environment
- [ ] Staging environment  
- [ ] Production environment

---

**Notes**:

