import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { message } = body;

    const from = session.user.name;
    const to = session.user.username === 'bhuvi' ? 'Karthic' : 'Bhuvi';

    // In a real app, you'd send push notification / in-app notification
    // For now, we just log it and return success
    console.log(`[Nudge] ${from} → ${to}: "${message}"`);

    return NextResponse.json({ success: true, from, to, message });
  } catch (error) {
    console.error('POST /api/nudge error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
