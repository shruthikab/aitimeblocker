# Enable Bedrock - Quick Steps

## Step 1: Open AWS Console
1. Go to: https://console.aws.amazon.com/bedrock/
2. Make sure you're in **us-east-1** region (top-right corner)

## Step 2: Enable Model Access
1. Click **"Model access"** in the left sidebar
2. Click **"Manage model access"** (orange button)
3. Find **"Anthropic"** in the list
4. Check the box for **"Claude 3.5 Sonnet v2"**
5. Scroll down and click **"Request model access"**
6. Wait 10 seconds - access is usually instant!

## Step 3: Test
Come back here and run:
```bash
node test-bedrock-parse.js
```

If you see "✅ Success! Parsed tasks: 8" - you're done!

## Then Try the UI
1. Go to: http://localhost:3002
2. Scroll to "Smart Scheduler" section
3. Paste your syllabus
4. Click "Parse & Auto-Schedule"
5. Watch the magic! ✨

---

**Need help?** The Bedrock console link: https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess

