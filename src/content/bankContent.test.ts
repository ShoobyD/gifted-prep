import { describe, expect, it } from 'vitest';
import type { BankTest, Passage, Question } from '@/types';
import { buildTest, parseSnapshot, toBankContent, type BankRecord } from './bankContent';

const question = (id: string): Question => ({
	id, type: 'word-problem', body: 'כמה?', explanation: 'כי.', answer: { kind: 'choice', options: ['א', 'ב'], correctIndex: 0 },
});

const passage = (id: string, title = id): Passage => ({
	id, title, kind: 'story', source: 'original', paragraphs: [['שורה']], questions: [{ ...question(`${id}-q1`), type: 'reading-fact' }],
});

const record = (kind: BankRecord['kind'], data: { id: string }, hidden = false): BankRecord =>
	({ id: data.id, kind, data, hidden, version: 1, updatedAt: 1 });

const test: BankTest = {
	id: 't1', title: 'מבחן', source: 'other',
	sections: [
		{ instructions: 'קראו', passageId: 'p1' },
		{ title: 'קריאה', passageId: 'p2' },
		{ title: 'חשבון', questionIds: ['m1', 'gone', 'm2'] },
	],
};

describe('toBankContent', () => {
	it('sorts items by kind, in order, and collects hidden ids', () => {
		const content = toBankContent([
			record('passage', passage('p1')),
			record('question', question('m1'), true),
			record('test', test),
			record('passage', passage('p2')),
		]);
		expect(content.passages.map((p) => p.id)).toEqual(['p1', 'p2']);
		expect(content.mathQuestions.map((q) => q.id)).toEqual(['m1']);
		expect(content.tests.map((t) => t.id)).toEqual(['t1']);
		expect(content.hidden).toEqual(['m1']);
	});

	it('leaves out broken items and keeps the rest', () => {
		const content = toBankContent([
			record('passage', { id: 'p1', title: 'בלי שורות' } as { id: string }),
			record('question', passage('p2')),
			{ ...record('question', question('m1')), id: 'other' },
			{ ...record('question', question('m2')), kind: 'video' as BankRecord['kind'] },
			record('question', question('m3')),
		]);
		expect(content.passages).toEqual([]);
		expect(content.mathQuestions.map((q) => q.id)).toEqual(['m3']);
	});
});

describe('parseSnapshot', () => {
	it('accepts a bank and drops malformed rows', () => {
		const good = record('question', question('m1'));
		expect(parseSnapshot({ revision: 3, items: [good, { id: 'x' }] })).toEqual({ revision: 3, items: [good] });
	});

	it('rejects anything else', () => {
		expect(parseSnapshot(null)).toBeUndefined();
		expect(parseSnapshot({ revision: '3', items: [] })).toBeUndefined();
		expect(parseSnapshot({ revision: 3 })).toBeUndefined();
	});
});

describe('buildTest', () => {
	const passages = [passage('p1', 'שם חדש'), passage('p2')];
	const questions = [question('m1'), question('m2')];

	it('fills sections in from the bank', () => {
		const built = buildTest(test, passages, questions);
		expect(built).toMatchObject({ id: 't1', title: 'מבחן', source: 'other' });
		expect(built.sections.map((s) => s.title)).toEqual(['שם חדש', 'קריאה', 'חשבון']);
		expect(built.sections[0]?.instructions).toBe('קראו');
		expect(built.sections[0]?.questions).toBe(passages[0]?.questions);
		expect(built.sections[1]).not.toHaveProperty('instructions');
		// A question missing from the bank is left out.
		expect(built.sections[2]?.questions.map((q) => q.id)).toEqual(['m1', 'm2']);
	});

	it('leaves out a section with nothing left in it', () => {
		const built = buildTest(test, [passage('p2')], []);
		expect(built.sections.map((s) => s.title)).toEqual(['קריאה']);
	});
});
