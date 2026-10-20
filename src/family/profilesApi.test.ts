import { describe, expect, it } from 'vitest';
import { daysBetween, parseProfiles } from './profilesApi';

const profile = {
	id: 'c-1', name: 'איתמר', icon: '🦊', family: 'משפחה', stars: 10, stickers: ['a'], streak: 2, weekStars: 4, lastPractice: '2026-10-19',
};

describe('parseProfiles', () => {
	it('accepts a list of profiles', () => {
		expect(parseProfiles({ today: '2026-10-20', profiles: [profile, { ...profile, id: 'c-2', lastPractice: null }] })?.profiles).toHaveLength(2);
	});

	it('rejects anything else', () => {
		expect(parseProfiles(null)).toBeUndefined();
		expect(parseProfiles({ profiles: [profile] })).toBeUndefined();
		expect(parseProfiles({ today: '2026-10-20', profiles: [{ ...profile, stars: '10' }] })).toBeUndefined();
	});
});

describe('daysBetween', () => {
	it('counts whole days, across months', () => {
		expect(daysBetween('2026-10-20', '2026-10-20')).toBe(0);
		expect(daysBetween('2026-10-19', '2026-10-20')).toBe(1);
		expect(daysBetween('2026-09-28', '2026-10-03')).toBe(5);
	});
});
