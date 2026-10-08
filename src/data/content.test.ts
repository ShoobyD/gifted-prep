import { describe, expect, it } from 'vitest';
import { checkNumber } from '@/engine/checkAnswer';
import { fill, holds, solutions } from '@/test/expressions';
import { BLANK, type MockTest, type Passage, type Question } from '@/types';
import { isCorrect } from '@/composables/useMockTest';
import { ALL_PASSAGES, REAL_MATH_QUESTIONS } from './content';
import { findMockTest } from './mockTests';
import { noamTest } from './noam';
import { official2025 } from './official2025';
import { officialSample } from './officialSample';

const NIKUD = /[֑-ׇ]/g;
const READING_TYPES = ['reading-fact', 'word-meaning', 'author-purpose', 'inference', 'not-answered', 'pronoun', 'word-relation'];

const lineCount = (p: Passage) => p.paragraphs.reduce((n, lines) => n + lines.length, 0);

function checkQuestion(q: Question) {
	expect(q.explanation, `${q.id} explanation`).toBeTruthy();
	for (const text of [q.body, q.explanation, ...(q.answer.kind === 'choice' ? q.answer.options : [])]) {
		if (text) expect(text.split('$').length % 2, `${q.id}: unbalanced $ in "${text}"`).toBe(1);
	}

	if (q.answer.kind === 'choice') {
		const { options, correctIndex } = q.answer;
		expect(options.length, q.id).toBeGreaterThanOrEqual(2);
		expect(new Set(options).size, `${q.id} distinct options`).toBe(options.length);
		expect(correctIndex, q.id).toBeGreaterThanOrEqual(0);
		expect(correctIndex, q.id).toBeLessThan(options.length);
		return;
	}

	const { answer } = q;
	expect(checkNumber(answer, answer.solution), `${q.id} solution passes its rule`).toBe(true);
	// Where the expression is machine-checkable, verify the stored answer independently.
	// The facts may leave some pictures open (e.g. only ⚽ + ⭐ is known) as long as the asked
	// expression comes out the same under every solution.
	if (q.math?.includes(BLANK)) {
		const found = solutions(q.lines ?? []);
		expect(found.length, `${q.id}: facts are solvable`).toBeGreaterThan(0);
		for (const values of found) {
			expect(holds(fill(q.math, answer.solution), values), `${q.id}: ${q.math} with ${answer.solution}`).toBe(true);
		}
	}
}

describe('reading passages', () => {
	it('have unique ids', () => {
		const ids = ALL_PASSAGES.flatMap((p) => [p.id, ...p.questions.map((q) => q.id)]);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it.each(ALL_PASSAGES.map((p) => [p.id, p] as const))('%s is valid', (_, passage) => {
		expect(passage.questions.length).toBeGreaterThan(0);
		const lines = lineCount(passage);
		for (const q of passage.questions) {
			expect(READING_TYPES, `${q.id} type`).toContain(q.type);
			checkQuestion(q);
			// Every cited line number exists.
			const plain = `${q.body ?? ''} ${q.explanation ?? ''}`.replace(NIKUD, '');
			for (const match of plain.matchAll(/שור(?:ה|ות)\s*(\d+)(?:\s*[-–]\s*(\d+))?/g)) {
				const cited = Number(match[2] ?? match[1]);
				expect(cited, `${q.id} cites line ${cited} of ${lines}`).toBeLessThanOrEqual(lines);
			}
		}
	});
});

describe.each([official2025, officialSample, noamTest].map((t) => [t.id, t] as const))('mock test %s', (_, test: MockTest) => {
	it('has valid sections', () => {
		expect(test.sections.length).toBeGreaterThan(0);
		for (const section of test.sections) {
			expect(section.questions.length, section.title).toBeGreaterThan(0);
			section.questions.forEach(checkQuestion);
		}
	});
});

describe('generated mock test', () => {
	it('always has the 2025 structure with valid questions', () => {
		const generated = findMockTest('generated');
		for (let run = 0; run < 50; run++) {
			const test = generated?.build() as MockTest;
			const counts = test.sections.map((s) => s.questions.length);
			expect(counts).toEqual([6, 6, 3, 5, 3, 3]);
			expect(test.sections[0]?.passage?.kind).toBe('informational');
			expect(test.sections[1]?.passage?.kind).toBe('story');
			test.sections.flatMap((s) => s.questions).forEach(checkQuestion);
		}
	});

	it('scores answers like practice does', () => {
		const choice = official2025.sections[0]?.questions[0] as Question;
		if (choice.answer.kind !== 'choice') throw new Error('expected a choice question');
		expect(isCorrect(choice, choice.answer.correctIndex)).toBe(true);
		expect(isCorrect(choice, (choice.answer.correctIndex + 1) % choice.answer.options.length)).toBe(false);
		expect(isCorrect(choice, undefined)).toBe(false);

		const number = REAL_MATH_QUESTIONS.find((q) => q.answer.kind === 'number') as Question;
		if (number.answer.kind !== 'number') throw new Error('expected a number question');
		expect(isCorrect(number, String(number.answer.solution))).toBe(true);
		expect(isCorrect(number, '')).toBe(false);
	});
});

describe('real math pool', () => {
	it('is valid', () => {
		expect(REAL_MATH_QUESTIONS.length).toBeGreaterThan(0);
		const ids = REAL_MATH_QUESTIONS.map((q) => q.id);
		expect(new Set(ids).size).toBe(ids.length);
		REAL_MATH_QUESTIONS.forEach(checkQuestion);
	});
});
