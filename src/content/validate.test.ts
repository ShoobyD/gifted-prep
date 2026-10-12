import { describe, expect, it } from 'vitest';
import type { Passage, Question } from '@/types';
import { isMachineCheckable, validatePassage, validateQuestion } from './validate';

const choice = (edit: Partial<Question> = {}, options = ['א', 'ב', 'ג'], correctIndex = 0): Question => ({
	id: 'q', type: 'word-problem', body: 'כמה?', explanation: 'כי.', answer: { kind: 'choice', options, correctIndex }, ...edit,
});

const numeric = (math: string, solution: number, edit: Partial<Question> = {}): Question => ({
	id: 'n', type: 'exercise', math, explanation: 'כי.', answer: { kind: 'number', rule: { op: 'eq', value: solution }, solution }, ...edit,
});

const fields = (q: Question, context: 'reading' | 'math' = 'math', lines?: number) =>
	validateQuestion(q, context, lines).map((i) => i.field);

describe('validateQuestion', () => {
	it('accepts a good question', () => {
		expect(validateQuestion(choice(), 'math')).toEqual([]);
		expect(validateQuestion(numeric('38 + 27 = ☐', 65), 'math')).toEqual([]);
	});

	it('requires text, an explanation and the right type for the context', () => {
		expect(fields(choice({ body: '' }))).toContain('body');
		expect(fields(choice({ explanation: ' ' }))).toContain('explanation');
		expect(fields(choice({ type: 'inference' }), 'math')).toContain('type');
		expect(fields(choice({ type: 'exercise' }), 'reading')).toContain('type');
	});

	it('checks the choices', () => {
		expect(fields(choice({}, ['א']))).toContain('options');
		expect(fields(choice({}, ['א', ' ']))).toContain('options');
		expect(fields(choice({}, ['א', 'א']))).toContain('options');
		expect(fields(choice({}, ['א', 'ב'], 2))).toContain('answer');
	});

	it('catches unbalanced inline-math markers', () => {
		expect(fields(choice({ explanation: 'נשאר $20 − 12 = 8.' }))).toContain('explanation');
	});

	it('computes number answers of well-formed equations', () => {
		expect(fields(numeric('38 + 27 = ☐', 64))).toContain('answer');
		expect(validateQuestion(numeric('🍎 = ☐', 6, { lines: ['🍎 + 🍎 = 12'] }), 'math')).toEqual([]);
		expect(fields(numeric('🍎 = ☐', 5, { lines: ['🍎 + 🍎 = 12'] }))).toContain('answer');
		expect(fields(numeric('🍎 = ☐', 5, { lines: ['🍎 + 🍎 = 13'] }))).toContain('lines');
	});

	it('checks inequality answers against their rule', () => {
		const q: Question = { ...numeric('40 + ☐ > 55', 16), answer: { kind: 'number', rule: { op: 'gt', value: 15 }, solution: 15 } };
		expect(fields(q)).toContain('answer');
	});

	it('allows other layouts without computing them', () => {
		const sequence = numeric('6, 9, 8, 11, 10, ☐', 13, { type: 'missing-number' });
		expect(isMachineCheckable(sequence)).toBe(false);
		expect(validateQuestion(sequence, 'math')).toEqual([]);
		expect(isMachineCheckable(numeric('38 + 27 = ☐', 65))).toBe(true);
	});

	it('flags a reading question citing a line that does not exist', () => {
		const q = choice({ type: 'inference', body: 'לָמָּה כָּתוּב בְּשׁוּרָה 9 "גַּם"?' });
		expect(fields(q, 'reading', 8)).toContain('body');
		expect(validateQuestion(q, 'reading', 9)).toEqual([]);
	});
});

describe('validatePassage', () => {
	const passage = (edit: Partial<Passage> = {}): Passage => ({
		id: 'p', title: 'כותרת', kind: 'story', source: 'other',
		paragraphs: [['שורה אחת', 'שורה שתיים']],
		questions: [choice({ id: 'p-q1', type: 'reading-fact', body: 'מה כתוב בשורה 2?' })],
		...edit,
	});

	it('accepts a good passage', () => {
		expect(validatePassage(passage())).toEqual([]);
	});

	it('requires a title, text and questions', () => {
		const fieldsOf = (p: Passage) => validatePassage(p).map((i) => i.field);
		expect(fieldsOf(passage({ title: '' }))).toContain('title');
		expect(fieldsOf(passage({ paragraphs: [['  ']] }))).toContain('paragraphs');
		expect(fieldsOf(passage({ questions: [] }))).toContain('questions');
	});

	it('reports question problems with their position', () => {
		const issues = validatePassage(passage({ paragraphs: [['שורה אחת']] }));
		expect(issues.map((i) => i.field)).toEqual(['questions.0.body']);
		expect(issues[0]?.message).toMatch(/^שאלה 1:/);
	});

	it('rejects duplicate question ids', () => {
		const q = choice({ id: 'same', type: 'reading-fact' });
		expect(validatePassage(passage({ questions: [q, q] })).map((i) => i.field)).toContain('questions');
	});
});
