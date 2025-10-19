import { NextResponse } from 'next/server';
import { getEvents, saveEvents } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const start = url.searchParams.get('start') || undefined;
    const end = url.searchParams.get('end') || undefined;
    const events = await getEvents({ start, end });
    return NextResponse.json(events);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const events = Array.isArray(body?.events) ? body.events : [];
    const saved = await saveEvents(events);
    return NextResponse.json(saved);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to save events' }, { status: 400 });
  }
}
