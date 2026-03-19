import type { Checkpoint, GoalMilestone, PlayerGoals } from '@/types';

export const CHECKPOINTS: Checkpoint[] = [
  { id: 0,  icon: '🏁', name: 'Quest Begins',  desc: "You showed up. That's everything.",       totalXP: 0    },
  { id: 1,  icon: '🌱', name: 'First Steps',    desc: 'Week 1 done. Habit forming.',             totalXP: 100  },
  { id: 2,  icon: '🔥', name: 'On Fire',        desc: "2 weeks consistent. You're heating up.", totalXP: 300  },
  { id: 3,  icon: '⚡', name: 'Momentum',       desc: '1 month in. No stopping now.',            totalXP: 700  },
  { id: 4,  icon: '💪', name: 'Grinder',        desc: '45 days strong. Discipline is real.',     totalXP: 1200 },
  { id: 5,  icon: '🎯', name: 'Locked In',      desc: '2 months. The grind is your identity.',   totalXP: 1800 },
  { id: 6,  icon: '🚀', name: 'Breakthrough',   desc: "3 months. You've crossed the wall.",      totalXP: 2500 },
  { id: 7,  icon: '💥', name: 'Unstoppable',    desc: '4 months. You two are different now.',    totalXP: 3300 },
  { id: 8,  icon: '🌟', name: 'Elite Mode',     desc: '6 months. Top 1% mindset.',               totalXP: 4300 },
  { id: 9,  icon: '🔱', name: 'Legend',         desc: '7 months. Everyone is watching.',         totalXP: 5500 },
  { id: 10, icon: '👑', name: 'Dynasty',        desc: '8 months. Almost at the summit.',         totalXP: 6900 },
  { id: 11, icon: '❤️', name: 'Champion',       desc: '9 months. The quest is complete.',        totalXP: 8500 },
];

// Normalized waypoints [x%, y%] on map canvas
export const WAYPOINTS: [number, number][] = [
  [8, 88], [18, 75], [28, 64], [38, 54], [50, 46], [60, 38],
  [68, 54], [55, 66], [65, 76], [75, 62], [83, 48], [90, 28],
];

export const PLAYER_CONFIG = {
  bhuvi: { name: 'Bhuvi', emoji: '🦁', color: '#FF6B35', colorClass: 'bhuvi' },
  karthic: { name: 'Karthic', emoji: '🐯', color: '#4ECDC4', colorClass: 'karthic' },
} as const;

export const NUDGE_MESSAGES = [
  { text: 'Log workout da', emoji: '💪' },
  { text: 'Update savings', emoji: '💰' },
  { text: 'Follower count?', emoji: '📱' },
  { text: 'Fill your log!', emoji: '⚡' },
];

// XP values
export const XP = {
  WORKOUT: 20,
  STEPS: 10,       // if >= 8000
  WATER: 5,        // if >= 2L
  SAVINGS: 20,     // if > 0
  FOLLOWERS: 10,   // if > 0
  STEPS_THRESHOLD: 8000,
  WATER_THRESHOLD: 2,
} as const;

// Default goals data
const EMPTY_MILESTONE_SET: PlayerGoals = {
  fit: [
    { label: '', val: '', cls: 'ms-now' },
    { label: '', val: '', cls: 'ms-9m' },
  ],
  fin: [
    { label: '', val: '', cls: 'ms-now' },
    { label: '', val: '', cls: 'ms-1m' },
    { label: '', val: '', cls: 'ms-3m' },
    { label: '', val: '', cls: 'ms-9m' },
  ],
  soc: [
    { label: '', val: '', cls: 'ms-now' },
    { label: '', val: '', cls: 'ms-1m' },
    { label: '', val: '', cls: 'ms-3m' },
    { label: '', val: '', cls: 'ms-9m' },
  ],
};

export const DEFAULT_GOALS: Record<'bhuvi' | 'karthic', PlayerGoals> = {
  bhuvi:   EMPTY_MILESTONE_SET,
  karthic: EMPTY_MILESTONE_SET,
};

// ─── XP Utils ─────────────────────────────────────────────────────────────────
export function getCurrentCP(xp: number): number {
  let cp = 0;
  for (let i = CHECKPOINTS.length - 1; i >= 0; i--) {
    if (xp >= CHECKPOINTS[i].totalXP) { cp = i; break; }
  }
  return cp;
}

export function getProgress(xp: number, cpIdx: number): number {
  if (cpIdx >= CHECKPOINTS.length - 1) return 100;
  const span = CHECKPOINTS[cpIdx + 1].totalXP - CHECKPOINTS[cpIdx].totalXP;
  const done = xp - CHECKPOINTS[cpIdx].totalXP;
  return Math.min(100, Math.round((done / span) * 100));
}

export function getLevel(xp: number): number {
  return Math.floor(xp / 500) + 1;
}

// Build SVG path from WAYPOINTS
export function buildPath(W: number, H: number): string {
  const pts = WAYPOINTS.map(([px, py]) => [W * px / 100, H * py / 100]);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1], cur = pts[i];
    const cpx = (prev[0] + cur[0]) / 2;
    const cpy = (prev[1] + cur[1]) / 2;
    d += ` Q ${prev[0]} ${prev[1]} ${cpx} ${cpy}`;
  }
  d += ` L ${pts[pts.length - 1][0]} ${pts[pts.length - 1][1]}`;
  return d;
}
