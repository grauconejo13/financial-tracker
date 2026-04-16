import { Schema, model, Document, Types } from 'mongoose';

export interface ITransaction extends Document {
  user: Types.ObjectId;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category?: string | Types.ObjectId;
  sourceType?: 'income' | 'expense' | 'transaction';
  sourceId?: Types.ObjectId;

  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  deleteReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true, trim: true },
    category: { type: Schema.Types.Mixed },
    sourceType: {
      type: String,
      enum: ['income', 'expense', 'transaction'],
      default: 'transaction'
    },
    sourceId: { type: Schema.Types.ObjectId },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deleteReason: { type: String }
  },
  { timestamps: true }
);

TransactionSchema.index({ user: 1, sourceType: 1, sourceId: 1 }, { unique: true, sparse: true });

export const Transaction = model<ITransaction>('Transaction', TransactionSchema);

