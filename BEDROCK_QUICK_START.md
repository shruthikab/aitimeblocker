# Bedrock Integration - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Enable Bedrock (2 min)
```bash
# Open AWS Console
# Go to: Bedrock > Model access > Manage model access
# Enable: Anthropic Claude 3.5 Sonnet v2
# Click "Save changes"
```

### Step 2: Deploy Backend (2 min)
```bash
cd /Users/egg/aitimeblocker
amplify push
# Wait for deployment to complete (~90 seconds)
```

### Step 3: Test (1 min)
```bash
node test-bedrock-parse.js
# Should see: ✅ Success! Parsed tasks: 8
```

## 📝 Usage

### Parse a Syllabus
1. Start dev server: `npm run dev`
2. Open `http://localhost:3000`
3. Go to Import step
4. Paste syllabus text
5. Click "Parse Tasks with AI"
6. Wait 2-5 seconds
7. See extracted tasks!

### Example Syllabus
```
CS 101 - Intro to Programming

Week 1: Read Chapter 1 (due Jan 15, 2 hours)
Week 2: Assignment 1 - Hello World (due Jan 22, 3 hours)  
Week 3: Midterm Exam (Jan 29)
Final Project (due Feb 15, 10 hours)
```

## 🔧 Files Changed

### Backend
- `amplify/backend/function/playblocksfunction/src/app.js` (added `/tasks/parse`)
- `amplify/backend/function/playblocksfunction/src/package.json` (added Bedrock SDK)
- `amplify/backend/function/playblocksfunction/custom-policies.json` (added IAM permissions)

### Frontend
- `src/lib/api.js` (added `parseTasks()`)
- `src/components/ImportStep.jsx` (added syllabus UI)

## 📊 What Gets Extracted

From syllabus text, AI extracts:
- ✅ Task titles (e.g., "Read Chapter 1")
- ✅ Descriptions (context about the task)
- ✅ Duration estimates (in minutes)
- ✅ Deadlines (converted to ISO format)
- ✅ Priority (high/medium/low)

## 💡 Tips

### Good Syllabus Format
- Use clear task names: "Assignment 1", "Midterm", "Project"
- Include deadlines: "due Oct 25" or "deadline: 10/25"
- Mention time: "2 hours" or "120 minutes"
- Specify priority keywords: "urgent", "important", "optional"

### What AI Understands
- ✅ "Due Jan 15" → Converts to ISO date
- ✅ "2 hours" → Converts to 120 minutes
- ✅ "Final exam" → Priority: high
- ✅ "Reading assignment" → Priority: medium
- ✅ "Optional lab" → Priority: low

## ❌ Troubleshooting

### "Access Denied" Error
```bash
# Fix: Enable Bedrock model access in AWS Console
# Then: amplify push
```

### "No tasks extracted"
- Check syllabus has clear task descriptions
- Try example syllabus from test script
- Look for keywords: "assignment", "due", "project"

### "Backend unavailable"
```bash
# Check if backend is deployed
amplify status

# Re-deploy if needed
amplify push
```

## 📈 Costs

- ~$0.01 per syllabus parsed
- First 1000 requests ≈ $10
- 100 users/month ≈ $5/month

## 🎯 Quick Test

```bash
# One command to test everything
node test-bedrock-parse.js && echo "✅ Ready to use!"
```

## 📚 Full Documentation

- **Complete Guide**: `BEDROCK_INTEGRATION.md`
- **Deployment Steps**: `BEDROCK_DEPLOYMENT_CHECKLIST.md`
- **Implementation Summary**: `HOUR_5-6_SUMMARY.md`

## 🆘 Need Help?

1. Check `BEDROCK_INTEGRATION.md` for detailed troubleshooting
2. View CloudWatch logs: `aws logs tail /aws/lambda/playblocksfunction-dev --follow`
3. Test endpoint: `node test-bedrock-parse.js`

---

**Ready in 5 minutes!** ⏱️

