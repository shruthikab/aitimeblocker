import { NextResponse } from 'next/server';
import { getRecurringBlocks, saveRecurringBlocks } from '@/lib/storage';

export async function GET() {
  try {
    const blocks = await getRecurringBlocks();
    return NextResponse.json(blocks);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load recurring blocks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const blocks = Array.isArray(body?.blocks) ? body.blocks : [];
    const saved = await saveRecurringBlocks(blocks);
    return NextResponse.json(saved);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to save recurring blocks' }, { status: 400 });
  }
}
