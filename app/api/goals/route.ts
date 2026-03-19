import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export const dynamic = 'force-dynamic';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Goal from '@/lib/models/Goal';
import { DEFAULT_GOALS } from '@/lib/constants';

// GET: fetch goals
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const both = searchParams.get('both') === 'true';

  try {
    await connectDB();

    if (both) {
      const goals = await Goal.find({ username: { $in: ['bhuvi', 'karthic'] } }).lean();
      const result: Record<string, { fit: unknown[]; fin: unknown[]; soc: unknown[] }> = {
        bhuvi:   DEFAULT_GOALS.bhuvi,
        karthic: DEFAULT_GOALS.karthic,
      };
      for (const g of goals) {
        const goal = g as typeof goals[0];
        result[goal.username] = { fit: goal.fit, fin: goal.fin, soc: goal.soc };
      }
      return NextResponse.json(result, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const username = session.user.username;
    const goal = await Goal.findOne({ username }).lean();

    if (!goal) {
      return NextResponse.json(DEFAULT_GOALS[username]);
    }

    const g = goal as typeof goal;
    return NextResponse.json({ fit: g.fit, fin: g.fin, soc: g.soc });
  } catch (error) {
    console.error('GET /api/goals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: save goals for current user
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { fit, fin, soc } = body;

    await connectDB();

    const user = await User.findOne({ username: session.user.username });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await Goal.findOneAndUpdate(
      { userId: user._id },
      { userId: user._id, username: session.user.username, fit, fin, soc },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/goals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
