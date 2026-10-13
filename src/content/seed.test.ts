import { describe, expect, it } from 'vitest';
import { BASE_MATH_QUESTIONS, BASE_PASSAGES } from '@/data/content';
import { noamTest } from '@/data/noam';
import { official2025 } from '@/data/official2025';
import type { BankTest, Passage, Question } from '@/types';
import { checkBankItems, seedItems, toBankTest, type BankItem } from './seed';

describe('seed items', () => {
	const items = seedItems();

	it('hold all the built-in content, passages first and tests last', () => {
		expect(items.filter((i) => i.kind === 'passage').map((i) => i.data)).toEqual(BASE_PASSAGES);
		expect(items.filter((i) => i.kind === 'question').map((i) => i.data)).toEqual(BASE_MATH_QUESTIONS);
		expect(items.filter((i) => i.kind === 'test').map((i) => i.id)).toEqual(['official-2025', 'official-sample', 'noam-2025']);
		const order = items.map((i) => ['passage', 'question', 'test'].indexOf(i.kind));
		expect(order).toEqual([...order].sort((a, b) => a - b));
	});

	it('pass every check', () => {
		expect(checkBankItems(items)).toEqual([]);
	});

	it('survive a trip through JSON unchanged', () => {
		expect(JSON.parse(JSON.stringify(items))).toEqual(items);
	});
});

describe('toBankTest', () => {
	it('points at passages and questions instead of copying them', () => {
		const test = toBankTest(official2025, 'desc');
		expect(test.description).toBe('desc');
		expect(test.sections.length).toBe(official2025.sections.length);
		official2025.sections.forEach((section, i) => {
			const stored = test.sections[i];
			if (section.passage) {
				expect(stored?.passageId).toBe(section.passage.id);
				// Reading sections show the passage's own questions.
				expect(section.questions).toBe(section.passage.questions);
			} else {
				expect(stored?.questionIds).toEqual(section.questions.map((q) => q.id));
			}
		});
	});

	it('keeps a reading section title only when it differs from the passage title', () => {
		expect(toBankTest(official2025).sections[0]).not.toHaveProperty('title');
		const reading = toBankTest(noamTest).sections.find((s) => s.passageId);
		expect(reading?.title).toBe('הֲבָנַת הַנִּקְרָא');
	});
});

describe('checkBankItems', () => {
	const passage = BASE_PASSAGES[0] as Passage;
	const question = BASE_MATH_QUESTIONS[0] as Question;
	const test: BankTest = {
		id: 't1', title: 'מבחן', source: 'other',
		sections: [{ passageId: passage.id }, { title: 'חשבון', questionIds: [question.id] }],
	};
	const valid: BankItem[] = [
		{ id: passage.id, kind: 'passage', data: passage },
		{ id: question.id, kind: 'question', data: question },
		{ id: 't1', kind: 'test', data: test },
	];

	it('accepts a consistent set', () => {
		expect(checkBankItems(valid)).toEqual([]);
	});

	it('finds repeated ids, also inside passages', () => {
		const copy = { ...question, id: passage.questions[0]?.id as string };
		expect(checkBankItems([...valid, { id: copy.id, kind: 'question', data: copy }])).toEqual([`${copy.id}: id used more than once`]);
	});

	it('finds bad ids and mismatched data', () => {
		const odd = { ...question, id: 'a b' };
		expect(checkBankItems([{ id: 'a b', kind: 'question', data: odd }])).toEqual(['a b: invalid id']);
		expect(checkBankItems([{ id: 'other', kind: 'question', data: question }])).toEqual([`other: filed under another id (${question.id})`]);
	});

	it('finds content the editor would reject', () => {
		const broken = { ...question, explanation: '' };
		expect(checkBankItems([{ id: broken.id, kind: 'question', data: broken }])[0]).toMatch(/^.+: explanation: /);
	});

	it('finds tests pointing at missing or wrong items', () => {
		const bad: BankTest = {
			...test,
			sections: [
				{ passageId: question.id },
				{ title: 'חשבון', questionIds: ['nope'] },
				{ title: 'ריק', questionIds: [] },
				{ title: 'שניהם', passageId: passage.id, questionIds: [question.id] },
			],
		};
		expect(checkBankItems([...valid.slice(0, 2), { id: 't1', kind: 'test', data: bad }])).toEqual([
			`t1: section 1: no passage ${question.id}`,
			't1: section 2: no question nope',
			't1: section 3: no questions',
			't1: section 4: needs either a passage or questions',
		]);
	});
});
