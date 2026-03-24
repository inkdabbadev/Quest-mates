import mongoose, { Schema, Document, Model } from 'mongoose';

export type Username = 'bhuvi' | 'karthic';

export interface IUser extends Document {
  username: Username;
  name: string;
  emoji: string;
  color: string;
  pinHash: string;
  totalXP: number;
  streak: number;
  longestStreak: number;
  lastLogDate: string | null; // 'YYYY-MM-DD' in IST
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      enum: ['bhuvi', 'karthic'],
    },
    name: {
      type: String,
      required: true,
    },
    emoji: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    pinHash: {
      type: String,
      required: true,
    },
    totalXP: {
      type: Number,
      default: 0,
    },
    streak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastLogDate: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;