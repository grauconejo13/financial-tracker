import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBlacklistedToken extends Document {
  token: string;
  expiresAt: Date;
}

const blacklistedTokenSchema = new Schema<IBlacklistedToken>(
  { token: { type: String, required: true }, expiresAt: { type: Date, required: true } },
  { timestamps: true }
);

blacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const BlacklistedToken: Model<IBlacklistedToken> = mongoose.model<IBlacklistedToken>(
  'BlacklistedToken',
  blacklistedTokenSchema
);