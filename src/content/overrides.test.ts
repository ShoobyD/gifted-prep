import { describe, expect, it } from 'vitest';
import type { MockTest, Passage, Question } from '@/types';
import {
	allMathQuestions,
	allPassages,
	applyToTest,
	emptyOverrides,
	parseOverrides,
	visibleMathQuestions,
	visiblePassages,
	type BaseContent,
	type ContentOverrides,
} from './overrides';

const question = (id: string, body = 'כמה?'): Question => ({
	id, type: 'reading-fact', body, explanation: 'כי.', answer: { kind: 'choice', options: ['א', 'ב'], correctIndex: 0 },
});

const passage = (id: string, questionIds: string[], title = id): Passage => ({
	id, title, kind: 'story', source: 'original', paragraphs: [['שורה']], questions: questionIds.map((q) => question(q)),
});

const math = (id: string, body = 'כמה?'): Question => ({ ...question(id, body), type: 'word-problem' });

const base: BaseContent = {
	passages: [passage('p1', ['p1-q1', 'p1-q2']), passage('p2', ['p2-q1'])],
	mathQuestions: [math('m1'), math('m2')],
};

const overrides = (edit: Partial<ContentOverrides>): ContentOverrides => ({ ...emptyOverrides(), ...edit });

describe('parseOverrides', () => {
	const good = () => overrides({
		passages: { p1: passage('p1', ['p1-q1']) },
		questions: { m1: math('m1') },
		hidden: ['p2'],
	});

	it('accepts well-formed changes, through JSON and back', () => {
		expect(parseOverrides(JSON.parse(JSON.stringify(good())))).toEqual(good());
		expect(parseOverrides(emptyOverrides())).toEqual(emptyOverrides());
	});

	it('rejects anything else', () => {
		expect(parseOverrides(null)).toBeUndefined();
		expect(parseOverrides({ ...good(), version: 2 })).toBeUndefined();
		expect(parseOverrides({ ...good(), passages: [] })).toBeUndefined();
		expect(parseOverrides({ ...good(), hidden: [1] })).toBeUndefined();
		// An item filed under someone else's id.
		expect(parseOverrides({ ...good(), questions: { m2: math('m1') } })).toBeUndefined();
		// A passage whose question is missing its answer.
		const broken = passage('p1', ['p1-q1']);
		delete (broken.questions[0] as Partial<Question>).answer;
		expect(parseOverrides({ ...good(), passages: { p1: broken } })).toBeUndefined();
	});
});

describe('content overrides', () => {
	it('leave the built-in content untouched when empty', () => {
		expect(allPassages(base, emptyOverrides())).toEqual(base.passages);
		expect(visiblePassages(base, emptyOverrides())).toEqual(base.passages);
		expect(visibleMathQuestions(base, emptyOverrides())).toEqual(base.mathQuestions);
	});

	it('replace an edited item in place and append new ones', () => {
		const o = overrides({
			passages: { p1: passage('p1', ['p1-q1'], 'ערוך'), 'custom-p': passage('custom-p', ['custom-p-q1']) },
			questions: { m2: math('m2', 'ערוך'), 'custom-m': math('custom-m') },
		});
		expect(allPassages(base, o).map((p) => `${p.id}:${p.title}`)).toEqual(['p1:ערוך', 'p2:p2', 'custom-p:custom-p']);
		expect(allMathQuestions(base, o).map((q) => `${q.id}:${q.body}`)).toEqual(['m1:כמה?', 'm2:ערוך', 'custom-m:כמה?']);
	});

	it('hide passages, single questions, and passages left with no questions', () => {
		const o = overrides({ hidden: ['p1-q2', 'p2-q1', 'm1'] });
		const visible = visiblePassages(base, o);
		expect(visible.map((p) => p.id)).toEqual(['p1']);
		expect(visible[0]?.questions.map((q) => q.id)).toEqual(['p1-q1']);
		expect(visibleMathQuestions(base, o).map((q) => q.id)).toEqual(['m2']);

		expect(visiblePassages(base, overrides({ hidden: ['p1'] })).map((p) => p.id)).toEqual(['p2']);
		// Still reachable by id (e.g. a saved mistake from before it was hidden).
		expect(allPassages(base, overrides({ hidden: ['p1'] })).map((p) => p.id)).toContain('p1');
	});

	it('apply corrections to a real test without dropping hidden items', () => {
		const test: MockTest = {
			id: 't', title: 'מבחן', source: 'official-2025',
			sections: [
				{ title: 'קריאה', passage: base.passages[0], questions: base.passages[0]?.questions ?? [] },
				{ title: 'חשבון', questions: base.mathQuestions },
			],
		};
		const o = overrides({
			passages: { p1: passage('p1', ['p1-q1', 'p1-q2'], 'ערוך') },
			questions: { m1: math('m1', 'ערוך') },
			hidden: ['p1-q2', 'm2'],
		});
		const applied = applyToTest(test, o);
		expect(applied.sections[0]?.passage?.title).toBe('ערוך');
		// The section was titled after the passage, so it follows the rename.
		const named = applyToTest({ ...test, sections: [{ ...test.sections[0]!, title: 'p1' }] }, o);
		expect(named.sections[0]?.title).toBe('ערוך');
		expect(applied.sections[0]?.title).toBe('קריאה');
		expect(applied.sections[0]?.questions.map((q) => q.id)).toEqual(['p1-q1', 'p1-q2']);
		expect(applied.sections[1]?.questions.map((q) => q.body)).toEqual(['ערוך', 'כמה?']);
		// The original test object is not modified.
		expect(test.sections[0]?.passage?.title).toBe('p1');
	});
});
