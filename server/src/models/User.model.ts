import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'admin';
  phone: string;
  country: string;
  preferredCurrency: string;
  timezone: string;
  avatar: string;
  language: string;
  studentId: string;
  program: string;
  /** Stored as Mixed so Mongo/Mongoose accept null and positive numbers */
  monthlyBudgetTarget: number | null;
  notifyEmail: boolean;
  notifyPush: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, trim: true, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },
    preferredCurrency: { type: String, trim: true, default: 'USD' },
    timezone: { type: String, trim: true, default: '' },
    avatar: { type: String, default: '', maxlength: 500_000 },
    language: { type: String, trim: true, default: 'en' },
    studentId: { type: String, trim: true, default: '' },
    program: { type: String, trim: true, default: '' },
    monthlyBudgetTarget: {
      type: Schema.Types.Mixed,
      default: null,
      validate: {
        validator(v: unknown) {
          if (v === null || v === undefined) return true;
          const n = typeof v === 'number' ? v : Number(v);
          return !Number.isNaN(n) && n >= 0;
        },
        message: 'Budget must be a non-negative number or empty',
      },
    },
    notifyEmail: { type: Boolean, default: true },
    notifyPush: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false, default: '' },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);

