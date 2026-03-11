import { Schema, model, Document, Types } from 'mongoose';

export interface IDebt extends Document {
  user: Types.ObjectId;
  label: string;
  counterparty?: string;
  amount: number;
  currency: string;
  direction: 'owed_by_me' | 'owed_to_me';
  dueDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DebtSchema = new Schema<IDebt>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    label: { type: String, required: true, trim: true },
    counterparty: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'LKR' },
    direction: {
      type: String,
      enum: ['owed_by_me', 'owed_to_me'],
      default: 'owed_by_me'
    },
    dueDate: { type: Date },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

export const Debt = model<IDebt>('Debt', DebtSchema);

