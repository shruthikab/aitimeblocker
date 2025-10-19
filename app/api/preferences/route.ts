import { NextResponse } from 'next/server';
import { getPreferences, updatePreferences } from '@/lib/storage';

export async function GET() {
  try {
    const prefs = await getPreferences();
    return NextResponse.json(prefs);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load preferences' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updated = await updatePreferences(body || {});
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update preferences' }, { status: 400 });
  }
}
