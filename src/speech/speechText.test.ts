import { describe, expect, it } from 'vitest';
import { exercise } from '@/generators/exercise';
import { seeded } from '@/generators/random';
import type { Question } from '@/types';
import { expressionToSpeech, questionToSpeech, splitSentences, textToSpeech } from './speechText';

describe('speech text', () => {
	it('reads expressions left to right with spoken operators', () => {
		expect(expressionToSpeech('38 + 27 = ☐')).toBe('38 וְעוֹד 27 שָׁוֶה כַּמָּה');
		expect(expressionToSpeech('☐ − 25 > 12')).toBe('כַּמָּה פָּחוֹת 25 גָּדוֹל מִ 12');
	});

	it('names pictures and symbols, keeping multi-digit numbers whole', () => {
		expect(expressionToSpeech('🍎 + 🍎 = 12')).toBe('תַּפּוּחַ וְעוֹד תַּפּוּחַ שָׁוֶה 12');
		expect(expressionToSpeech('5△ + 3 = 59')).toBe('5 מְשֻׁלָּשׁ וְעוֹד 3 שָׁוֶה 59');
	});

	it('speaks inline math in free text and drops the markers', () => {
		expect(textToSpeech('נִשְׁאַר: $20 − 12 = 8$.')).toBe('נִשְׁאַר: 20 פָּחוֹת 12 שָׁוֶה 8.');
	});

	it('includes the options of a choice question', () => {
		const q: Question = {
			id: 't',
			type: 'word-problem',
			body: 'כַּמָּה?',
			answer: { kind: 'choice', options: ['1', '2', '3', '4'], correctIndex: 0 },
		};
		expect(questionToSpeech(q)).toBe('כַּמָּה? א: 1. ב: 2. ג: 3. ד: 4.');
	});

	it('leaves no raw symbols in generated questions', () => {
		const rng = seeded(7);
		for (let i = 0; i < 200; i++) {
			const text = questionToSpeech(exercise(3, rng));
			expect(text).not.toMatch(/[$☐×−=]/);
		}
	});

	it('splits into sentences', () => {
		expect(splitSentences('אַחַת. שְׁתַּיִם? שָׁלוֹשׁ')).toEqual(['אַחַת.', 'שְׁתַּיִם?', 'שָׁלוֹשׁ']);
	});
});
