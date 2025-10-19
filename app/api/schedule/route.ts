import { NextResponse } from 'next/server';
import { getScheduledBlocks, saveScheduledBlocks } from '@/lib/storage';

export async function GET() {
  try {
    const blocks = await getScheduledBlocks();
    return NextResponse.json(blocks);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load schedule' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const blocks = Array.isArray(body?.blocks) ? body.blocks : [];
    const saved = await saveScheduledBlocks(blocks);
    return NextResponse.json({ ok: true, blocks: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to save schedule' }, { status: 400 });
  }
}
