export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import DailyLog from '@/lib/models/DailyLog';
import type { LoggedFields as ILoggedFields } from '@/types';
import { XP, CHECKPOINTS, getCurrentCP } from '@/lib/constants';

function todayStr(): string {
  // IST = UTC+5:30; use consistent local date for India users
  const ist = new Date(Date.now() + 19800000);
  return ist.toISOString().slice(0, 10);
}

/** Parse a YYYY-MM-DD string as an explicit UTC midnight timestamp.
 *  Using Date.UTC() avoids any runtime-timezone or DST ambiguity that
 *  can occur when passing a bare date string to `new Date()`. */
function parseDayUTC(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/**
 * Streak logic with 1-day grace period.
 *
 * Rules:
 *   - diff === 0 → already logged today, streak unchanged
 *   - diff === 1 → consecutive day, streak +1
 *   - diff === 2 → missed 1 day (grace), streak +1 (streak survives a single missed day)
 *   - diff  > 2 → missed 2+ days, streak resets to 1
 *   - no lastLogDate → first ever log, streak starts at 1
 */
function calcStreak(lastLogDate: string | null, today: string, currentStreak: number): number {
  if (!lastLogDate) return 1;
  // Both strings are YYYY-MM-DD (IST) — compare as pure UTC midnight values
  // so the result is always an exact integer regardless of server timezone.
  const diffDays = (parseDayUTC(today) - parseDayUTC(lastLogDate)) / 86400000;
  if (diffDays === 0) return currentStreak;          // already logged today
  if (diffDays <= 2) return currentStreak + 1;       // consecutive or 1 grace day
  return 1;                                           // broke streak
}

const EMPTY_LOGGED: ILoggedFields = {
  workout: false, steps: false, water: false,
  sleep: false, savings: false, followers: false,
};

/** Server-side XP calculation — never trust the client's numbers */
function calcXP(
  fitness: { workout: boolean; steps: number; water: number },
  finance: { savings: number },
  social: { followers: number }
) {
  let fit = 0, fin = 0, soc = 0;
  if (fitness.workout)                          fit += XP.WORKOUT;
  if (fitness.steps >= XP.STEPS_THRESHOLD)      fit += XP.STEPS;
  if (fitness.water >= XP.WATER_THRESHOLD)      fit += XP.WATER;
  if (finance.savings > 0)                      fin += XP.SAVINGS;
  if (social.followers > 0)                     soc += XP.FOLLOWERS;
  return { fitness: fit, finance: fin, social: soc, total: fit + fin + soc };
}

// ── GET: today's log for both users ──────────────────────────────────────────
export async function GET() {
  try {
    await connectDB();
    const today = todayStr();
    const logs = await DailyLog.find({ date: today }).lean();

    type LogEntry = {
      submitted: boolean;
      xp: { fitness: number; finance: number; social: number; total: number };
      fitness: { workout: boolean; steps: number; water: number; sleep: number };
      finance: { savings: number; spend: number };
      social: { followers: number };
      logged: ILoggedFields;
    };

    const empty = (): LogEntry => ({
      submitted: false,
      xp: { fitness: 0, finance: 0, social: 0, total: 0 },
      fitness: { workout: false, steps: 0, water: 0, sleep: 0 },
      finance: { savings: 0, spend: 0 },
      social: { followers: 0 },
      logged: { ...EMPTY_LOGGED },
    });

    const result: Record<string, LogEntry> = {
      bhuvi: empty(),
      karthic: empty(),
    };

    for (const log of logs) {
      const l = log as typeof logs[0] & { logged?: ILoggedFields };
      if (result[l.username]) {
        result[l.username].submitted  = true;
        result[l.username].xp        = l.xp;
        result[l.username].fitness   = l.fitness;
        result[l.username].finance   = l.finance;
        result[l.username].social    = l.social;
        result[l.username].logged    = l.logged ?? { ...EMPTY_LOGGED };
      }
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err) {
    console.error('GET /api/log error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST: submit or update today's log (upsert — allowed any time) ────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const username = session.user.username;
  const today = todayStr();

  try {
    const body = await req.json();
    const {
      workout,      // boolean
      steps,        // number | undefined
      water,        // number | undefined
      sleep,        // number | undefined
      savings,      // number | undefined
      spend,        // number | undefined
      followers,    // number | undefined
      loggedFields, // string[] — which fields the user explicitly filled
    } = body;

    await connectDB();

    const [user, existing] = await Promise.all([
      User.findOne({ username }),
      DailyLog.findOne({ username, date: today }),
    ]);

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // ── Merge submitted values with existing (only override defined fields) ──
    const ex = existing as typeof existing & { logged?: ILoggedFields } | null;

    const mergedFitness = {
      workout:  workout  !== undefined ? Boolean(workout)    : (ex?.fitness?.workout  ?? false),
      steps:    steps    !== undefined ? (Number(steps)   || 0) : (ex?.fitness?.steps   ?? 0),
      water:    water    !== undefined ? (Number(water)   || 0) : (ex?.fitness?.water   ?? 0),
      sleep:    sleep    !== undefined ? (Number(sleep)   || 0) : (ex?.fitness?.sleep   ?? 0),
    };
    const mergedFinance = {
      savings:  savings  !== undefined ? (Number(savings) || 0) : (ex?.finance?.savings ?? 0),
      spend:    spend    !== undefined ? (Number(spend)   || 0) : (ex?.finance?.spend   ?? 0),
    };
    const mergedSocial = {
      followers: followers !== undefined ? (Number(followers) || 0) : (ex?.social?.followers ?? 0),
    };

    // ── Server-side XP (ignore whatever the client sent) ─────────────────────
    const newXP = calcXP(mergedFitness, mergedFinance, mergedSocial);

    // Block fresh logs with absolutely no data
    const hasAnyData =
      mergedFitness.workout ||
      mergedFitness.steps > 0 ||
      mergedFitness.water > 0 ||
      mergedFitness.sleep > 0 ||
      mergedFinance.savings > 0 ||
      mergedSocial.followers > 0;

    if (!hasAnyData && !ex) {
      return NextResponse.json({ error: 'Fill in at least one activity' }, { status: 400 });
    }

    // ── Accumulate logged flags (once logged, always logged) ──────────────────
    const lf: string[] = Array.isArray(loggedFields) ? loggedFields : [];
    const prevLogged = ex?.logged ?? { ...EMPTY_LOGGED };
    const newLogged: ILoggedFields = {
      workout:   !!(prevLogged.workout   || lf.includes('workout')),
      steps:     !!(prevLogged.steps     || lf.includes('steps')),
      water:     !!(prevLogged.water     || lf.includes('water')),
      sleep:     !!(prevLogged.sleep     || lf.includes('sleep')),
      savings:   !!(prevLogged.savings   || lf.includes('savings')),
      followers: !!(prevLogged.followers || lf.includes('followers')),
    };

    // ── XP diff: only adjust what actually changed ────────────────────────────
    const oldXPTotal = ex?.xp?.total ?? 0;
    const xpDiff     = newXP.total - oldXPTotal;
    const prevCP     = getCurrentCP(user.totalXP);
    const newTotalXP = user.totalXP + xpDiff;
    const newCP      = getCurrentCP(newTotalXP);

    // ── Streak: only update when this is the first log of today ──────────────
    const isFirstLogToday  = !ex; // no existing log document means first submit today
    const currentStreak    = user.streak ?? 0;
    const newStreak        = isFirstLogToday
      ? calcStreak(user.lastLogDate ?? null, today, currentStreak)
      : currentStreak;
    const newLongestStreak = Math.max(user.longestStreak ?? 0, newStreak);

    // ── Upsert the daily log ──────────────────────────────────────────────────
    await DailyLog.findOneAndUpdate(
      { username, date: today },
      {
        $set: {
          fitness: mergedFitness,
          finance: mergedFinance,
          social:  mergedSocial,
          xp:      newXP,
          logged:  newLogged,
        },
        $setOnInsert: {
          userId: user._id,
          username,
          date: today,
        },
      },
      { upsert: true, new: true }
    );

    // ── Update user total XP and streak ──────────────────────────────────────
    const userUpdate: Record<string, unknown> = {};
    if (xpDiff !== 0) userUpdate['$inc'] = { totalXP: xpDiff };
    if (isFirstLogToday) {
      userUpdate['$set'] = {
        streak: newStreak,
        longestStreak: newLongestStreak,
        lastLogDate: today,
      };
    }
    if (Object.keys(userUpdate).length > 0) {
      await User.updateOne({ username }, userUpdate);
    }

    const isAllLogged = Object.values(newLogged).every(Boolean);

    return NextResponse.json({
      success:       true,
      xpEarned:      newXP.total,
      xpDiff,
      newTotalXP,
      prevCP,
      newCP,
      isAllLogged,
      logged:        newLogged,
      checkpoint:    newCP > prevCP ? CHECKPOINTS[newCP] : undefined,
      streak:        newStreak,
      longestStreak: newLongestStreak,
      isNewStreakDay: isFirstLogToday,
    });
  } catch (err) {
    console.error('POST /api/log error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
