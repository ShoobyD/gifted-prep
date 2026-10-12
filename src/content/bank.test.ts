import { describe, expect, it } from 'vitest';
import type { Question } from '@/types';
import { itemOrigin, matches, normalize, paragraphsToText, questionText, textToParagraphs } from './bank';
import { deleteItem, emptyOverrides, revertItem, saveQuestion, setHidden } from './overrides';
import { CUSTOM_PREFIX, newMathQuestion, newPassage } from './templates';
import { validatePassage, validateQuestion } from './validate';

describe('question bank search', () => {
	it('ignores nikud, quotes and spacing', () => {
		expect(normalize('  הַתְּמָנוּן   הַמֻּפְלָא ')).toBe('התמנון המפלא');
		expect(matches('הַתְּמָנוּן הַמֻּפְלָא', 'תמנון')).toBe(true);
		expect(matches('כָּתוּב "גַּם"', 'גם')).toBe(true);
	});

	it('needs every word, in any order', () => {
		expect(matches('לְדָנָה הָיוּ 20 שְׁקָלִים', 'שקלים 20')).toBe(true);
		expect(matches('לְדָנָה הָיוּ 20 שְׁקָלִים', 'שקלים 30')).toBe(false);
		expect(matches('anything', '   ')).toBe(true);
	});

	it('searches the whole question: text, expression, options and source note', () => {
		const q: Question = {
			id: 'gch-4', type: 'missing-number', math: '5 ☐ 11 = 55', sourceNote: 'גאונצ׳יק שאלה 4', explanation: 'כפל.',
			answer: { kind: 'choice', options: ['חִבּוּר', 'כֶּפֶל'], correctIndex: 1 },
		};
		for (const query of ['55', 'כפל', 'שאלה 4', 'gch-4']) expect(matches(questionText(q), query), query).toBe(true);
	});
});

describe('item origin', () => {
	const builtIn = new Set(['p1']);
	it('tells built-in, edited and added items apart', () => {
		expect(itemOrigin('p1', builtIn, {})).toBe('built-in');
		expect(itemOrigin('p1', builtIn, { p1: {} })).toBe('edited');
		expect(itemOrigin('custom-1', builtIn, { 'custom-1': {} })).toBe('added');
	});
});

describe('passage text', () => {
	it('round-trips lines and paragraphs', () => {
		const paragraphs = [['שורה 1', 'שורה 2'], ['שורה 3']];
		expect(textToParagraphs(paragraphsToText(paragraphs))).toEqual(paragraphs);
	});

	it('tolerates Windows line ends, extra blank rows and stray spaces', () => {
		expect(textToParagraphs('  שורה 1 \r\nשורה 2\r\n\r\n\r\n  \r\nשורה 3\r\n')).toEqual([['שורה 1', 'שורה 2'], ['שורה 3']]);
		expect(textToParagraphs('   ')).toEqual([]);
	});
});

describe('edit intents', () => {
	const q = (id: string, body: string): Question => ({
		id, type: 'exercise', body, explanation: 'כי.', answer: { kind: 'number', rule: { op: 'eq', value: 1 }, solution: 1 },
	});

	it('saves an edited question and reverts it', () => {
		const edited = saveQuestion(q('m1', 'ערוך'))(emptyOverrides());
		expect(edited.questions.m1?.body).toBe('ערוך');
		expect(revertItem('m1')(edited).questions).toEqual({});
	});

	it('keeps changes someone else saved meanwhile', () => {
		const theirs = saveQuestion(q('m2', 'שלהם'))(emptyOverrides());
		const both = saveQuestion(q('m1', 'שלי'))(theirs);
		expect(Object.keys(both.questions).sort()).toEqual(['m1', 'm2']);
	});
});

describe('added content', () => {
	it('gets unique ids that never look built-in', () => {
		const ids = new Set(Array.from({ length: 200 }, () => newMathQuestion().id));
		expect(ids.size).toBe(200);
		const passage = newPassage();
		expect(passage.id.startsWith(CUSTOM_PREFIX)).toBe(true);
		expect(passage.questions[0]?.id.startsWith(`${passage.id}-q-`)).toBe(true);
	});

	it('starts invalid, so an empty item can never be saved', () => {
		expect(validateQuestion(newMathQuestion(), 'math').length).toBeGreaterThan(0);
		expect(validatePassage(newPassage()).length).toBeGreaterThan(0);
	});

	it('can be deleted, hiding included', () => {
		const q = newMathQuestion();
		const added = setHidden(q.id, true)(saveQuestion(q)(emptyOverrides()));
		const deleted = deleteItem(q.id)(added);
		expect(deleted.questions).toEqual({});
		expect(deleted.hidden).toEqual([]);
	});
});

describe('setHidden', () => {
	it('hides and unhides without duplicates', () => {
		const hidden = setHidden('q1', true)(setHidden('q1', true)(emptyOverrides()));
		expect(hidden.hidden).toEqual(['q1']);
		expect(setHidden('q1', false)(hidden).hidden).toEqual([]);
	});

	it('re-applies cleanly on a copy someone else changed meanwhile', () => {
		const theirs = { ...emptyOverrides(), hidden: ['other'] };
		expect(setHidden('q1', true)(theirs).hidden).toEqual(['other', 'q1']);
	});
});
