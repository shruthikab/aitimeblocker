import { NextResponse } from 'next/server';
import { getTasks, saveTasks } from '@/lib/storage';

export async function GET() {
  try {
    const tasks = await getTasks();
    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tasks = Array.isArray(body?.tasks) ? body.tasks : [];
    const saved = await saveTasks(tasks);
    return NextResponse.json(saved);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to save tasks' }, { status: 400 });
  }
}
