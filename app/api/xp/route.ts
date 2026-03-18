import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import DailyLog from '@/lib/models/DailyLog';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  try {
    await connectDB();

    const users = await User.find({ username: { $in: ['bhuvi', 'karthic'] } }).lean();
    const today = todayStr();
    const logs = await DailyLog.find({ date: today }).lean();

    const result: Record<string, {
      totalXP: number;
      todayXP: number;
      todayFit: number;
      todayFin: number;
      todaySoc: number;
    }> = {
      bhuvi:   { totalXP: 0, todayXP: 0, todayFit: 0, todayFin: 0, todaySoc: 0 },
      karthic: { totalXP: 0, todayXP: 0, todayFit: 0, todayFin: 0, todaySoc: 0 },
    };

    for (const user of users) {
      const u = user as typeof users[0];
      result[u.username].totalXP = u.totalXP;
    }

    for (const log of logs) {
      const l = log as typeof logs[0];
      if (result[l.username]) {
        result[l.username].todayXP  = l.xp.total;
        result[l.username].todayFit = l.xp.fitness;
        result[l.username].todayFin = l.xp.finance;
        result[l.username].todaySoc = l.xp.social;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/xp error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
