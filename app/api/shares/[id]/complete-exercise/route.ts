
import { NextRequest, NextResponse } from 'next/server';
import { trackEngagement } from '@/lib/tracking';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Missing share ID' }, { status: 400 });
  }

  try {
    // Track the engagement asynchronously
    trackEngagement(id);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error tracking engagement:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
