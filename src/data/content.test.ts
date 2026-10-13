import { describe, expect, it } from 'vitest';
import { useContent } from '@/composables/useContent';
import { isCorrect } from '@/composables/useMockTest';
import { lineCount, validatePassage, validateQuestion } from '@/content/validate';
import type { MockTest, Passage, Question, TestSection } from '@/types';
import { BASE_MATH_QUESTIONS, BASE_PASSAGES } from './content';
import { findMockTest } from './mockTests';
import { noamTest } from './noam';
import { official2025 } from './official2025';
import { officialSample } from './officialSample';

// The same checks the question editor runs before saving.
function sectionIssues(section: TestSection): string[] {
	const { passage } = section;
	return section.questions.flatMap((q) =>
		validateQuestion(q, passage ? 'reading' : 'math', passage && lineCount(passage)).map((i) => `${q.id}: ${i.message}`),
	);
}

describe('reading passages', () => {
	it('have unique ids', () => {
		const ids = BASE_PASSAGES.flatMap((p) => [p.id, ...p.questions.map((q) => q.id)]);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it.each(BASE_PASSAGES.map((p) => [p.id, p] as const))('%s is valid', (_, passage) => {
		expect(validatePassage(passage)).toEqual([]);
	});
});

describe.each([official2025, officialSample, noamTest].map((t) => [t.id, t] as const))('mock test %s', (_, test: MockTest) => {
	it('has valid sections', () => {
		expect(test.sections.length).toBeGreaterThan(0);
		for (const section of test.sections) {
			expect(section.questions.length, section.title).toBeGreaterThan(0);
			expect(sectionIssues(section)).toEqual([]);
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
			expect(test.sections.flatMap(sectionIssues)).toEqual([]);
		}
	});

	it('scores answers like practice does', () => {
		const choice = official2025.sections[0]?.questions[0] as Question;
		if (choice.answer.kind !== 'choice') throw new Error('expected a choice question');
		expect(isCorrect(choice, choice.answer.correctIndex)).toBe(true);
		expect(isCorrect(choice, (choice.answer.correctIndex + 1) % choice.answer.options.length)).toBe(false);
		expect(isCorrect(choice, undefined)).toBe(false);

		const number = BASE_MATH_QUESTIONS.find((q) => q.answer.kind === 'number') as Question;
		if (number.answer.kind !== 'number') throw new Error('expected a number question');
		expect(isCorrect(number, String(number.answer.solution))).toBe(true);
		expect(isCorrect(number, '')).toBe(false);
	});
});

describe('content store', () => {
	it('serves exactly the built-in content until the bank loads', () => {
		const content = useContent();
		expect(content.passages.value).toEqual(BASE_PASSAGES);
		expect(content.mathPool.value).toEqual(BASE_MATH_QUESTIONS);
		expect(content.tests.value.map((t) => t.id)).toEqual(['official-2025', 'official-sample', 'noam-2025']);
		expect(content.findPassage('inf-1')).toBe(BASE_PASSAGES.find((p) => p.id === 'inf-1'));
	});

	it('leaves hidden items out of practice but not out of the bank', () => {
		const content = useContent();
		const original = content.bank.value;
		const [first, second] = BASE_PASSAGES as [Passage, Passage];
		const math = BASE_MATH_QUESTIONS[0] as Question;
		try {
			content.bank.value = {
				...original,
				passages: [
					{ ...first, questions: first.questions.map((q, i) => (i === 0 ? { ...q, hidden: true } : q)) },
					{ ...second, questions: second.questions.map((q) => ({ ...q, hidden: true })) },
				],
				hidden: [math.id, 'official-2025'],
			};
			// A passage with every question hidden is left out too.
			expect(content.passages.value.map((p) => p.id)).toEqual([first.id]);
			expect(content.passages.value[0]?.questions.length).toBe(first.questions.length - 1);
			expect(content.everyPassage.value.length).toBe(2);
			expect(content.mathPool.value.map((q) => q.id)).not.toContain(math.id);
			expect(content.tests.value.map((t) => t.id)).not.toContain('official-2025');
			expect(content.everyTest.value.map((t) => t.id)).toContain('official-2025');
			expect(content.usedInTests.value.has(math.id)).toBe(true);
		} finally {
			content.bank.value = original;
		}
	});

	// Section by section: title, instructions, passage and question ids.
	const outline = (test: MockTest) =>
		test.sections.map((s) => [s.title, s.instructions, s.passage?.id, s.questions.map((q) => q.id)]);

	it.each([official2025, officialSample, noamTest].map((t) => [t.id, t] as const))(
		'builds test %s from the bank like the booklet',
		(id, test) => {
			const built = findMockTest(id)?.build() as MockTest;
			expect(built.title).toBe(test.title);
			expect(outline(built)).toEqual(outline(test));
		},
	);
});

describe('real math pool', () => {
	it('is valid', () => {
		expect(BASE_MATH_QUESTIONS.length).toBeGreaterThan(0);
		const ids = BASE_MATH_QUESTIONS.map((q) => q.id);
		expect(new Set(ids).size).toBe(ids.length);
		expect(BASE_MATH_QUESTIONS.flatMap((q) => validateQuestion(q, 'math').map((i) => `${q.id}: ${i.message}`))).toEqual([]);
	});

	it('knows where every question came from', () => {
		expect(BASE_MATH_QUESTIONS.filter((q) => !q.source).map((q) => q.id)).toEqual([]);
	});
});
