import { describe, expect, it } from 'vitest';
import type { Question } from '@/types';
import { itemOrigin, matches, normalize, questionText } from './bank';
import { emptyOverrides, setHidden } from './overrides';

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
