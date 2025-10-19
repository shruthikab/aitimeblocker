# Quick Start: Plan Generation Feature

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd /Users/egg/aitimeblocker
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Access the Plan Generator
Open your browser and navigate to:
```
http://localhost:3000/plan
```

## 📋 Usage Guide

### Step 1: Configure Your Preferences

1. **Choose Planning Mode**
   - **Strict Mode**: Hard limits on work hours (prevents burnout)
   - **Flexi Mode**: 20% flexibility (for busier weeks)

2. **Set Work Hours**
   - Start time (e.g., 09:00)
   - End time (e.g., 17:00)

3. **Adjust Limits**
   - Max hours per day (slider: 1-12 hours)
   - Break between tasks (slider: 0-60 minutes)

4. **Select Preferred Days**
   - Click days you want to work (Mon-Sun)
   - Default: Monday to Friday

5. Click **"Save Preferences"** and then **"Next: Generate Plan"**

### Step 2: Generate Your Plan

1. **Add Tasks**
   - Click **"+ Add"** to create a new task
   - Enter task title
   - Set duration in minutes
   - Optionally add a deadline

2. **Review Tasks**
   - Drag task cards to reorder (visual feedback)
   - Edit any details
   - Remove unwanted tasks

3. **Generate Plan**
   - Click **"🚀 Generate Plan"**
   - Wait for algorithm to process
   - View statistics (scheduled, unscheduled, available slots)

4. **Interact with Calendar**
   - View scheduled blocks (green) vs existing events (indigo)
   - Drag events to reschedule them
   - Resize events by dragging edges
   - Switch between week/day/agenda views

## 🎯 Example Workflow

### Scenario: Planning a Work Week

**Preferences:**
- Mode: Strict
- Work hours: 9:00 AM - 5:00 PM
- Max hours/day: 6 hours
- Break time: 15 minutes
- Days: Mon-Fri

**Tasks to Schedule:**
1. "Write project proposal" - 2 hours - Deadline: Wednesday
2. "Code review" - 1.5 hours
3. "Team meeting prep" - 1 hour - Deadline: Tuesday
4. "Update documentation" - 45 minutes
5. "Client presentation" - 3 hours - Deadline: Thursday

**Result:**
- Urgent tasks (with deadlines) scheduled first
- Tasks distributed across multiple days
- Never exceeds 6 hours/day
- 15-minute breaks between tasks
- All within 9 AM - 5 PM window

## 🔧 Testing the Backend

### Run Unit Tests
```bash
cd amplify/backend/function/playblocksfunction/src
node test-plan-generate.js
```

### Test API Endpoint
```bash
curl -X POST https://bi6vs9an4k.execute-api.us-east-1.amazonaws.com/dev/plan/generate \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {
        "id": "1",
        "title": "Test Task",
        "duration": 60
      }
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
    "startDate": "2025-10-18T00:00:00Z",
    "endDate": "2025-10-25T00:00:00Z"
  }'
```

## 💡 Tips

1. **Deadline Priority**: Tasks with deadlines are always scheduled first
2. **Longer Tasks First**: Among non-deadline tasks, longer ones are prioritized
3. **Burnout Prevention**: If tasks can't fit within daily limits, they go to next day
4. **Drag to Adjust**: After generating, you can manually adjust by dragging
5. **Flexi Mode**: Use when you have urgent deadlines and need flexibility
6. **Strict Mode**: Use for sustainable, balanced weekly planning

## 🐛 Troubleshooting

### Calendar Not Displaying
- Ensure `moment` is installed: `npm install moment`
- Check console for errors
- Verify API endpoint is accessible

### Tasks Not Scheduling
- Check if tasks fit within work hours
- Verify preferred days are selected
- Ensure max hours/day allows for task durations
- Review console logs for algorithm output

### Drag-and-Drop Not Working
- Ensure `react-dnd` and `react-dnd-html5-backend` are installed
- Only scheduled events (green) are draggable
- Existing events (indigo) are view-only

### API Errors
- Check Lambda logs in AWS CloudWatch
- Verify API Gateway endpoint is correct
- Ensure request payload matches contract
- Check CORS settings

## 📊 Understanding Results

### Stats Box
- **Scheduled**: Tasks successfully placed in calendar
- **Unscheduled**: Tasks that couldn't fit (adjust preferences or extend date range)
- **Available Slots**: Number of time slots found

### Daily Hours Tracking
- Displays in response for debugging
- Shows how many hours used per day
- Helps verify burnout guards are working

## 🎨 Customization

### Changing Colors
Edit `eventStyleGetter` in `PlanStepWithDnd.jsx`:
```javascript
const eventStyleGetter = (event) => {
  let backgroundColor = "#your-color";
  // ...
}
```

### Adjusting Time Increments
In calendar props:
```javascript
step={15}        // 15-minute increments
timeslots={4}    // 4 slots per hour
```

### Modifying Algorithm
Edit functions in `app.js`:
- `buildSlots()` - Change slot generation logic
- `fitsPrefs()` - Modify preference checking
- `greedyPlacement()` - Adjust scheduling algorithm

## 📚 Learn More

- See `PLAN_GENERATION_IMPLEMENTATION.md` for full technical documentation
- Check `test-plan-generate.js` for example payloads
- Review Lambda logs for debugging backend
- React Big Calendar docs: https://jquense.github.io/react-big-calendar/
- React DnD docs: https://react-dnd.github.io/react-dnd/

## ✅ Checklist

- [ ] Dependencies installed
- [ ] Development server running
- [ ] Accessed `/plan` page
- [ ] Configured preferences
- [ ] Added tasks
- [ ] Generated plan successfully
- [ ] Tested drag-and-drop
- [ ] Reviewed calendar views
- [ ] Checked stats display
- [ ] Tested both strict and flexi modes

## 🎉 Success!

You now have a working AI Time Blocker with smart scheduling and burnout prevention. Enjoy planning your week efficiently!

