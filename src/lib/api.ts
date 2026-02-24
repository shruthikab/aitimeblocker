// Client-side API utilities for parsing tasks, generating plans, and syncing
// data with Next.js API routes plus the external AWS-backed AI services.

import type { RecurringBlock, ScheduledBlock, Task } from '@/lib/storage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

const DEFAULT_RANGE_DAYS = 60;

export async function parseTasks(syllabusText: string): Promise<{ tasks: Task[]; count?: number }> {
  try {
    const res = await fetch(`${API_BASE_URL}/tasks/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ syllabusText }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || `Parse failed (${res.status})`);
    return data;
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to parse tasks');
  }
}

export async function generatePlan(
  tasks: Task[],
  preferences: Record<string, any>,
  existingEvents: any[] = [],
  startDate: string,
  endDate: string
): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/plan/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks, preferences, existingEvents, startDate, endDate }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || `Plan generate failed (${res.status})`);
    return data;
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to generate plan');
  }
}

export async function fetchEvents(range?: { start?: string; end?: string }): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    if (range?.start) params.set('start', range.start);
    if (range?.end) params.set('end', range.end);
    if (!range?.start && !range?.end) {
      const startIso = new Date().toISOString();
      const endIso = new Date(Date.now() + DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
      params.set('start', startIso);
      params.set('end', endIso);
    }
    const res = await fetch(`/api/events?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchPreferences(): Promise<any> {
  try {
    const res = await fetch('/api/preferences', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch preferences');
    return await res.json();
  } catch {
    return defaultPreferences();
  }
}

export async function savePreferences(preferences: Record<string, any>): Promise<any> {
  const res = await fetch('/api/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences),
  });
  if (!res.ok) {
    throw new Error('Failed to save preferences');
  }
  return res.json();
}

export async function fetchTasks(): Promise<Task[]> {
  try {
    const res = await fetch('/api/tasks', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function saveTasks(tasks: Task[]): Promise<Task[]> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks }),
  });
  if (!res.ok) throw new Error('Failed to save tasks');
  return res.json();
}

export async function fetchRecurringBlocks(): Promise<RecurringBlock[]> {
  try {
    const res = await fetch('/api/recurring', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function saveRecurringBlocks(blocks: RecurringBlock[]): Promise<RecurringBlock[]> {
  const res = await fetch('/api/recurring', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  });
  if (!res.ok) throw new Error('Failed to save recurring blocks');
  return res.json();
}

export async function fetchScheduledBlocks(): Promise<ScheduledBlock[]> {
  try {
    const res = await fetch('/api/schedule', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data?.blocks || [];
  } catch {
    return [];
  }
}

export async function saveScheduledBlocks(blocks: ScheduledBlock[]): Promise<ScheduledBlock[]> {
  const res = await fetch('/api/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error || 'Failed to save schedule');
  }
  const data = await res.json();
  return Array.isArray(data?.blocks) ? data.blocks : data;
}

export async function exportScheduleToICS(): Promise<string | null> {
  const res = await fetch('/api/export-ics');
  if (res.status === 204) {
    return null;
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || 'Nothing to export yet');
  }
  const contentType = res.headers.get('Content-Type') || '';
  if (!contentType.includes('text/calendar')) {
    const message = await res.text();
    throw new Error(message || 'Export returned unexpected response');
  }
  return await res.text();
}

export function defaultPreferences() {
  return {
    mode: 'flexi',
    workHoursStart: '09:00',
    workHoursEnd: '17:00',
    maxHoursPerDay: 8,
    breakMinutes: 15,
    preferredDays: [1, 2, 3, 4, 5],
  };
}
