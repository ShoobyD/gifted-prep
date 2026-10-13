import { describe, expect, it } from 'vitest';
import { FIXTURE_MATH, FIXTURE_PASSAGES, fixtureItems } from '@/test/fixtures';
import type { BankTest, Passage, Question } from '@/types';
import { checkBankItems, type BankItem } from './checkBank';

describe('a whole bank', () => {
	it('passes when consistent', () => {
		expect(checkBankItems(fixtureItems())).toEqual([]);
	});

	it('survives a trip through JSON (an export file) unchanged', () => {
		const items = fixtureItems();
		expect(checkBankItems(JSON.parse(JSON.stringify(items)) as BankItem[])).toEqual([]);
	});
});

describe('checkBankItems', () => {
	const passage = FIXTURE_PASSAGES[0] as Passage;
	const question = FIXTURE_MATH[0] as Question;
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
