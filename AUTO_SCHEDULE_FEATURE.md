# 🎯 Auto-Schedule Feature: AI-Powered Task Timeblocking

## Overview
The **Auto-Schedule** feature combines Bedrock AI task parsing with intelligent scheduling to automatically timeblock your assignments, tests, and quizzes. Just paste your syllabus and get a complete study schedule in seconds!

## How It Works

### Step 1: Paste Your Syllabus
Simply paste your upcoming tests, quizzes, assignments, and deadlines into the textarea.

**Example Input:**
```
CS101 - Fall 2025

Assignment 1: Build calculator app (due Oct 25, 3 hours)
Midterm Exam: Chapters 1-5 (Oct 30) - study for 6 hours
Quiz 1: Variables & Loops (Oct 28)
Final Project: Web app with database (due Nov 15, 10 hours)
Reading: Chapter 6-8 (due Nov 1, 2 hours)
```

### Step 2: Click "Parse & Auto-Schedule"
The system will:
1. **Extract tasks** using Bedrock AI (Claude 3.5 Sonnet)
2. **Analyze deadlines** and priorities
3. **Generate time blocks** using the scheduling algorithm
4. **Optimize for burnout** prevention
5. **Display your schedule** with exact times and dates

### Step 3: Review Your Schedule
You'll see:
- 📅 Exact dates and times for each study session
- ⏰ Start and end times
- ⏱️ Duration of each block
- 🎯 Deadlines for each task
- 🔴🟡🟢 Priority indicators

## Features

### AI Task Extraction
- **Smart parsing** of natural language
- **Duration estimation** based on task complexity
- **Deadline detection** from various date formats
- **Priority classification** (high/medium/low)

### Intelligent Scheduling
- **Avoids conflicts** with existing calendar events
- **Respects work hours** (9 AM - 5 PM by default)
- **Includes breaks** (15 min between sessions)
- **Prevents burnout** (max 8 hours/day)
- **Prioritizes deadlines** (schedules before due dates)

### Visual Display
- **Beautiful timeline** view of scheduled blocks
- **Color-coded priorities**
- **Hover effects** for better UX
- **Responsive design**
- **Direct links** to Plan page

## Example Output

After clicking "Parse & Auto-Schedule", you'll see:

```
🎉 Your Schedule is Ready!
✅ 5 time blocks created

📚 Study for Midterm Exam: Chapters 1-5
   📅 Monday, Oct 28
   ⏰ 9:00 AM - 12:00 PM
   ⏱️ 3h session
   🎯 Due: Mon, Oct 30

📝 Complete Assignment 1: Build calculator app
   📅 Tuesday, Oct 29
   ⏰ 9:00 AM - 12:00 PM
   ⏱️ 3h session
   🎯 Due: Thu, Oct 25

... and more
```

## Usage Tips

### For Best Results
1. **Be specific** with task names
2. **Include deadlines** (e.g., "due Oct 25")
3. **Mention duration** if known (e.g., "3 hours")
4. **Use keywords**: assignment, test, quiz, exam, project, reading
5. **Add context**: chapter numbers, topics, etc.

### Supported Date Formats
- "due Oct 25"
- "deadline: 10/25"
- "(Oct 30)"
- "on November 15"
- "Jan 15, 2026"

### Duration Hints
- "2 hours" → 120 minutes
- "30 min" → 30 minutes
- "study for 4 hours" → 240 minutes
- If not specified, AI estimates based on task type

## Technical Details

### Backend Flow
```
User Input
    ↓
POST /tasks/parse (Bedrock AI)
    ↓
Extract: {title, description, duration, deadline, priority}
    ↓
POST /plan/generate (Scheduling Algorithm)
    ↓
Generate: Time blocks with start/end times
    ↓
Return: Scheduled blocks
```

### Scheduling Algorithm
- **Greedy placement**: Earliest available slots first
- **Deadline respect**: High priority tasks scheduled before deadlines
- **Burnout prevention**: Max hours/day limit (flexi mode allows 20% over)
- **Break insertion**: 15 min between blocks
- **Conflict avoidance**: Checks existing calendar events

### Performance
- **Parse time**: 2-5 seconds (Bedrock AI)
- **Schedule time**: <1 second (algorithm)
- **Total time**: ~3-6 seconds end-to-end

## Button Options

### "Parse & Auto-Schedule" (Recommended)
- 🎯 One-click solution
- ✨ Parse + Schedule in one step
- 📅 See complete schedule immediately
- 💜 Purple gradient button

### "Parse Only"
- 🔍 Extract tasks without scheduling
- 📋 Review tasks first
- ⚙️ Manual scheduling later
- 🔘 Gray button

### "Clear"
- 🗑️ Reset all fields
- 🔄 Start fresh
- ⚪ Simple border button

## Status Indicators

| Status | Color | Meaning |
|--------|-------|---------|
| Ready | Gray | Waiting for input |
| ⏳ Parsing... | Blue | AI extracting tasks |
| ✓ X tasks found | Green | Tasks extracted |
| 📅 Scheduling... | Blue | Generating time blocks |
| ✅ X blocks scheduled | Green | Complete! |
| ✗ Failed | Red | Error occurred |

## Integration with Existing Features

### Works With
- ✅ **Calendar Import** (.ics files)
- ✅ **Plan Generation** (same algorithm)
- ✅ **Task Storage** (DynamoDB)
- ✅ **Event Fetching** (existing events)
- ✅ **Plan Page** (view in calendar)

### Does NOT Interfere With
- ❌ Manual task creation
- ❌ Existing scheduled blocks
- ❌ User preferences
- ❌ Calendar events

## Error Handling

### Common Errors & Solutions

**"No tasks found"**
- Add clear deadlines and task names
- Use keywords like "assignment", "quiz"
- Include dates

**"Scheduling failed"**
- Too many tasks for available time
- Deadlines too close together
- Check backend deployment

**"Backend unavailable"**
- Deploy Lambda: `amplify push`
- Enable Bedrock in AWS Console
- Check API endpoint

## Code Location

| Component | File |
|-----------|------|
| Frontend | `src/components/ImportStep.jsx` |
| API Utilities | `src/lib/api.js` |
| Backend Parse | `amplify/.../app.js` → `/tasks/parse` |
| Backend Schedule | `amplify/.../app.js` → `/plan/generate` |

## Customization

### Change Work Hours
Edit in `ImportStep.jsx`:
```javascript
const preferences = {
  workHoursStart: '09:00', // Change to '08:00' for 8 AM
  workHoursEnd: '17:00',   // Change to '18:00' for 6 PM
  // ...
};
```

### Change Schedule Range
```javascript
const endDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days
// Change 60 to 30 for 1 month, 90 for 3 months, etc.
```

### Change Preferred Days
```javascript
preferredDays: [1, 2, 3, 4, 5], // Mon-Fri
// Add 0 for Sunday, 6 for Saturday
// [0,1,2,3,4,5,6] for all days
```

## Future Enhancements

### Planned Features
- [ ] Edit tasks before scheduling
- [ ] Multiple scheduling modes (aggressive, balanced, relaxed)
- [ ] Study technique suggestions (Pomodoro, spaced repetition)
- [ ] Conflict resolution UI
- [ ] Export to Google Calendar
- [ ] Mobile app support
- [ ] Study analytics

### Potential Improvements
- [ ] ML-based duration prediction
- [ ] Historical performance tracking
- [ ] Smart rescheduling on changes
- [ ] Group study coordination
- [ ] Focus mode integration

## Testing

### Quick Test
1. Go to http://localhost:3002
2. Paste example syllabus (see above)
3. Click "Parse & Auto-Schedule"
4. Wait ~5 seconds
5. See scheduled blocks!

### Test Cases
- ✅ Short syllabus (3-5 tasks)
- ✅ Long syllabus (10+ tasks)
- ✅ Mixed priorities
- ✅ Tight deadlines
- ✅ No deadlines
- ✅ Various date formats
- ✅ Different durations

## Cost

Same as Bedrock integration:
- **~$0.01 per parse**
- **Scheduling is free** (runs in Lambda)
- **Total: ~$0.01 per auto-schedule**

## Summary

The Auto-Schedule feature makes it **incredibly easy** to turn your syllabus into a complete study plan:

1. ✅ **Paste** your assignments and deadlines
2. ✅ **Click** one button
3. ✅ **Get** a fully scheduled plan in seconds!

No manual planning. No calendar juggling. Just smart, AI-powered scheduling.

---

**Try it now**: http://localhost:3002

**Questions?** See `BEDROCK_INTEGRATION.md` for Bedrock setup or `PLAN_GENERATION_IMPLEMENTATION.md` for scheduling algorithm details.

