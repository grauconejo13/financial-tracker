import { Schema, model, Document, Types } from 'mongoose';

export type AccountabilityAction =
  | 'transaction_create'
  | 'transaction_edit'
  | 'transaction_delete';

export interface IAccountabilityLog extends Document {
  user: Types.ObjectId;
  action: AccountabilityAction;
  entityType: string;
  entityId: Types.ObjectId;
  reason: string;
  detail?: Record<string, unknown>;
  createdAt: Date;
}

const AccountabilityLogSchema = new Schema<IAccountabilityLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: {
      type: String,
      enum: ['transaction_create', 'transaction_edit', 'transaction_delete'],
      required: true
    },
    entityType: { type: String, required: true, default: 'transaction' },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    reason: { type: String, required: true, trim: true },
    detail: { type: Schema.Types.Mixed }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AccountabilityLogSchema.index({ user: 1, createdAt: -1 });

export const AccountabilityLog = model<IAccountabilityLog>(
  'AccountabilityLog',
  AccountabilityLogSchema
);
