import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import {
  escapeRegex,
  firstQueryString,
  parseTransactionListQuery,
  buildTransactionListFilter,
  endOfUtcDayFromDateInput,
  startOfUtcDayFromDateInput
} from './transactionListQuery';

describe('escapeRegex', () => {
  it('escapes metacharacters', () => {
    expect(escapeRegex('a+b')).toBe('a\\+b');
    expect(escapeRegex('test(yes)')).toBe('test\\(yes\\)');
  });
});

describe('firstQueryString', () => {
  it('reads first string', () => {
    expect(firstQueryString('  hi  ')).toBe('hi');
    expect(firstQueryString(['x', 'y'])).toBe('x');
    expect(firstQueryString(undefined)).toBeUndefined();
  });
});

describe('parseTransactionListQuery', () => {
  it('parses valid dates', () => {
    const r = parseTransactionListQuery({
      dateFrom: '2025-01-15',
      dateTo: '2025-02-01'
    });
    expect(r.dateFrom).toBe('2025-01-15');
    expect(r.dateTo).toBe('2025-02-01');
  });

  it('rejects bad date format', () => {
    expect(() =>
      parseTransactionListQuery({ dateFrom: '01-15-2025' })
    ).toThrow('dateFrom');
  });
});

describe('UTC day boundaries', () => {
  it('start of day', () => {
    const d = startOfUtcDayFromDateInput('2025-06-01');
    expect(d.toISOString()).toBe('2025-06-01T00:00:00.000Z');
  });
  it('end of day', () => {
    const d = endOfUtcDayFromDateInput('2025-06-01');
    expect(d.toISOString()).toBe('2025-06-01T23:59:59.999Z');
  });
});

describe('buildTransactionListFilter', () => {
  const uid = new mongoose.Types.ObjectId();

  it('applies category and date with implicit AND', () => {
    const f = buildTransactionListFilter(uid, {
      category: 'Food',
      dateFrom: '2025-01-01',
      dateTo: '2025-01-31'
    });
    expect(f.user).toEqual(uid);
    expect(f.isDeleted).toBe(false);
    expect(f.$or).toBeDefined();
    expect((f.createdAt as { $gte: Date }).$gte.toISOString()).toBe(
      '2025-01-01T00:00:00.000Z'
    );
    expect((f.createdAt as { $lte: Date }).$lte.toISOString()).toBe(
      '2025-01-31T23:59:59.999Z'
    );
  });
});
