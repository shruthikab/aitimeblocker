# Bedrock Integration Guide (Hour 5-6)

## Overview
This guide documents the AI-powered task parsing feature using AWS Bedrock (Claude 3.5 Sonnet) to automatically extract tasks from course syllabi and project descriptions.

## Features Implemented

### 1. Backend Lambda Endpoint (`/tasks/parse`)
**Location**: `amplify/backend/function/playblocksfunction/src/app.js`

**Functionality**:
- Accepts syllabus text as input
- Uses AWS Bedrock Claude 3.5 Sonnet model for intelligent task extraction
- Parses response and extracts structured task data
- Stores tasks in DynamoDB
- Returns parsed tasks with metadata (duration, deadline, priority)

**Request Format**:
```json
{
  "syllabusText": "Course syllabus or project description text..."
}
```

**Response Format**:
```json
{
  "success": true,
  "message": "Tasks parsed successfully",
  "count": 5,
  "tasks": [
    {
      "id": "task-1234567890-0",
      "title": "Complete Chapter 1 reading",
      "description": "Read and understand fundamental concepts",
      "duration": 120,
      "deadline": "2025-10-26T23:59:59Z",
      "priority": "medium"
    }
  ]
}
```

### 2. Frontend API Utility
**Location**: `src/lib/api.js`

**Function**: `parseTasks(syllabusText)`
- Calls the backend `/tasks/parse` endpoint
- Handles errors gracefully
- Returns parsed task data

### 3. Enhanced ImportStep Component
**Location**: `src/components/ImportStep.jsx`

**New Features**:
- Textarea for syllabus input with example placeholder
- "Parse Tasks with AI" button
- Real-time parsing status (idle, parsing, done, error)
- Visual display of extracted tasks with:
  - Task title and description
  - Duration estimate
  - Deadline (if available)
  - Priority badge (high/medium/low)
- Clear button to reset form

**UI Layout**:
- Split into two sections:
  1. Calendar Import (.ics files) - existing functionality
  2. Syllabus Parsing (AI-powered) - new functionality

## Setup Requirements

### 1. AWS Bedrock Access
Before deploying, ensure AWS Bedrock is enabled:

```bash
# Check if Bedrock is available in your region
aws bedrock list-foundation-models --region us-east-1

# Request access to Claude 3.5 Sonnet model
# Go to AWS Console > Bedrock > Model access
# Request access to: anthropic.claude-3-5-sonnet-20241022-v2:0
```

### 2. Lambda IAM Permissions
**Location**: `amplify/backend/function/playblocksfunction/custom-policies.json`

Added Bedrock permission:
```json
{
  "Action": ["bedrock:InvokeModel"],
  "Resource": [
    "arn:aws:bedrock:${region}::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
  ]
}
```

### 3. NPM Dependencies
**Location**: `amplify/backend/function/playblocksfunction/src/package.json`

Added dependency:
```json
{
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.709.0"
  }
}
```

Installed with:
```bash
cd amplify/backend/function/playblocksfunction/src
npm install
```

## Deployment

### Step 1: Deploy Backend
```bash
# Push changes to AWS
amplify push

# This will:
# - Update Lambda function with new code
# - Apply IAM permission changes
# - Install @aws-sdk/client-bedrock-runtime dependency
```

### Step 2: Verify Bedrock Access
1. Go to AWS Console > Bedrock > Model access
2. Ensure "anthropic.claude-3.5 Sonnet" status is "Access granted"
3. If not, click "Manage model access" and request access

### Step 3: Test the Integration
```bash
# Run the test script
node test-bedrock-parse.js
```

Expected output:
```
🧪 Testing Bedrock Task Parsing Endpoint
📝 Sample Syllabus:
─────────────────────────────────────────────────
CS 345 - Web Development
...
─────────────────────────────────────────────────
🚀 Sending request to backend...
✅ Success! Parsed tasks:
📊 Total tasks extracted: 8
─────────────────────────────────────────────────
1. Read Chapters 1-3 of the textbook
   Duration: 120 minutes
   Deadline: 10/26/2025
   Priority: medium
...
```

## Usage in UI

### 1. Start Development Server
```bash
npm run dev
```

### 2. Navigate to Import Step
Open browser to `http://localhost:3000` and go to the Import step.

### 3. Parse Syllabus
1. Paste course syllabus or project description into textarea
2. Click "Parse Tasks with AI"
3. Wait for AI processing (typically 2-5 seconds)
4. Review extracted tasks
5. Tasks are automatically saved to DynamoDB

### 4. Use Parsed Tasks
Parsed tasks will be available in:
- The Plan step for scheduling
- Task list queries (`GET /tasks`)
- Plan generation algorithm

## Prompt Engineering

The AI prompt is optimized to extract:
- **Task titles**: Specific, actionable task names
- **Descriptions**: Brief context about each task
- **Durations**: Estimated time in minutes based on complexity
- **Deadlines**: Converted to ISO 8601 format
- **Priorities**: Classified as high/medium/low

### Prompt Template
```
You are a task extraction assistant. Given a course syllabus or project description, extract all actionable tasks with their details.

Extract tasks in this JSON format:
{
  "tasks": [
    {
      "title": "Task name",
      "description": "Brief description",
      "duration": 60,
      "deadline": "2025-12-31T23:59:59Z",
      "priority": "high"
    }
  ]
}

Rules:
- duration is in minutes (estimate based on task complexity)
- deadline should be in ISO 8601 format if mentioned, otherwise null
- priority can be "high", "medium", or "low"
- Extract assignments, projects, readings, exams, labs, etc.
- Be specific but concise in titles
```

## Troubleshooting

### Error: "bedrock:InvokeModel" Access Denied
**Solution**:
1. Check IAM permissions in Lambda
2. Run `amplify push` to update CloudFormation stack
3. Verify custom-policies.json includes Bedrock permission

### Error: Model Not Found
**Solution**:
1. Check if Claude 3.5 Sonnet is available in your region
2. Request model access in AWS Console > Bedrock
3. Wait for access approval (usually instant for most accounts)

### Error: Failed to Parse Tasks
**Possible Causes**:
- Invalid syllabus text (empty or malformed)
- Bedrock service quota exceeded
- Network timeout

**Solution**:
- Check CloudWatch logs for Lambda function
- Verify Bedrock service is operational
- Try with smaller syllabus text

### No Tasks Extracted
**Possible Causes**:
- Syllabus doesn't contain clear task descriptions
- AI couldn't identify actionable items

**Solution**:
- Include explicit deadlines and assignments
- Use keywords like "Assignment", "Due", "Project", "Reading"
- Be specific about deliverables

## Architecture

```
┌─────────────────┐
│  Frontend UI    │
│  ImportStep.jsx │
└────────┬────────┘
         │ POST /tasks/parse
         │ { syllabusText: "..." }
         ↓
┌─────────────────┐
│  API Gateway    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐      ┌──────────────┐
│ Lambda Function │─────→│ AWS Bedrock  │
│  app.js         │←─────│ Claude 3.5   │
└────────┬────────┘      └──────────────┘
         │
         │ BatchWrite
         ↓
┌─────────────────┐
│   DynamoDB      │
│  Tasks Table    │
└─────────────────┘
```

## Cost Considerations

### AWS Bedrock Pricing (us-east-1)
- **Claude 3.5 Sonnet**: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- **Average syllabus**: ~1,000 input tokens, ~500 output tokens
- **Cost per parse**: ~$0.01 (1 cent)

### DynamoDB Pricing
- **Write operations**: $1.25 per million writes
- **Storage**: $0.25 per GB-month
- **Minimal cost** for typical usage

## Testing Checklist

- [x] Lambda function includes Bedrock client
- [x] IAM permissions include bedrock:InvokeModel
- [x] Frontend component has syllabus textarea
- [x] Parse button triggers API call
- [x] Loading state shows during parsing
- [x] Parsed tasks display correctly
- [x] Tasks saved to DynamoDB
- [x] Error handling for API failures
- [x] Test script validates end-to-end flow

## Next Steps (Beyond Hour 5-6)

1. **Enhanced Error Handling**:
   - Add retry logic for transient Bedrock errors
   - Better user feedback for different error types

2. **Prompt Tuning**:
   - A/B test different prompt variations
   - Add few-shot examples for better extraction

3. **Additional Features**:
   - Support for file uploads (PDF syllabi)
   - Task editing before saving
   - Bulk import from multiple syllabi

4. **Analytics**:
   - Track parsing success rate
   - Monitor Bedrock costs
   - Log common parsing patterns

## References

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Claude 3.5 Sonnet Model Card](https://www.anthropic.com/claude)
- [Amplify Lambda Functions](https://docs.amplify.aws/cli/function/)
- [DynamoDB Batch Operations](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/batch-operations.html)

## Summary

Hour 5-6 successfully implemented:
- ✅ Bedrock SDK installed in Lambda
- ✅ `/tasks/parse` endpoint with AI integration
- ✅ Frontend syllabus parsing UI
- ✅ Task storage in DynamoDB
- ✅ IAM permissions configured
- ✅ Test script for validation

**Total Lines of Code Added**: ~300 lines
**Time Spent**: 1.5 hours (as planned)
**Next Phase**: Testing and refinement

