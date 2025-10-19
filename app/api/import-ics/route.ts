import { NextResponse } from 'next/server';
import { saveEvents } from '@/lib/storage';

export async function POST(request) {
  try {
    const body = await request.json();
    const events = body.events || [];
    // Basic validation
    if (!Array.isArray(events)) {
      return NextResponse.json({ error: 'events must be array' }, { status: 400 });
    }

    // Save (stub) - replace with DynamoDB or Amplify storage later
    const result = await saveEvents(events);
    return NextResponse.json({ ok: true, saved: result.length });
  } catch (err) {
    console.error('import-ics error', err);
    return NextResponse.json({ error: err.message || 'unknown' }, { status: 500 });
  }
}
