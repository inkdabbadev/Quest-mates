import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { LoggedFields } from '@/types';

export type ILoggedFields = LoggedFields;

export interface IDailyLog extends Document {
  userId: Types.ObjectId;
  username: 'bhuvi' | 'karthic';
  date: string; // 'YYYY-MM-DD'
  fitness: {
    workout: boolean;
    steps: number;
    water: number;
    sleep: number;
  };
  finance: {
    savings: number;
    spend: number;
  };
  social: {
    followers: number;
  };
  xp: {
    fitness: number;
    finance: number;
    social: number;
    total: number;
  };
  /** Tracks which fields have been explicitly submitted at least once today */
  logged: ILoggedFields;
  createdAt: Date;
  updatedAt: Date;
}

const DailyLogSchema = new Schema<IDailyLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true, enum: ['bhuvi', 'karthic'] },
    date: { type: String, required: true },
    fitness: {
      workout: { type: Boolean, default: false },
      steps: { type: Number, default: 0 },
      water: { type: Number, default: 0 },
      sleep: { type: Number, default: 0 },
    },
    finance: {
      savings: { type: Number, default: 0 },
      spend: { type: Number, default: 0 },
    },
    social: {
      followers: { type: Number, default: 0 },
    },
    xp: {
      fitness: { type: Number, default: 0 },
      finance: { type: Number, default: 0 },
      social: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    // Per-field logging flags — set to true once the user explicitly submits a value
    logged: {
      workout:   { type: Boolean, default: false },
      steps:     { type: Boolean, default: false },
      water:     { type: Boolean, default: false },
      sleep:     { type: Boolean, default: false },
      savings:   { type: Boolean, default: false },
      followers: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// One log document per user per day (upserted, not duplicated)
DailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });
DailyLogSchema.index({ username: 1, date: 1 }); // fast lookup by username

const DailyLog: Model<IDailyLog> =
  mongoose.models.DailyLog ||
  mongoose.model<IDailyLog>('DailyLog', DailyLogSchema);

export default DailyLog;
