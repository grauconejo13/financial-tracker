import { Schema, model, Document, Types } from 'mongoose';

export type AccountabilityAction =
  | 'transaction_create'
  | 'transaction_edit'
  | 'transaction_delete'
  | 'debt_create'
  | 'debt_edit'
  | 'debt_delete'
  | 'debt_payment'
  | 'income_create'
  | 'income_edit'
  | 'income_delete'
  | 'expense_create'
  | 'expense_edit'
  | 'expense_delete'
  | 'goal_create'
  | 'goal_edit'
  | 'goal_delete'
  | 'goal_contribution'
  | 'savings_deposit'
  | 'savings_withdraw'
  | 'profile_update'
  | 'password_change'
  | 'currency_change'
  | 'semester_set'
  | 'login'
  | 'login_2fa'
  | 'logout'
  | 'two_factor_setup'
  | 'two_factor_enable'
  | 'two_factor_disable'
  | 'password_reset_requested'
  | 'password_reset_completed';

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
      enum: [
        'transaction_create',
        'transaction_edit',
        'transaction_delete',
        'debt_create',
        'debt_edit',
        'debt_delete',
        'debt_payment',
        'income_create',
        'income_edit',
        'income_delete',
        'expense_create',
        'expense_edit',
        'expense_delete',
        'goal_create',
        'goal_edit',
        'goal_delete',
        'goal_contribution',
        'savings_deposit',
        'savings_withdraw',
        'profile_update',
        'password_change',
        'currency_change',
        'semester_set',
        'login',
        'login_2fa',
        'logout',
        'two_factor_setup',
        'two_factor_enable',
        'two_factor_disable',
        'password_reset_requested',
        'password_reset_completed'
      ],
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
