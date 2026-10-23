import { describe, expect, it } from 'vitest';
import { earnedStickers, newStickers } from './stickers';
import type { Question } from '@/types';
import {
	applyAnswer,
	applyMistake,
	applySession,
	dayStreak,
	defaultProgress,
	parseProgress,
	successRate,
	type SessionRecord,
} from './state';

const session = (at: string, correct = 5, total = 10): SessionRecord => ({
	at, set: 'math-mix', correct, total, stars: 0, seconds: 60,
});

describe('earnedStickers', () => {
	it('keeps only stickers that exist, in collection order', () => {
		expect(earnedStickers(['streak-3', 'stars-100', 'first-session']).map((s) => s.id)).toEqual(['first-session', 'streak-3']);
		expect(earnedStickers([])).toEqual([]);
	});
});

describe('progress state', () => {
	it('counts answers and stars', () => {
		const state = defaultProgress();
		applyAnswer(state, 'exercise', 'first');
		applyAnswer(state, 'exercise', 'second');
		applyAnswer(state, 'exercise', 'failed');
		expect(state.typeStats.exercise).toEqual({ first: 1, second: 1, failed: 1 });
		expect(state.stars).toBe(3);
		expect(successRate(state.typeStats.exercise)).toBeCloseTo(2 / 3);
	});

	it('records practice days once and keeps the best passage score', () => {
		const state = defaultProgress();
		applySession(state, session('2026-10-08T10:00:00', 3, 5), 'inf-1');
		applySession(state, session('2026-10-08T12:00:00', 2, 5), 'inf-1');
		expect(state.practiceDays).toEqual(['2026-10-08']);
		expect(state.passages['inf-1']).toBe(3);
	});

	it('computes the day streak, forgiving a not-yet-practiced today', () => {
		const days = ['2026-10-05', '2026-10-06', '2026-10-07'];
		expect(dayStreak(days, new Date('2026-10-07T20:00:00'))).toBe(3);
		expect(dayStreak(days, new Date('2026-10-08T09:00:00'))).toBe(3);
		expect(dayStreak(days, new Date('2026-10-09T09:00:00'))).toBe(0);
	});

	it('round-trips through JSON and rejects foreign data', () => {
		const state = defaultProgress();
		state.stars = 42;
		expect(parseProgress(JSON.stringify(state))?.stars).toBe(42);
		expect(parseProgress('{"hello":1}')).toBeUndefined();
		expect(parseProgress('not json')).toBeUndefined();
	});

	it('tracks mistakes by content: adds, moves to the end, clears on a first-try answer', () => {
		const state = defaultProgress();
		const q = (id: string, math: string): Question => ({
			id, type: 'exercise', math, answer: { kind: 'number', rule: { op: 'eq', value: 1 }, solution: 1 },
		});
		applyMistake(state, q('a', '1 + 1 = ☐'), 'failed', undefined, 't1');
		applyMistake(state, q('b', '2 + 2 = ☐'), 'second', undefined, 't2');
		// Same content under another id (generated ids restart): one entry, moved to the end.
		applyMistake(state, q('c', '1 + 1 = ☐'), 'failed', undefined, 't3');
		expect(state.mistakes.map((m) => m.question.math)).toEqual(['2 + 2 = ☐', '1 + 1 = ☐']);

		applyMistake(state, q('d', '2 + 2 = ☐'), 'first', undefined, 't4');
		expect(state.mistakes).toHaveLength(1);
		expect(state.mistakesFixed).toBe(1);

		// A first-try answer to a question that was never missed changes nothing.
		applyMistake(state, q('e', '3 + 3 = ☐'), 'first', undefined, 't5');
		expect(state.mistakesFixed).toBe(1);
	});

	it('tells apart identical reading questions on different passages', () => {
		const state = defaultProgress();
		const q: Question = { id: 'x', type: 'inference', body: 'לָמָּה?', answer: { kind: 'choice', options: ['א', 'ב'], correctIndex: 0 } };
		applyMistake(state, q, 'failed', 'story-1', 't1');
		applyMistake(state, q, 'failed', 'story-2', 't2');
		expect(state.mistakes).toHaveLength(2);
	});

	it('awards each sticker once', () => {
		const state = defaultProgress();
		const last = session('2026-10-08T10:00:00', 10, 10);
		applySession(state, last);
		const earned = newStickers(state, last, new Date('2026-10-08T10:00:00')).map((s) => s.id);
		expect(earned).toEqual(expect.arrayContaining(['first-session', 'perfect']));
		state.stickers.push(...earned);
		expect(newStickers(state, last, new Date('2026-10-08T10:00:00'))).toEqual([]);
	});
});
