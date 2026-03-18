import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Goal from '@/lib/models/Goal';
import { DEFAULT_GOALS } from '@/lib/constants';

// GET /api/seed — Seeds initial Bhuvi & Karthic users (run once)
export async function GET() {
  // Only allow seeding in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Seeding not allowed in production' }, { status: 403 });
  }

  try {
    await connectDB();

    const players = [
      { username: 'bhuvi',   name: 'Bhuvi',   emoji: '🦁', color: '#FF6B35', pin: '1111' },
      { username: 'karthic', name: 'Karthic', emoji: '🐯', color: '#4ECDC4', pin: '2222' },
    ];

    const results = [];

    for (const player of players) {
      const existing = await User.findOne({ username: player.username });

      if (existing) {
        results.push({ username: player.username, status: 'already exists' });
        continue;
      }

      const pinHash = await bcrypt.hash(player.pin, 12);
      const user = await User.create({
        username: player.username,
        name: player.name,
        emoji: player.emoji,
        color: player.color,
        pinHash,
        totalXP: 0,
      });

      // Create default goals
      await Goal.create({
        userId: user._id,
        username: player.username,
        ...DEFAULT_GOALS[player.username as 'bhuvi' | 'karthic'],
      });

      results.push({ username: player.username, status: 'created', pin: player.pin });
    }

    return NextResponse.json({
      success: true,
      message: 'Seed complete! Change PINs after first login.',
      results,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Seed failed', details: String(error) }, { status: 500 });
  }
}
