
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/jwt';
import { createDatabase } from '@/lib/database';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, itemIds } = await req.json();

    if (!title || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'Missing title or itemIds' }, { status: 400 });
    }

    const db = createDatabase();
    const { id, error } = await db.createSharedSet(session.user.id, title, itemIds);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ id });

  } catch (error) {
    console.error('Error creating shared set:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
