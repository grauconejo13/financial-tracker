import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  role: 'student' | 'admin';
  displayName?: string;
  semesterStart?: Date;
  semesterEnd?: Date;
  homeCurrency: string;
  savingsGoalLabel?: string;
  savingsGoalTarget?: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    displayName: { type: String, trim: true, maxlength: 50, default: '' },
    semesterStart: { type: Date },
    semesterEnd: { type: Date },
    homeCurrency: { type: String, default: 'CAD', uppercase: true },
    savingsGoalLabel: { type: String, trim: true, maxlength: 100, default: '' },
    savingsGoalTarget: { type: Number, min: 0 },
    role: { type: String, enum: ['student', 'admin'], default: 'student' }
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);

