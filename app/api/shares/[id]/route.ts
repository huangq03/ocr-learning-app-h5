
import { NextRequest, NextResponse } from 'next/server';
import { createDatabase } from '@/lib/database';
import { trackVisit } from '@/lib/tracking';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Missing share ID' }, { status: 400 });
  }

  try {
    // Track the visit asynchronously
    trackVisit(id, req);

    const db = createDatabase();
    const { set, items, error } = await db.getSharedSet(id);

    if (error) {
      return NextResponse.json({ error }, { status: 404 });
    }

    return NextResponse.json({ ...set, items });

  } catch (error) {
    console.error('Error fetching shared set:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
