import { describe, expect, it } from 'vitest';
import { diffObjects, toComparableRecord } from './accountability';

describe('toComparableRecord', () => {
  it('normalizes nested objects into plain JSON-safe records', () => {
    const value = toComparableRecord({
      email: 'student@example.com',
      nested: { notifyEmail: true, notifyPush: false },
      list: ['USD', 'CAD'],
    });

    expect(value).toEqual({
      email: 'student@example.com',
      nested: { notifyEmail: true, notifyPush: false },
      list: ['USD', 'CAD'],
    });
  });
});

describe('diffObjects', () => {
  it('returns only changed fields', () => {
    const changed = diffObjects(
      {
        name: 'Nahia',
        preferredCurrency: 'USD',
        notifyEmail: true,
        notifyPush: false,
      },
      {
        name: 'Nahia Rahman',
        preferredCurrency: 'CAD',
        notifyEmail: true,
        notifyPush: false,
      }
    );

    expect(changed).toEqual(['name', 'preferredCurrency']);
  });

  it('detects nested changes using JSON comparison', () => {
    const changed = diffObjects(
      {
        before: { startDate: '2026-01-10', endDate: '2026-04-20' },
      },
      {
        before: { startDate: '2026-01-10', endDate: '2026-04-25' },
      }
    );

    expect(changed).toEqual(['before']);
  });
});
