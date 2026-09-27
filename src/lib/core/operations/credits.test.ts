import { describe, expect, it } from 'vitest';

import { currentWeekStart } from './credits.js';

/**
 * `currentWeekStart` must mirror Postgres `date_trunc('week', …)` (Monday
 * 00:00 UTC) — the app-layer fail-fast check and the `consume_credits`
 * guard would otherwise disagree on which week a seed belongs to.
 */
describe('currentWeekStart', () => {
	it('maps Sunday to the previous Monday', () => {
		expect(currentWeekStart(new Date('2026-09-27T23:59:59Z'))).toBe('2026-09-21');
	});

	it('keeps Monday on the same day', () => {
		expect(currentWeekStart(new Date('2026-09-28T00:00:00Z'))).toBe('2026-09-28');
	});

	it('maps mid-week days back to Monday', () => {
		expect(currentWeekStart(new Date('2026-09-30T12:00:00Z'))).toBe('2026-09-28');
	});

	it('handles month and year boundaries', () => {
		expect(currentWeekStart(new Date('2026-10-01T00:00:00Z'))).toBe('2026-09-28');
		expect(currentWeekStart(new Date('2026-01-01T00:00:00Z'))).toBe('2025-12-29');
	});
});
