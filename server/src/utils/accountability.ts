import mongoose from 'mongoose';
import {
  AccountabilityLog,
  type AccountabilityAction,
} from '../models/AccountabilityLog.model';

type MaybeObjectId = string | mongoose.Types.ObjectId;

export async function logAccountabilityEvent(input: {
  userId: MaybeObjectId;
  action: AccountabilityAction;
  entityType: string;
  entityId: MaybeObjectId;
  reason: string;
  detail?: Record<string, unknown>;
}) {
  const normalize = (value: MaybeObjectId) =>
    value instanceof mongoose.Types.ObjectId
      ? value
      : new mongoose.Types.ObjectId(String(value));

  return AccountabilityLog.create({
    user: normalize(input.userId),
    action: input.action,
    entityType: input.entityType,
    entityId: normalize(input.entityId),
    reason: input.reason.trim(),
    detail: input.detail,
  });
}

export function toComparableRecord(
  value: Record<string, unknown>,
): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

export function diffObjects(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
) {
  const changed: string[] = [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changed.push(key);
    }
  }
  return changed;
}
