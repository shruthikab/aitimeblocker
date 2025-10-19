import { NextResponse } from 'next/server';
import { exportScheduleAsICS } from '@/lib/storage';

export async function GET() {
  try {
    const ics = await exportScheduleAsICS();
    if (!ics) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Cache-Control': 'no-store',
        },
      });
    }

    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="playblocks-schedule.ics"',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to export schedule' }, { status: 500 });
  }
}
