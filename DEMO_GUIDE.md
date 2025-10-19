# Demo Guide: Plan Generation Feature

## 🎬 Live Demo Walkthrough

### Step-by-Step Demo Script

---

## Part 1: Introduction (30 seconds)

**What to Show:**
```
Navigate to http://localhost:3000/plan
```

**What to Say:**
> "This is the AI Time Blocker plan generation feature. It helps you schedule 
> tasks automatically while preventing burnout. Let me show you how it works."

**What You'll See:**
- Beautiful gradient background (blue → purple → pink)
- Large title: "AI Time Blocker"
- Step indicator showing "1. Tune Preferences"

---

## Part 2: Configure Preferences (1 minute)

### Step 2a: Choose Mode

**What to Do:**
1. Click on **"Strict Mode"** button
2. Then click on **"Flexi Mode"** button

**What to Say:**
> "First, we choose our planning mode. Strict Mode enforces hard limits to prevent 
> burnout - no exceptions. Flexi Mode allows 20% flexibility for urgent deadlines."

**Visual Feedback:**
- Button highlights in blue (Strict) or purple (Flexi)
- Description text updates below

---

### Step 2b: Set Work Hours

**What to Do:**
1. Click work start time picker → Select "09:00"
2. Click work end time picker → Select "17:00"

**What to Say:**
> "Next, we define our work hours. Let's say 9 AM to 5 PM - a standard work day."

---

### Step 2c: Adjust Daily Limits

**What to Do:**
1. Drag "Max Hours Per Day" slider to **6 hours**
2. Drag "Break Between Tasks" slider to **15 minutes**

**What to Say:**
> "We can set a maximum of 6 hours of focused work per day, with 15-minute breaks 
> between tasks to prevent burnout and maintain productivity."

---

### Step 2d: Select Work Days

**What to Do:**
1. Click on each day: Mon, Tue, Wed, Thu, Fri (should turn green)
2. Leave Sat and Sun unselected (gray)

**What to Say:**
> "I prefer working Monday through Friday, so I'll select those days."

---

### Step 2e: Save and Continue

**What to Do:**
1. Click **"Save Preferences"** button
2. Click **"Next: Generate Plan →"** button

**What to Say:**
> "Now we save our preferences and move to the planning step."

**Visual Feedback:**
- Step indicator changes from "1" to "2"
- TuneStep disappears, PlanStep appears

---

## Part 3: Add Tasks (1 minute)

### Step 3a: Add First Task

**What to Do:**
1. Click **"+ Add"** button
2. In the new task card:
   - Change title to: **"Write Project Proposal"**
   - Set duration to: **120** minutes
   - Set deadline to: **Tomorrow's date**

**What to Say:**
> "Let's add our first task - a project proposal that needs to be written. 
> It'll take about 2 hours, and it's due tomorrow."

---

### Step 3b: Add Second Task

**What to Do:**
1. Click **"+ Add"** button again
2. In the new task card:
   - Change title to: **"Code Review Session"**
   - Set duration to: **90** minutes
   - Leave deadline empty

**What to Say:**
> "Next, a code review session. This is 1.5 hours but has no specific deadline."

---

### Step 3c: Add Third Task

**What to Do:**
1. Click **"+ Add"** button
2. In the new task card:
   - Change title to: **"Client Presentation Prep"**
   - Set duration to: **180** minutes
   - Set deadline to: **3 days from now**

**What to Say:**
> "Finally, we need to prepare for a client presentation - 3 hours of work, 
> due in a few days."

---

### Step 3d: Demonstrate Dragging (Optional)

**What to Do:**
1. Drag the second task card up above the first one
2. Notice the visual feedback (opacity change)

**What to Say:**
> "Notice these task cards are draggable - though the algorithm will prioritize 
> by deadline anyway."

---

## Part 4: Generate Plan (30 seconds)

**What to Do:**
1. Click the large **"🚀 Generate Plan"** button
2. Watch the loading state

**What to Say:**
> "Now the magic happens. Our backend Lambda function will use a greedy placement 
> algorithm to schedule these tasks optimally."

**Visual Feedback:**
- Button text changes to "⏳ Generating..."
- Button becomes disabled
- After ~1 second, success message appears

---

## Part 5: View Results (1 minute)

### Step 5a: Read Stats

**What to Show:**
The green stats box that appears:
```
✅ Plan Generated!
✓ Scheduled: 3 tasks
✗ Unscheduled: 0 tasks
📅 Available slots: 15
```

**What to Say:**
> "Success! All 3 tasks were scheduled. We had 15 available time slots across 
> the week, and the algorithm found spots for everything."

---

### Step 5b: Examine Calendar

**What to Do:**
1. Point to the calendar view
2. Show the green blocks (scheduled tasks)
3. Show the indigo blocks (existing events)

**What to Say:**
> "Here's our weekly calendar. Green blocks are our newly scheduled tasks. 
> Notice they're all within our 9-5 work hours, only on weekdays."

---

### Step 5c: Check Task Distribution

**What to Do:**
1. Point to "Write Project Proposal" (scheduled tomorrow)
2. Point to other tasks on later days

**What to Say:**
> "The urgent task with tomorrow's deadline was scheduled first. The other 
> tasks are distributed across the week, respecting our 6-hour daily limit."

---

## Part 6: Interactive Features (1 minute)

### Step 6a: Drag an Event

**What to Do:**
1. Click and hold a green block
2. Drag it to a different time slot
3. Release

**What to Say:**
> "If we need to adjust, we can just drag events to new time slots. 
> Watch how smoothly they move."

---

### Step 6b: Resize an Event

**What to Do:**
1. Hover over the bottom edge of a green block
2. Click and drag down to make it longer
3. Or drag up to make it shorter

**What to Say:**
> "We can also resize events by dragging the edges. Maybe we need more time 
> for this task."

---

### Step 6c: Switch Calendar Views

**What to Do:**
1. Click "Day" view
2. Click "Agenda" view
3. Click back to "Week" view

**What to Say:**
> "The calendar supports different views - week, day, and agenda format. 
> Choose whatever works best for your workflow."

---

## Part 7: Demonstrate Burnout Prevention (1 minute)

### Step 7a: Add Too Many Tasks

**What to Do:**
1. Add 5 more tasks, each 2 hours long
2. Don't add deadlines
3. Click **"Generate Plan"** again

**What to Say:**
> "Let's see what happens when we try to schedule too much work. I'm adding 
> 5 more 2-hour tasks - that's 10 more hours."

---

### Step 7b: Check Results

**What to Show:**
Stats box showing:
```
✅ Plan Generated!
✓ Scheduled: 6 tasks
✗ Unscheduled: 2 tasks
```

**What to Say:**
> "Notice the algorithm scheduled as many as possible while respecting our 
> 6-hour daily limit. Some tasks remain unscheduled rather than causing burnout. 
> This is the burnout prevention in action!"

---

## Part 8: Compare Modes (1 minute)

### Step 8a: Switch to Flexi Mode

**What to Do:**
1. Click **"← Back to Preferences"** button
2. Select **"Flexi Mode"**
3. Click **"Next: Generate Plan"**
4. Click **"Generate Plan"** again

**What to Say:**
> "Let's try Flexi Mode. This allows up to 20% over our daily limit for 
> urgent situations."

---

### Step 8b: Compare Results

**What to Show:**
Stats showing more tasks scheduled:
```
✅ Plan Generated!
✓ Scheduled: 7 tasks
✗ Unscheduled: 1 tasks
```

**What to Say:**
> "In Flexi Mode, one more task fits because we allow up to 7.2 hours per day 
> instead of a strict 6-hour limit. Still prevents extreme overwork."

---

## Part 9: Edge Cases Demo (Optional - 1 minute)

### Case 1: Impossible Deadline

**What to Do:**
1. Add a task with duration 8 hours
2. Set deadline to yesterday
3. Generate plan

**What to Show:**
Task appears in "Unscheduled" list

**What to Say:**
> "The algorithm won't schedule tasks after their deadline - this one stays 
> unscheduled."

---

### Case 2: No Preferred Days

**What to Do:**
1. Go back to preferences
2. Unselect all days
3. Try to generate

**What to Show:**
All tasks unscheduled

**What to Say:**
> "If no days are selected as work days, naturally no tasks can be scheduled."

---

## Part 10: Wrap Up (30 seconds)

**What to Say:**
> "And that's the AI Time Blocker plan generation feature! Key highlights:
> 
> 1. **Smart Scheduling**: Deadline-aware, greedy placement algorithm
> 2. **Burnout Prevention**: Hard limits on daily work hours
> 3. **Flexible Modes**: Choose strict enforcement or flexible planning
> 4. **Interactive UI**: Drag, drop, and resize to adjust your plan
> 5. **Visual Feedback**: Color-coded events, clear stats, intuitive controls
> 
> This was built with React Big Calendar for the UI, React DnD for drag-and-drop, 
> and a custom Lambda backend with a greedy scheduling algorithm. All code is 
> well-documented and tested."

---

## 📸 Screenshot Checklist

Take these screenshots for documentation:

1. ✅ **Landing Page**: Step indicator on "1. Tune Preferences"
2. ✅ **TuneStep**: Mode toggle, sliders, day selector
3. ✅ **PlanStep - Empty**: Before adding tasks
4. ✅ **PlanStep - With Tasks**: Task list populated
5. ✅ **Calendar - Generated Plan**: Green scheduled blocks
6. ✅ **Stats Display**: Success message with numbers
7. ✅ **Drag in Action**: Task card being dragged (opacity)
8. ✅ **Calendar Drag**: Event being moved on calendar
9. ✅ **Different Views**: Day view, Agenda view
10. ✅ **Burnout Prevention**: Some tasks unscheduled

---

## 🎤 Talking Points Summary

### For Technical Audience:
- "Greedy placement algorithm with O(n*m) complexity"
- "Lambda backend with Express.js routing"
- "React hooks for state management"
- "DnD Provider from react-dnd with HTML5 backend"
- "Big Calendar with custom event stylers and drag handlers"

### For Business Audience:
- "Prevents employee burnout through smart limits"
- "Increases productivity with optimal scheduling"
- "Flexible modes for different work styles"
- "Intuitive drag-and-drop interface"
- "Automatic prioritization of urgent tasks"

### For Non-Technical Audience:
- "Like having a smart assistant for your calendar"
- "Automatically plans your week based on your preferences"
- "Makes sure you don't overwork yourself"
- "Easy to adjust with simple drag and drop"
- "Color-coded so you can see everything at a glance"

---

## 🧪 Live Testing Script

### Test 1: Light Week (Should schedule 100%)
```
Tasks:
- Task 1: 60 min
- Task 2: 90 min
- Task 3: 45 min

Total: 3.25 hours
Expected: All scheduled on first day
```

### Test 2: Medium Week (Should schedule 90%+)
```
Tasks:
- 5 tasks × 120 min each = 10 hours

Limit: 6 hours/day
Expected: Spread across 2 days
```

### Test 3: Heavy Week (Should schedule 60-80%)
```
Tasks:
- 10 tasks × 120 min each = 20 hours

Limit: 6 hours/day (strict)
Expected: Scheduled across 3-4 days
Unscheduled: 2-4 tasks
```

### Test 4: Deadline Priority
```
Tasks:
- Task A: 120 min, deadline in 1 day
- Task B: 60 min, deadline in 5 days
- Task C: 90 min, no deadline

Expected Order: A → B → C
```

---

## 🎬 Demo Best Practices

1. **Clear Your Browser Cache** before demo
2. **Use Incognito Mode** for clean state
3. **Prepare Sample Data** ahead of time
4. **Have Backup Slides** in case of technical issues
5. **Test API Endpoint** before presenting
6. **Have CloudWatch Logs** open for debugging
7. **Zoom In** on browser for better visibility
8. **Highlight Cursor** for screen recordings
9. **Narrate Your Actions** as you perform them
10. **Pause for Questions** after each section

---

## 📹 Recording Tips

For screen recordings:
- Resolution: 1920×1080 (Full HD)
- Frame rate: 60fps for smooth drag animations
- Audio: Clear, no background noise
- Cursor: Highlight enabled
- Duration: Keep under 5 minutes
- Edit: Add captions for key features
- Music: Optional, keep subtle

---

## ✨ "Wow" Moments to Highlight

1. **Instant Schedule Generation**: ~1 second response time
2. **Smooth Dragging**: 60fps drag-and-drop animations
3. **Smart Prioritization**: Deadline tasks go first automatically
4. **Burnout Prevention**: Visual proof that limits are enforced
5. **Mode Comparison**: Side-by-side strict vs flexi results
6. **Responsive Design**: Works on mobile (if tested)

---

**Demo Duration**: ~8 minutes (can adjust based on time constraints)

**Interactive Session**: +5 minutes for Q&A

**Total Time**: ~13 minutes

---

Good luck with your demo! 🚀

