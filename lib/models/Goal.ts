import mongoose, { Schema, Document, Model, Types } from 'mongoose';

interface GoalMilestone {
  label: string;
  val: string;
  cls: string;
}

export interface IGoal extends Document {
  userId: Types.ObjectId;
  username: 'bhuvi' | 'karthic';
  fit: GoalMilestone[];
  fin: GoalMilestone[];
  soc: GoalMilestone[];
  updatedAt: Date;
}

const MilestoneSchema = new Schema<GoalMilestone>(
  {
    label: { type: String, default: '' },
    val: { type: String, default: '' },
    cls: { type: String, default: 'ms-9m' },
  },
  { _id: false }
);

const GoalSchema = new Schema<IGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true, enum: ['bhuvi', 'karthic'] },
    fit: { type: [MilestoneSchema], default: [] },
    fin: { type: [MilestoneSchema], default: [] },
    soc: { type: [MilestoneSchema], default: [] },
  },
  { timestamps: true }
);

GoalSchema.index({ userId: 1 }, { unique: true });

const Goal: Model<IGoal> =
  mongoose.models.Goal || mongoose.model<IGoal>('Goal', GoalSchema);

export default Goal;
