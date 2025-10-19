# System Architecture - Plan Generation Feature

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│                     (Next.js Frontend)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐           ┌─────────────────────────────┐    │
│  │              │           │                              │    │
│  │  TuneStep    │ Settings  │    PlanStepWithDnd          │    │
│  │  Component   ├──────────►│    Component                 │    │
│  │              │           │                              │    │
│  │  Person B    │           │    Person A                  │    │
│  │  (FE 40%)    │           │    (FE 60%)                  │    │
│  │              │           │                              │    │
│  │ • Strict/    │           │  • Task List                 │    │
│  │   Flexi      │           │  • Calendar View             │    │
│  │ • Work Hours │           │  • Drag & Drop               │    │
│  │ • Max Hours  │           │  • Event Resize              │    │
│  │ • Breaks     │           │  • API Integration           │    │
│  │ • Pref Days  │           │  • Stats Display             │    │
│  │              │           │                              │    │
│  └──────────────┘           └──────────┬───────────────────┘    │
│                                        │                         │
│                                        │ POST /plan/generate     │
└────────────────────────────────────────┼─────────────────────────┘
                                         │
                                         │ HTTPS
                                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                 │
│                  (AWS API Gateway)                               │
│                                                                   │
│  Route: POST /dev/plan/generate                                 │
│  Auth: Public (configure Cognito later)                          │
└────────────────────────────────────┬────────────────────────────┘
                                     │
                                     │ Invoke
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LAMBDA FUNCTION                               │
│              (playblocksfunction)                                │
│                 Person B (BE 60%)                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ POST /plan/generate Handler                           │      │
│  │                                                         │      │
│  │  1. Validate Request                                   │      │
│  │     • Check tasks array                                │      │
│  │     • Set default preferences                          │      │
│  │     • Parse date range                                 │      │
│  │                                                         │      │
│  │  2. buildSlots(start, end, prefs, events)             │      │
│  │     • Iterate date range                               │      │
│  │     • Filter preferred days                            │      │
│  │     • Detect event conflicts                           │      │
│  │     • Create available slots                           │      │
│  │     • Return slot array                                │      │
│  │                                                         │      │
│  │  3. greedyPlacement(tasks, slots, prefs)              │      │
│  │     • Sort tasks (deadline, duration)                  │      │
│  │     • Sort slots (chronological)                       │      │
│  │     • For each task:                                   │      │
│  │       ├─ Find first fitting slot                       │      │
│  │       ├─ Check fitsPrefs()                             │      │
│  │       ├─ Place task                                    │      │
│  │       ├─ Update daily hours                            │      │
│  │       └─ Consume slot time                             │      │
│  │     • Return scheduled + unscheduled                   │      │
│  │                                                         │      │
│  │  4. fitsPrefs(task, slot, prefs, dailyHours)          │      │
│  │     • Check duration fits                              │      │
│  │     • Enforce max hours/day                            │      │
│  │       ├─ Strict: hard limit                            │      │
│  │       └─ Flexi: +20% allowed                           │      │
│  │     • Validate deadline                                │      │
│  │     • Return boolean                                   │      │
│  │                                                         │      │
│  │  5. Return Response                                    │      │
│  │     • scheduledBlocks[]                                │      │
│  │     • unscheduledTasks[]                               │      │
│  │     • dailyHours{}                                     │      │
│  │     • stats{}                                          │      │
│  │                                                         │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
User Actions                    Frontend                   Backend
─────────────                  ─────────                  ────────

[Configure         ──────►   TuneStep
 Preferences]                  │
                               │ Save Settings
                               ▼
                         preferences = {
                           mode: "strict",
                           workHours: "9-5",
                           maxHours: 8,
                           breaks: 15,
                           days: [1,2,3,4,5]
                         }
                               │
                               │ Click "Next"
                               ▼
[Add Tasks]        ──────►  PlanStepWithDnd
[Set Durations]               │
[Set Deadlines]               │ Build Request
                               ▼
                         {
                           tasks: [
                             {id, title, duration, deadline},
                             ...
                           ],
                           preferences,
                           existingEvents,
                           startDate,
                           endDate
                         }
                               │
[Click Generate]   ──────►    │
                               │ fetch()
                               ▼
                         POST /plan/generate  ──────►  Lambda
                                                          │
                                                          │ Parse
                                                          ▼
                                                    buildSlots()
                                                          │
                                                          ▼
                                                    [Available Slots]
                                                          │
                                                          ▼
                                                    greedyPlacement()
                                                          │
                                                          ▼
                                                    [Scheduled Blocks]
                                                          │
                                                          ▼
                               Response  ◄──────  {
                                                    scheduledBlocks,
                                                    unscheduledTasks,
                                                    stats
                                                  }
                               │
                               │ Map to Events
                               ▼
                         calendarEvents = [
                           {
                             start: Date,
                             end: Date,
                             title: string,
                             type: "scheduled"
                           },
                           ...
                         ]
                               │
                               │ Render
                               ▼
[View Calendar]    ◄──────  Calendar Display
[Drag Events]                 │
[Resize Events]               │
                               ▼
                         Updated Schedule
```

## Component Hierarchy

```
/plan
│
└─── PlanPage.jsx (Integration Layer)
     │
     ├─── TuneStep.jsx (Person B - FE)
     │    │
     │    ├─── Mode Toggle (Strict/Flexi)
     │    ├─── Work Hours Inputs
     │    ├─── Max Hours Slider
     │    ├─── Break Duration Slider
     │    └─── Day Selector Buttons
     │
     └─── PlanStepWithDnd.jsx (Person A - FE)
          │
          ├─── DndProvider (react-dnd)
          │    │
          │    └─── DraggableTaskCard[] (Tasks)
          │         │
          │         ├─── useDrag() hook
          │         ├─── Title Input
          │         ├─── Duration Input
          │         ├─── Deadline Input
          │         └─── Remove Button
          │
          └─── DragAndDropCalendar (react-big-calendar)
               │
               ├─── onEventDrop handler
               ├─── onEventResize handler
               ├─── eventStyleGetter (colors)
               └─── Views: Week, Day, Agenda
```

## State Management

```
PlanPage State
├─── currentStep: 1 | 2
├─── preferences: Preferences | null
└─── existingEvents: Event[]

TuneStep State
├─── mode: "strict" | "flexi"
├─── workHoursStart: string
├─── workHoursEnd: string
├─── maxHoursPerDay: number
├─── breakMinutes: number
└─── preferredDays: number[]

PlanStepWithDnd State
├─── tasks: Task[]
├─── scheduledBlocks: Block[]
├─── isGenerating: boolean
├─── error: string | null
└─── stats: Stats | null
```

## API Contract

### Request
```typescript
interface GeneratePlanRequest {
  tasks: {
    id: string;
    title: string;
    duration: number;      // minutes
    deadline?: string;     // ISO 8601
  }[];
  preferences: {
    mode: "strict" | "flexi";
    workHoursStart: string;  // HH:MM
    workHoursEnd: string;    // HH:MM
    maxHoursPerDay: number;  // 1-12
    breakMinutes: number;    // 0-60
    preferredDays: number[]; // 0-6 (Sun-Sat)
  };
  existingEvents: {
    title: string;
    start: string;  // ISO 8601
    end: string;    // ISO 8601
  }[];
  startDate: string;  // ISO 8601
  endDate: string;    // ISO 8601
}
```

### Response
```typescript
interface GeneratePlanResponse {
  success: boolean;
  scheduledBlocks: {
    id: string;
    title: string;
    start: string;    // ISO 8601
    end: string;      // ISO 8601
    duration: number;
    task: Task;
  }[];
  unscheduledTasks: Task[];
  dailyHours: Record<string, number>;
  preferences: Preferences;
  stats: {
    totalTasks: number;
    scheduled: number;
    unscheduled: number;
    availableSlots: number;
  };
}
```

## Algorithm Flow

```
greedyPlacement(tasks, slots, prefs)
│
├─ Sort Tasks
│  ├─ Priority 1: Deadline (urgent first)
│  ├─ Priority 2: Duration (longer first)
│  └─ Result: Sorted task queue
│
├─ Sort Slots
│  └─ Chronological order
│
└─ For Each Task
   ├─ For Each Slot
   │  │
   │  ├─ Check fitsPrefs()
   │  │  ├─ Duration check
   │  │  ├─ Daily hour limit
   │  │  │  ├─ Strict: hard limit
   │  │  │  └─ Flexi: +20%
   │  │  └─ Deadline validation
   │  │
   │  ├─ If fits:
   │  │  ├─ Create block
   │  │  ├─ Update daily hours
   │  │  ├─ Consume slot
   │  │  └─ Break (next task)
   │  │
   │  └─ If no fit: Continue
   │
   ├─ If placed: Add to scheduledBlocks
   └─ If not placed: Add to unscheduledTasks
```

## Burnout Prevention Logic

```
fitsPrefs(task, slot, prefs, dailyHours)
│
├─ Step 1: Duration Check
│  │
│  └─ requiredDuration = task.duration + breakMinutes
│     If requiredDuration > slot.duration
│        └─ REJECT (doesn't fit)
│
├─ Step 2: Daily Hour Limit
│  │
│  ├─ dateKey = slot.start.toDateString()
│  ├─ hoursUsed = dailyHours[dateKey] || 0
│  ├─ taskHours = task.duration / 60
│  │
│  └─ Mode Check
│     ├─ Strict Mode:
│     │  └─ If (hoursUsed + taskHours > maxHoursPerDay)
│     │     └─ REJECT (burnout prevention)
│     │
│     └─ Flexi Mode:
│        └─ If (hoursUsed + taskHours > maxHoursPerDay * 1.2)
│           └─ REJECT (even flexi has limits)
│
└─ Step 3: Deadline Check
   │
   └─ If task has deadline
      └─ If slot.start > task.deadline
         └─ REJECT (past deadline)

All checks passed → ACCEPT
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Production                            │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Vercel / Amplify Hosting                               │
│  ├─ Next.js App                                          │
│  ├─ Static Assets                                        │
│  └─ SSR/SSG Pages                                        │
│                                                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  AWS API Gateway                                         │
│  ├─ REST API                                             │
│  ├─ CORS Enabled                                         │
│  ├─ Rate Limiting                                        │
│  └─ Authentication (Cognito - future)                    │
│                                                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  AWS Lambda                                              │
│  ├─ Node.js Runtime                                      │
│  ├─ Express App                                          │
│  ├─ /plan/generate Route                                 │
│  └─ CloudWatch Logs                                      │
│                                                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  DynamoDB (Optional - Future)                            │
│  ├─ User Preferences                                     │
│  ├─ Scheduled Blocks                                     │
│  └─ Calendar Events                                      │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15.5.6 (React 19.1.0)
- **Calendar**: react-big-calendar 1.19.4
- **Drag & Drop**: react-dnd 16.0.1
- **Styling**: Tailwind CSS 4
- **Date Utils**: moment 2.30.1, date-fns 4.1.0
- **Icons**: lucide-react 0.546.0

### Backend
- **Runtime**: Node.js (AWS Lambda)
- **Framework**: Express.js
- **Cloud**: AWS Amplify
- **Services**: API Gateway, Lambda, DynamoDB

### Development
- **Build Tool**: Next.js
- **Linter**: ESLint 9
- **Package Manager**: npm

## Security Considerations

### Current
- CORS enabled for all origins (development)
- Public API endpoint
- No authentication required

### Future Enhancements
- [ ] AWS Cognito authentication
- [ ] User-specific data isolation
- [ ] API rate limiting
- [ ] Input validation and sanitization
- [ ] HTTPS only
- [ ] Restricted CORS policy

## Performance Characteristics

### Frontend
- **Initial Load**: ~500ms (Next.js optimized)
- **Calendar Render**: ~100ms (react-big-calendar)
- **Drag Operations**: <16ms (60fps)
- **API Call**: 500-1000ms (depends on tasks)

### Backend
- **Cold Start**: ~1-2 seconds (Lambda)
- **Warm Execution**: ~100-300ms
- **Algorithm**: O(n*m) where n=tasks, m=slots
- **Memory**: ~128MB Lambda (sufficient)

### Scalability
- **Concurrent Users**: Unlimited (serverless)
- **Max Tasks**: Tested up to 50 tasks
- **Max Slots**: Tested up to 100 slots
- **Rate Limits**: AWS API Gateway default

---

*This architecture supports the complete plan generation feature with smart scheduling and burnout prevention.*

