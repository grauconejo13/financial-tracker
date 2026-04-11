import mongoose from 'mongoose';

/** Escape user input for safe use inside RegExp */
export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export type TransactionListQuery = {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
};

export function firstQueryString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value) && value.length > 0) {
    const f = value[0];
    if (typeof f === 'string' && f.trim()) return f.trim();
  }
  return undefined;
}

/**
 * End of day UTC for an ISO date string `YYYY-MM-DD`.
 */
export function endOfUtcDayFromDateInput(dateStr: string): Date {
  const d = new Date(`${dateStr}T23:59:59.999Z`);
  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid dateTo');
  }
  return d;
}

export function startOfUtcDayFromDateInput(dateStr: string): Date {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid dateFrom');
  }
  return d;
}

/** YYYY-MM-DD */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseTransactionListQuery(
  query: Record<string, unknown>
): TransactionListQuery {
  const category = firstQueryString(query.category);
  const dateFromRaw = firstQueryString(query.dateFrom);
  const dateToRaw = firstQueryString(query.dateTo);

  if (dateFromRaw && !DATE_RE.test(dateFromRaw)) {
    throw new Error('dateFrom must be YYYY-MM-DD');
  }
  if (dateToRaw && !DATE_RE.test(dateToRaw)) {
    throw new Error('dateTo must be YYYY-MM-DD');
  }

  const parsed: TransactionListQuery = {};
  if (category) parsed.category = category;
  if (dateFromRaw) parsed.dateFrom = dateFromRaw;
  if (dateToRaw) parsed.dateTo = dateToRaw;

  /* YYYY-MM-DD lexicographic order matches chronological order (CP-25). */
  if (parsed.dateFrom && parsed.dateTo && parsed.dateFrom > parsed.dateTo) {
    throw new Error('dateFrom must be on or before dateTo');
  }

  return parsed;
}

export type MongooseTxFilter = Record<string, unknown>;

/**
 * Build Mongo filter for listing transactions (user scoping + isDeleted applied by caller).
 */
export function buildTransactionListFilter(
  userId: mongoose.Types.ObjectId,
  listQuery: TransactionListQuery
): MongooseTxFilter {
  const filter: MongooseTxFilter = {
    user: userId,
    isDeleted: false
  };

  if (listQuery.category) {
    const c = listQuery.category;
    const or: Record<string, unknown>[] = [
      { category: new RegExp(`^${escapeRegex(c)}$`, 'i') }
    ];
    if (mongoose.isValidObjectId(c)) {
      or.push({ category: new mongoose.Types.ObjectId(c) });
    }
    filter.$or = or;
  }

  const created: Record<string, Date> = {};
  if (listQuery.dateFrom) {
    created.$gte = startOfUtcDayFromDateInput(listQuery.dateFrom);
  }
  if (listQuery.dateTo) {
    created.$lte = endOfUtcDayFromDateInput(listQuery.dateTo);
  }
  if (Object.keys(created).length > 0) {
    filter.createdAt = created;
  }

  return filter;
}
