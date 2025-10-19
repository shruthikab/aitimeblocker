// Simple in-memory storage for development. Not for production use.
// In production, replace with DynamoDB/Amplify Data or similar.

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  source: 'imported' | 'recurring' | 'scheduled';
  meta?: Record<string, any>;
};

export type Task = {
  id: string;
  title: string;
  duration: number; // minutes
  deadline?: string | null;
  priority?: 'low' | 'medium' | 'high';
  description?: string;
};

export type RecurringBlock = {
  id: string;
  title: string;
  dayOfWeek: number; // 0 (Sun) - 6 (Sat)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  bufferBefore?: number; // minutes
  bufferAfter?: number; // minutes
};

export type ScheduledBlock = {
  id: string;
  title: string;
  start: string;
  end: string;
  taskId?: string;
  duration?: number;
  task?: Task;
};

type RawEvent = {
  id?: string;
  uid?: string;
  title?: string;
  summary?: string;
  start?: string;
  end?: string;
};

let _importedEvents: RawEvent[] = [];
let _scheduledBlocks: ScheduledBlock[] = [];
let _tasks: Task[] = [];
let _recurringBlocks: RecurringBlock[] = [];

let _preferences: any = {
  mode: 'flexi',
  workHoursStart: '09:00',
  workHoursEnd: '17:00',
  maxHoursPerDay: 8,
  breakMinutes: 15,
  preferredDays: [1, 2, 3, 4, 5],
};

const DEFAULT_RANGE_DAYS = 60;

function ensureId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

function normalizeEvent(raw: RawEvent, source: CalendarEvent['source']): CalendarEvent | null {
  if (!raw.start || !raw.end) return null;
  const title = raw.title || raw.summary || 'Untitled';
  return {
    id: raw.id || raw.uid || ensureId(source),
    title,
    start: new Date(raw.start).toISOString(),
    end: new Date(raw.end).toISOString(),
    source,
  };
}

function expandRecurringBlocks(
  blocks: RecurringBlock[],
  rangeStartIso?: string,
  rangeEndIso?: string
): CalendarEvent[] {
  if (blocks.length === 0) return [];

  const start = rangeStartIso ? new Date(rangeStartIso) : new Date();
  const end = rangeEndIso
    ? new Date(rangeEndIso)
    : new Date(Date.now() + DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000);

  const events: CalendarEvent[] = [];

  const cursor = new Date(start);
  while (cursor <= end) {
    const dayOfWeek = cursor.getDay();
    blocks
      .filter((block) => block.dayOfWeek === dayOfWeek)
      .forEach((block) => {
        const [startHour, startMinute] = block.startTime.split(':').map(Number);
        const [endHour, endMinute] = block.endTime.split(':').map(Number);

        const eventStart = new Date(cursor);
        eventStart.setHours(startHour, startMinute, 0, 0);

        const eventEnd = new Date(cursor);
        eventEnd.setHours(endHour, endMinute, 0, 0);

        if (block.bufferBefore) {
          eventStart.setMinutes(eventStart.getMinutes() - block.bufferBefore);
        }
        if (block.bufferAfter) {
          eventEnd.setMinutes(eventEnd.getMinutes() + block.bufferAfter);
        }

        events.push({
          id: `${block.id}-${eventStart.toISOString()}`,
          title: block.title,
          start: eventStart.toISOString(),
          end: eventEnd.toISOString(),
          source: 'recurring',
          meta: block,
        });
      });

    cursor.setDate(cursor.getDate() + 1);
  }

  return events;
}

export async function saveEvents(events: RawEvent[]): Promise<CalendarEvent[]> {
  const augmented = events.map((e) => ({ ...e, id: e.id || e.uid || ensureId('imported') }));
  _importedEvents = [..._importedEvents, ...augmented];
  return getEvents();
}

export async function replaceEvents(events: RawEvent[]): Promise<CalendarEvent[]> {
  _importedEvents = events.map((e) => ({ ...e, id: e.id || e.uid || ensureId('imported') }));
  return getEvents();
}

export async function clearImportedEvents(): Promise<void> {
  _importedEvents = [];
}

export async function getEvents(range?: { start?: string; end?: string }): Promise<CalendarEvent[]> {
  const imported = _importedEvents
    .map((event) => normalizeEvent(event, 'imported'))
    .filter((e): e is CalendarEvent => Boolean(e));

  const recurring = expandRecurringBlocks(_recurringBlocks, range?.start, range?.end);

  return [...imported, ...recurring].sort((a, b) => a.start.localeCompare(b.start));
}

export async function getScheduledBlocks(): Promise<ScheduledBlock[]> {
  return _scheduledBlocks;
}

export async function saveScheduledBlocks(blocks: ScheduledBlock[]): Promise<ScheduledBlock[]> {
  _scheduledBlocks = blocks.map((block) => ({
    ...block,
    id: block.id || ensureId('scheduled'),
    start: new Date(block.start).toISOString(),
    end: new Date(block.end).toISOString(),
  }));
  return _scheduledBlocks;
}

export async function getTasks(): Promise<Task[]> {
  return _tasks;
}

export async function saveTasks(tasks: Task[]): Promise<Task[]> {
  _tasks = tasks.map((task) => ({
    ...task,
    id: task.id || ensureId('task'),
    duration: typeof task.duration === 'number' ? task.duration : Number(task.duration) || 60,
  }));
  return _tasks;
}

export async function getRecurringBlocks(): Promise<RecurringBlock[]> {
  return _recurringBlocks;
}

export async function saveRecurringBlocks(blocks: RecurringBlock[]): Promise<RecurringBlock[]> {
  _recurringBlocks = blocks.map((block) => ({
    ...block,
    id: block.id || ensureId('habit'),
  }));
  return _recurringBlocks;
}

export async function getPreferences(): Promise<any> {
  return _preferences;
}

export async function updatePreferences(prefs: any): Promise<any> {
  _preferences = { ..._preferences, ...prefs };
  return _preferences;
}

export async function exportScheduleAsICS(): Promise<string | null> {
  if (!_scheduledBlocks.length) {
    return null;
  }

  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//PlayBlocks AI//EN');

  _scheduledBlocks.forEach((block) => {
    const uid = block.id || ensureId('scheduled');
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`SUMMARY:${block.title.replace(/\n/g, ' ')}`);
    lines.push(`DTSTART:${formatICSDate(block.start)}`);
    lines.push(`DTEND:${formatICSDate(block.end)}`);
    if (block.taskId) {
      lines.push(`DESCRIPTION:Task ${block.taskId}`);
    }
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function formatICSDate(iso: string): string {
  const date = new Date(iso);
  return (
    date.getUTCFullYear().toString().padStart(4, '0') +
    (date.getUTCMonth() + 1).toString().padStart(2, '0') +
    date.getUTCDate().toString().padStart(2, '0') +
    'T' +
    date.getUTCHours().toString().padStart(2, '0') +
    date.getUTCMinutes().toString().padStart(2, '0') +
    date.getUTCSeconds().toString().padStart(2, '0') +
    'Z'
  );
}

export async function resetAll(): Promise<void> {
  _importedEvents = [];
  _scheduledBlocks = [];
  _tasks = [];
  _recurringBlocks = [];
}

export async function debugSnapshot(): Promise<{
  imported: RawEvent[];
  tasks: Task[];
  recurring: RecurringBlock[];
  scheduled: ScheduledBlock[];
  preferences: any;
}> {
  return {
    imported: _importedEvents,
    tasks: _tasks,
    recurring: _recurringBlocks,
    scheduled: _scheduledBlocks,
    preferences: _preferences,
  };
}
