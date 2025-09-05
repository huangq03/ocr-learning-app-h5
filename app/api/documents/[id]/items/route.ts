
import { NextRequest, NextResponse } from 'next/server';
import { createDatabase } from '@/lib/database';
import { getSession } from '@/lib/jwt';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
        return NextResponse.json({ error: 'Missing document ID' }, { status: 400 });
    }

    try {
        const db = createDatabase();
        const { items, error } = await db.getTextItemsForDocument(id, session.user.id);

        if (error) {
            return NextResponse.json({ error }, { status: 500 });
        }

        return NextResponse.json(items);
    } catch (error) {
        console.error('Error fetching text items:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
