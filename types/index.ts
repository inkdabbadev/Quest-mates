import type { DefaultSession } from 'next-auth';

// ─── Auth Extensions ──────────────────────────────────────────────────────────
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: 'bhuvi' | 'karthic';
      name: string;
      emoji: string;
      color: string;
    } & DefaultSession['user'];
  }
  interface User {
    id: string;
    username: 'bhuvi' | 'karthic';
    name: string;
    emoji: string;
    color: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: 'bhuvi' | 'karthic';
    name: string;
    emoji: string;
    color: string;
  }
}

// ─── App Data Types ───────────────────────────────────────────────────────────
export type PlayerKey = 'bhuvi' | 'karthic';

/** Per-field logging flags — tracks which activities were explicitly submitted today */
export interface LoggedFields {
  workout:   boolean;
  steps:     boolean;
  water:     boolean;
  sleep:     boolean;
  savings:   boolean;
  followers: boolean;
}

export interface Checkpoint {
  id: number;
  icon: string;
  name: string;
  desc: string;
  totalXP: number;
}

export interface PlayerState {
  totalXP: number;
  todayXP: number;
  todayFit: number;
  todayFin: number;
  todaySoc: number;
  streak: number;
  longestStreak: number;
}

export interface BothPlayersState {
  bhuvi: PlayerState;
  karthic: PlayerState;
}

export interface DailyLogInput {
  workout: boolean;
  steps: number;
  water: number;
  sleep: number;
  savings: number;
  spend: number;
  followers: number;
  xpFitness: number;
  xpFinance: number;
  xpSocial: number;
}

export interface GoalMilestone {
  label: string;
  val: string;
  cls: 'ms-now' | 'ms-1m' | 'ms-3m' | 'ms-9m';
}

export interface PlayerGoals {
  fit: GoalMilestone[];
  fin: GoalMilestone[];
  soc: GoalMilestone[];
}

export interface NudgeMessage {
  text: string;
  emoji: string;
}
