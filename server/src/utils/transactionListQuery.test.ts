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

  it('parses category (CP-24)', () => {
    const r = parseTransactionListQuery({ category: '  Groceries  ' });
    expect(r.category).toBe('Groceries');
  });

  it('parses category and date range together', () => {
    const r = parseTransactionListQuery({
      category: 'Food',
      dateFrom: '2025-01-01',
      dateTo: '2025-01-31'
    });
    expect(r.category).toBe('Food');
    expect(r.dateFrom).toBe('2025-01-01');
    expect(r.dateTo).toBe('2025-01-31');
  });

  it('rejects bad date format', () => {
    expect(() =>
      parseTransactionListQuery({ dateFrom: '01-15-2025' })
    ).toThrow('dateFrom');
  });

  it('rejects dateFrom after dateTo (CP-25)', () => {
    expect(() =>
      parseTransactionListQuery({
        dateFrom: '2025-02-01',
        dateTo: '2025-01-01'
      })
    ).toThrow('dateFrom must be on or before dateTo');
  });

  it('allows same-day range', () => {
    const r = parseTransactionListQuery({
      dateFrom: '2025-06-10',
      dateTo: '2025-06-10'
    });
    expect(r.dateFrom).toBe('2025-06-10');
    expect(r.dateTo).toBe('2025-06-10');
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

  it('applies category and date with implicit AND (CP-24 + CP-25)', () => {
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

  it('category only: case-insensitive exact match (CP-24)', () => {
    const f = buildTransactionListFilter(uid, { category: 'Coffee' });
    expect(f.$or).toHaveLength(1);
    const cond = (f.$or as { category: RegExp }[])[0];
    expect(cond.category).toBeInstanceOf(RegExp);
    expect(cond.category.test('coffee')).toBe(true);
    expect(cond.category.test('Coffee')).toBe(true);
    expect(cond.category.test('Coffee shop')).toBe(false);
    expect(f.createdAt).toBeUndefined();
  });

  it('date range only: no category $or (CP-25)', () => {
    const f = buildTransactionListFilter(uid, {
      dateFrom: '2025-03-01',
      dateTo: '2025-03-15'
    });
    expect(f.$or).toBeUndefined();
    expect((f.createdAt as { $gte: Date; $lte: Date }).$gte.toISOString()).toBe(
      '2025-03-01T00:00:00.000Z'
    );
    expect((f.createdAt as { $gte: Date; $lte: Date }).$lte.toISOString()).toBe(
      '2025-03-15T23:59:59.999Z'
    );
  });

  it('dateFrom only', () => {
    const f = buildTransactionListFilter(uid, { dateFrom: '2025-01-01' });
    expect(f.$or).toBeUndefined();
    expect((f.createdAt as { $gte: Date }).$gte.toISOString()).toBe(
      '2025-01-01T00:00:00.000Z'
    );
    expect((f.createdAt as { $lte?: Date }).$lte).toBeUndefined();
  });

  it('dateTo only', () => {
    const f = buildTransactionListFilter(uid, { dateTo: '2025-12-31' });
    expect(f.$or).toBeUndefined();
    expect((f.createdAt as { $lte: Date }).$lte.toISOString()).toBe(
      '2025-12-31T23:59:59.999Z'
    );
  });

  it('escapes regex metacharacters in category', () => {
    const f = buildTransactionListFilter(uid, { category: 'a+b' });
    const cond = (f.$or as { category: RegExp }[])[0];
    expect(cond.category.source).toContain('a\\+b');
  });
});
