import { describe, expect, it } from 'vitest';
import type { Question } from '@/types';
import { itemOrigin, matches, normalize, paragraphsToText, questionText, textToParagraphs } from './bank';
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
	it('tells built-in, edited and added items apart', () => {
		expect(itemOrigin('p1', 1)).toBe('built-in');
		expect(itemOrigin('p1', 0)).toBe('built-in');
		expect(itemOrigin('p1', 2)).toBe('edited');
		expect(itemOrigin('custom-1', 1)).toBe('added');
		expect(itemOrigin('custom-1', 3)).toBe('added');
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
});
