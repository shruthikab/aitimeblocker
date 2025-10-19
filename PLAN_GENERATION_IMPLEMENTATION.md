# Plan Generation Feature - Implementation Documentation

## Overview
This implementation adds a smart task scheduling feature to the AI Time Blocker app, allowing users to automatically generate optimized time blocks for their tasks while preventing burnout.

## Architecture

### Frontend (Person A - 60% FE, 40% BE)
Located in `/src/components/` and `/src/app/plan/`

#### 1. **PlanStep Component** (`PlanStep.jsx`)
- Basic calendar view using `react-big-calendar`
- Task management (add, edit, remove)
- API integration with Lambda `/plan/generate` endpoint
- Display scheduled blocks vs existing events
- Color-coded event visualization

#### 2. **PlanStepWithDnd Component** (`PlanStepWithDnd.jsx`)
- Enhanced version with drag-and-drop functionality
- `react-dnd` integration for draggable task cards
- `react-big-calendar` with drag-and-drop addon
- Event resizing and rescheduling
- Real-time visual feedback

**Features:**
- ✅ Task list with duration and deadline fields
- ✅ Drag-and-drop task cards
- ✅ Calendar integration with week/day/agenda views
- ✅ Draggable and resizable calendar events
- ✅ Color-coded events (green for scheduled, indigo for existing)
- ✅ API call to Lambda backend
- ✅ Real-time stats display

### Frontend (Person B - 40% FE, 60% BE)
Located in `/src/components/`

#### 3. **TuneStep Component** (`TuneStep.jsx`)
- User preference configuration
- Mode toggle: Strict vs Flexi
- Work hours configuration
- Max hours per day slider
- Break duration settings
- Preferred work days selector

**Features:**
- ✅ Strict Mode: Hard limits on work hours
- ✅ Flexi Mode: 20% flexibility on limits
- ✅ Customizable work hours (start/end)
- ✅ Max hours per day (1-12 hours)
- ✅ Break duration (0-60 minutes)
- ✅ Day-of-week preferences (Sun-Sat)

### Backend (Person B - 60% BE)
Located in `/amplify/backend/function/playblocksfunction/src/`

#### 4. **Lambda API Endpoint** (`app.js`)
Route: `POST /plan/generate`

**Core Algorithm Components:**

##### a. `buildSlots(startDate, endDate, prefs, existingEvents)`
- Generates available time slots for scheduling
- Respects preferred work days
- Accounts for existing calendar events
- Creates slots around conflicts
- Minimum slot duration: 30 minutes

**Logic:**
1. Iterate through each day in date range
2. Check if day is in preferred days
3. Parse work hours from preferences
4. Identify conflicts with existing events
5. Create available slots before/after conflicts
6. Filter out slots < 30 minutes

##### b. `fitsPrefs(task, slot, prefs, dailyHours)`
- Validates if a task fits in a slot
- Enforces burnout prevention rules
- Checks daily hour limits
- Respects deadlines

**Validation Rules:**
- Task duration + break must fit in slot
- **Strict Mode**: Hard limit on max hours/day
- **Flexi Mode**: Allow up to 20% over max hours
- Task must be scheduled before deadline (if set)

##### c. `greedyPlacement(tasks, slots, prefs)`
- Main scheduling algorithm
- Greedy approach: earliest available slot
- Priority: deadline tasks first, then by duration

**Algorithm Steps:**
1. Sort tasks by deadline (urgent first), then duration (longer first)
2. Sort slots chronologically
3. For each task:
   - Find first slot that fits preferences
   - Place task in slot
   - Update daily hours tracker
   - Reduce available slot duration
4. Return scheduled blocks and unscheduled tasks

**Burnout Guards:**
- Maximum hours per day enforcement
- Required breaks between tasks
- Preferred work days only
- Work hours boundaries

#### 5. **Unit Tests** (`test-plan-generate.js`)
- Fake task data for testing
- Multiple test scenarios:
  - Strict mode validation
  - Flexi mode validation
  - Deadline priority
  - Burnout guard testing
- Example API call format

**Test Coverage:**
- ✅ Strict vs Flexi mode comparison
- ✅ Deadline-based prioritization
- ✅ Multi-day scheduling (10 tasks, 20 hours)
- ✅ Daily hour limit enforcement

### Integration Layer

#### 6. **Plan Page** (`/src/app/plan/page.jsx`)
- Two-step workflow
- State management between steps
- Passes preferences from TuneStep to PlanStep

**Flow:**
1. **Step 1**: Configure preferences (TuneStep)
2. **Step 2**: Generate and view plan (PlanStepWithDnd)

## API Contract

### Request
```json
POST /plan/generate
{
  "tasks": [
    {
      "id": "task-1",
      "title": "Write report",
      "duration": 120,  // minutes
      "deadline": "2025-10-20T00:00:00Z"  // optional
    }
  ],
  "preferences": {
    "mode": "strict",  // or "flexi"
    "workHoursStart": "09:00",
    "workHoursEnd": "17:00",
    "maxHoursPerDay": 8,
    "breakMinutes": 15,
    "preferredDays": [1, 2, 3, 4, 5]  // 0=Sun, 6=Sat
  },
  "existingEvents": [
    {
      "title": "Meeting",
      "start": "2025-10-19T10:00:00Z",
      "end": "2025-10-19T11:00:00Z"
    }
  ],
  "startDate": "2025-10-18T00:00:00Z",
  "endDate": "2025-10-25T00:00:00Z"
}
```

### Response
```json
{
  "success": true,
  "scheduledBlocks": [
    {
      "id": "task-1",
      "title": "Write report",
      "start": "2025-10-19T09:00:00Z",
      "end": "2025-10-19T11:00:00Z",
      "duration": 120,
      "task": { /* original task object */ }
    }
  ],
  "unscheduledTasks": [],
  "dailyHours": {
    "Mon Oct 19 2025": 2
  },
  "preferences": { /* echoed preferences */ },
  "stats": {
    "totalTasks": 1,
    "scheduled": 1,
    "unscheduled": 0,
    "availableSlots": 5
  }
}
```

## Dependencies

### Frontend
- `react-big-calendar` - Calendar display
- `react-dnd` - Drag and drop functionality
- `react-dnd-html5-backend` - HTML5 drag backend
- `moment` - Date utilities for calendar
- `date-fns` - Additional date utilities

### Backend
- `express` - API framework
- `aws-sdk` - DynamoDB integration
- `ical.js` - Calendar parsing

## Key Files

### Frontend
```
src/
├── components/
│   ├── TuneStep.jsx                 (Person B - FE)
│   ├── PlanStep.jsx                 (Person A - FE)
│   └── PlanStepWithDnd.jsx          (Person A - FE + DnD)
└── app/
    └── plan/
        └── page.jsx                 (Integration)
```

### Backend
```
amplify/backend/function/playblocksfunction/src/
├── app.js                           (Person B - BE)
├── index.js                         (Lambda handler)
└── test-plan-generate.js            (Person B - Tests)
```

## Testing

### Unit Tests
Run backend tests:
```bash
cd amplify/backend/function/playblocksfunction/src
node test-plan-generate.js
```

### Manual API Testing
```bash
curl -X POST https://YOUR-API-URL/dev/plan/generate \
  -H "Content-Type: application/json" \
  -d @test-payload.json
```

### Frontend Testing
1. Navigate to `/plan`
2. Configure preferences in Step 1
3. Add tasks in Step 2
4. Click "Generate Plan"
5. Drag events to reschedule

## Burnout Prevention Features

1. **Max Hours Per Day**: Configurable limit (1-12 hours)
2. **Required Breaks**: Configurable break time between tasks
3. **Work Hours Boundaries**: Only schedule within defined hours
4. **Preferred Days**: Respect user's work day preferences
5. **Mode Flexibility**: 
   - Strict: Hard enforcement
   - Flexi: 20% flexibility for urgent needs

## Future Enhancements

- [ ] Persistent storage of preferences
- [ ] Task priority levels
- [ ] Multi-week planning
- [ ] Task dependencies
- [ ] Custom break rules (lunch, coffee breaks)
- [ ] Calendar sync (Google Calendar, Outlook)
- [ ] Mobile responsive drag-and-drop
- [ ] Undo/redo functionality
- [ ] Export to .ics file
- [ ] AI-powered task duration estimation

## Time Breakdown (as specified)

### Person A (Frontend Integration)
- **FE display/dragging**: ~50 min
  - Calendar setup with react-big-calendar
  - Drag-and-drop with react-dnd
  - Event visualization
- **BE call**: ~10 min
  - API integration
  - Response mapping

### Person B (Backend Logic)
- **BE heuristic**: ~60 min
  - buildSlots function
  - fitsPrefs function
  - greedyPlacement algorithm
  - Burnout guards
- **FE toggle**: ~15 min
  - TuneStep mode selector
  - Preference controls

## Success Criteria

✅ User can toggle between strict/flexi modes
✅ Tasks are scheduled with greedy placement
✅ Burnout guards prevent overwork
✅ Calendar displays scheduled blocks
✅ Events are draggable and resizable
✅ API successfully generates plans
✅ Unit tests validate algorithm
✅ UI is responsive and intuitive

## Notes

- The greedy algorithm prioritizes deadline tasks first
- Burnout prevention is central to the design
- Flexi mode allows 20% over max hours for flexibility
- All times are in user's local timezone
- Minimum slot size is 30 minutes
- Breaks are added automatically between tasks

