# 🧪 Testing Guide - PlayBlocks

## Quick Start

### 1. Start the Development Server

```bash
# If port 3000 has permission issues, use port 3001
PORT=3001 npm run dev
```

Then open your browser to: **http://localhost:3001** (or 3000 if no permission issues)

---

## 🎯 Feature Testing Checklist

### **Test 1: Authentication Header**

**What to test:**
- ✅ Header appears at the top of every page
- ✅ "Sign In" button is visible when not authenticated
- ✅ Click "Sign In" - should redirect to Cognito login
- ✅ After signing in, user email/ID appears in header
- ✅ "Sign Out" button appears when authenticated

**Expected Behavior:**
- Sticky header with gradient PlayBlocks logo
- Smooth transition between signed-in and signed-out states
- User profile badge shows with purple/blue gradient background

---

### **Test 2: Import Calendar (Step 1)**

**What to test:**
1. ✅ Navigate to main page - should see Step 1 (Import) active
2. ✅ Drag and drop a .ics file OR click to browse
3. ✅ During upload: Loading spinner appears
4. ✅ After upload: Success message appears
5. ✅ Auto-advance to Step 2 after 1.5 seconds

**Test Files:**
Use the sample `test-calendar.ics` in the root directory, or download a calendar from:
- Google Calendar (Export)
- Apple Calendar (File > Export)
- Outlook (Save Calendar)

**Expected Behavior:**
- Beautiful pastel upload area with gradient icon
- File validation (only .ics files accepted)
- Events saved to DynamoDB
- Success message: "Successfully imported X events"

---

### **Test 3: Calendar View (Step 2)**

**What to test:**
1. ✅ Click "Next" or wait for auto-advance after import
2. ✅ Calendar displays in week view by default
3. ✅ Switch between Month/Week/Day views
4. ✅ Click "Refresh" button to reload events from backend
5. ✅ Imported events appear on the calendar

**Expected Behavior:**
- Full react-big-calendar with drag-and-drop
- Events show with proper titles and times
- Empty state message if no events
- Smooth rounded corners and pastel colors

---

### **Test 4: Configure Preferences (Step 3)**

**What to test:**
1. ✅ Navigate to Step 3 (Configure)
2. ✅ Adjust settings:
   - Max Block Duration (default: 120 min)
   - Break Duration (default: 15 min)
   - Work Hours Start (default: 09:00)
   - Work Hours End (default: 17:00)
   - Max Hours Per Day (default: 8)
   - Planning Mode (Flexible/Strict)
3. ✅ Click "Save Preferences"
4. ✅ Success message appears
5. ✅ Auto-advance to Step 4 after 1.5 seconds

**Expected Behavior:**
- All inputs are validated
- Preferences saved to DynamoDB
- Settings persist on page reload
- Beautiful form with rounded inputs

---

### **Test 5: Generate Plan (Step 4)**

**What to test:**
1. ✅ Navigate to Step 4 (Plan)
2. ✅ Click the "AI Plan Generator" card
3. ✅ Redirects to `/plan` page

**Expected Behavior:**
- Smooth transition to plan page
- Previous preferences and events are loaded

---

### **Test 6: AI Plan Generation (`/plan` page)**

**What to test:**
1. ✅ Navigate to http://localhost:3001/plan
2. ✅ **Step 1 - Tune Preferences:**
   - Verify preferences are pre-loaded from backend
   - Adjust if needed
   - Click "Next: Generate Plan →"
3. ✅ **Step 2 - Generate Plan:**
   - Add tasks (title, duration, deadline)
   - Drag tasks to reorder
   - Remove tasks with trash icon
   - Click "🚀 Generate Plan"
4. ✅ **View Results:**
   - Scheduled blocks appear in green
   - Existing events appear in indigo
   - Stats show: scheduled vs unscheduled tasks
   - Drag scheduled blocks to adjust times
   - Resize blocks to change duration

**Expected Behavior:**
- Plan generation calls Lambda function
- Algorithm respects work hours and break times
- Tasks scheduled in earliest available slots
- Unscheduled tasks listed separately
- Calendar updates in real-time

---

## 🔧 Backend API Testing

### Test Backend Endpoints Directly

```bash
# Base URL
API_URL="https://bi6vs9an4k.execute-api.us-east-1.amazonaws.com/dev"

# 1. Get Preferences
curl -X GET "$API_URL/preferences"

# 2. Save Preferences
curl -X POST "$API_URL/preferences" \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "maxBlock": 120,
      "breakMinutes": 15,
      "workHoursStart": "09:00",
      "workHoursEnd": "17:00",
      "maxHoursPerDay": 8,
      "mode": "flexi"
    }
  }'

# 3. Get Events
curl -X GET "$API_URL/events"

# 4. Get Tasks
curl -X GET "$API_URL/tasks"

# 5. Import Calendar
curl -X POST "$API_URL/import/ics" \
  -H "Content-Type: application/json" \
  -d @test-calendar-payload.json

# 6. Generate Plan
curl -X POST "$API_URL/plan/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {"id": "1", "title": "Write report", "duration": 120},
      {"id": "2", "title": "Team meeting", "duration": 60}
    ],
    "preferences": {
      "mode": "flexi",
      "workHoursStart": "09:00",
      "workHoursEnd": "17:00",
      "maxHoursPerDay": 8,
      "breakMinutes": 15,
      "preferredDays": [1,2,3,4,5]
    },
    "existingEvents": [],
    "startDate": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "endDate": "'$(date -u -v+7d +%Y-%m-%dT%H:%M:%S.000Z)'"
  }'
```

---

## 🎨 UI/UX Testing

### Visual Design Checks
- ✅ Pastel gradient background (rose → purple → blue)
- ✅ All cards have rounded-2xl corners
- ✅ Backdrop blur effects on white cards
- ✅ Smooth hover transitions
- ✅ Consistent shadow hierarchy
- ✅ Responsive on mobile/tablet/desktop

### Stepper Component
- ✅ Active step highlighted with gradient
- ✅ Completed steps show green checkmark
- ✅ Inactive steps are grayed out
- ✅ Click any step to navigate
- ✅ Progress bar fills between steps

### Buttons & Interactions
- ✅ Previous/Next buttons work correctly
- ✅ Disabled states (grayed out)
- ✅ Hover effects (shadow, color change)
- ✅ Loading spinners during API calls

---

## 🐛 Common Issues & Solutions

### Issue: "Module not found: @/lib/api"
**Solution:** Import paths updated to use `../src/lib/api` instead

### Issue: "Port 3000 permission denied"
**Solution:** Use `PORT=3001 npm run dev`

### Issue: "Calendar not showing events"
**Solution:** 
1. Check browser console for errors
2. Verify events were imported successfully
3. Click "Refresh" button in Step 2
4. Check DynamoDB table has data

### Issue: "Plan generation fails"
**Solution:**
1. Verify Lambda function is deployed
2. Check that preferences are saved
3. Ensure at least one task is added
4. Check browser console for API errors

### Issue: "Authentication not working"
**Solution:**
1. Verify Cognito configuration in `src/providers.tsx`
2. Check redirect URIs match your localhost port
3. Clear browser cookies and try again

---

## 📊 Test Data

### Sample Tasks for Plan Generation
```javascript
[
  { title: "Write documentation", duration: 120, deadline: null },
  { title: "Code review", duration: 60, deadline: null },
  { title: "Team standup", duration: 30, deadline: null },
  { title: "Design mockups", duration: 90, deadline: "2025-10-25" },
  { title: "Client meeting", duration: 45, deadline: "2025-10-22" }
]
```

### Sample Preferences
```javascript
{
  maxBlock: 120,
  breakMinutes: 15,
  workHoursStart: "09:00",
  workHoursEnd: "17:00",
  maxHoursPerDay: 8,
  preferredDays: [1, 2, 3, 4, 5], // Mon-Fri
  mode: "flexi" // or "strict"
}
```

---

## ✅ Success Criteria

### All Tests Pass When:
1. ✅ Can import a .ics calendar file
2. ✅ Events display in calendar grid
3. ✅ Preferences save and persist
4. ✅ Plan generation creates scheduled blocks
5. ✅ Can drag/resize calendar events
6. ✅ Authentication shows user info
7. ✅ All 4 stepper steps work
8. ✅ UI looks beautiful and responsive
9. ✅ No console errors
10. ✅ Backend APIs respond correctly

---

## 🚀 Next Steps After Testing

1. **Deploy Backend:**
   ```bash
   amplify push
   ```

2. **Deploy Frontend:**
   ```bash
   npm run build
   vercel deploy
   # or
   amplify publish
   ```

3. **Monitor:**
   - Check CloudWatch logs for Lambda errors
   - Monitor DynamoDB for data storage
   - Test in production environment

---

## 📝 Notes

- Default test user ID: "anonymous" (when not authenticated)
- DynamoDB table: Uses PK/SK pattern
  - `USER#id` / `PROFILE#preferences` - User preferences
  - `USER#id` / `EVENT#uid` - Calendar events
  - `USER#id` / `TASK#id` - Tasks
- API Gateway endpoint is already configured in the code
- Lambda function includes all required logic

---

**Happy Testing! 🎉**

If you encounter any issues, check the browser console and Lambda CloudWatch logs for detailed error messages.

