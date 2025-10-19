# 🔧 Troubleshooting Guide

## Common Issues & Quick Fixes

### 🔴 ENOENT: no such file or directory (.next/server/app/page.js)

**Symptom:**
```
Error: ENOENT: no such file or directory, 
open '/Users/egg/aitimeblocker/.next/server/app/page.js'
```

**Cause:** Next.js build cache is corrupted

**Fix:**
```bash
# Stop the server (Ctrl+C)
rm -rf .next
npm run dev
```

**Why it works:** Deletes corrupted cache and forces a clean rebuild.

---

### 🔴 Port Permission Error (EPERM)

**Symptom:**
```
Error: listen EPERM: operation not permitted 0.0.0.0:3000
```

**Cause:** macOS firewall blocking network binding

**Fix:** Already fixed in `package.json`
```bash
npm run dev  # Uses -H localhost flag
```

**Alternative:**
```bash
# If you need network access from other devices
npm run dev:network
```

---

### 🔴 Module not found: @/lib/api

**Symptom:**
```
Module not found: Can't resolve '@/lib/api'
```

**Cause:** Path resolution issue

**Fix:** Already fixed - using relative paths:
```javascript
import { ... } from "../src/lib/api"
```

---

### 🔴 localizer.startOfWeek is not a function

**Symptom:**
```
TypeError: localizer.startOfWeek is not a function
```

**Cause:** react-big-calendar localizer not properly initialized

**Fix:** Already fixed - localizer now bundled with Calendar component

---

### 🔴 Failed to fetch (Backend API)

**Symptom:**
```
TypeError: Failed to fetch
```

**Cause:** Backend Lambda not deployed

**Fix:** 
```bash
# Option 1: Deploy backend
amplify push

# Option 2: Use offline mode (already works)
# App gracefully handles backend unavailability
```

---

### 🔴 Port Already in Use

**Symptom:**
```
Error: address already in use :::3000
```

**Fix:**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

---

### 🔴 Authentication Errors

**Symptom:**
```
Auth error / Redirect loop
```

**Fix:**
1. Check Cognito configuration in `src/providers.tsx`
2. Verify redirect URI matches your localhost port
3. Clear browser cookies
```bash
# In browser console:
localStorage.clear()
sessionStorage.clear()
```

---

### 🔴 Calendar Events Not Showing

**Symptom:** Uploaded calendar but no events in grid

**Checklist:**
1. ✅ File is valid .ics format
2. ✅ Events have start/end times
3. ✅ Click "Refresh" button in Step 2
4. ✅ Check browser console for errors
5. ✅ Verify events array in React DevTools

**Debug:**
```javascript
// Check if events are parsed
console.log('Parsed events:', events)
console.log('Calendar events:', calendarEvents)
```

---

### 🔴 Slow Build / Hot Reload

**Symptom:** Dev server is slow or unresponsive

**Fix:**
```bash
# Clear all caches
rm -rf .next node_modules
npm install
npm run dev
```

---

### 🔴 Plan Generation Fails

**Symptom:** "Failed to generate plan" error

**Cause:** Backend Lambda not deployed or CORS issue

**Fix:**
```bash
# Deploy backend
amplify push

# Check Lambda logs
amplify console api
# Navigate to CloudWatch logs
```

**Test backend directly:**
```bash
curl -X POST https://YOUR_API_URL/dev/plan/generate \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## 🔄 Clean Slate (Nuclear Option)

If nothing works, start fresh:

```bash
# Stop all processes
lsof -ti:3000 | xargs kill -9

# Clean everything
rm -rf .next node_modules

# Reinstall
npm install

# Start fresh
npm run dev
```

---

## 🐛 Debugging Tips

### Check Server Logs
The terminal shows useful information:
```
✓ Compiled / in 1077ms
GET / 200 in 1360ms    ← Success
GET /plan 404 in 198ms ← Page not found
⨯ Error message        ← Error details
```

### Browser Console
Press F12 to open DevTools:
- **Console** - JavaScript errors
- **Network** - API calls
- **React DevTools** - Component state

### Check Process
```bash
# What's running on port 3000?
lsof -ti:3000

# Kill it if needed
kill -9 <PID>
```

### Check Next.js Cache
```bash
# Size of cache
du -sh .next

# Remove if large (>500MB)
rm -rf .next
```

---

## 📞 Still Stuck?

### Check These Files:
1. `package.json` - Scripts configured correctly?
2. `jsconfig.json` - Path aliases set up?
3. `next.config.mjs` - Any custom config?
4. `.gitignore` - Not ignoring important files?

### Environment
```bash
# Node version (should be 18+)
node --version

# NPM version
npm --version

# Next.js version
npx next --version
```

### Test API Directly
```bash
# Test preferences endpoint
curl https://bi6vs9an4k.execute-api.us-east-1.amazonaws.com/dev/preferences

# Should return JSON (or 403 if CORS, which is OK)
```

---

## 🎯 Quick Command Reference

```bash
# Start dev server
npm run dev

# Clean build cache
rm -rf .next

# Clean everything
rm -rf .next node_modules && npm install

# Kill port 3000
lsof -ti:3000 | xargs kill -9

# Deploy backend
amplify push

# Check what changed
amplify status

# View backend logs
amplify console api
```

---

## ✅ Success Indicators

**Server running correctly:**
```
✓ Next.js 15.5.6
- Local:        http://localhost:3000
✓ Ready in 1090ms
✓ Compiled / in 1077ms
GET / 200 in 1360ms
```

**App working:**
- ✅ Page loads without errors
- ✅ Stepper shows all 4 steps
- ✅ Can upload .ics file
- ✅ Calendar displays events
- ✅ No console errors (F12)
- ✅ Offline banner shows (if backend not deployed)

---

**Most issues are solved by:** `rm -rf .next && npm run dev` 🎉

