import { beforeEach, describe, expect, it } from 'vitest';
import { useContent } from '@/composables/useContent';
import { isCorrect } from '@/composables/useMockTest';
import { emptyBank } from '@/content/bankContent';
import { lineCount, validateQuestion } from '@/content/validate';
import { FIXTURE_MATH, FIXTURE_PASSAGES, FIXTURE_TEST, fixtureBank } from '@/test/fixtures';
import type { MockTest, Passage, Question, TestSection } from '@/types';
import { findMockTest, mockTests } from './mockTests';

// The same checks the question editor runs before saving.
function sectionIssues(section: TestSection): string[] {
	const { passage } = section;
	return section.questions.flatMap((q) =>
		validateQuestion(q, passage ? 'reading' : 'math', passage && lineCount(passage)).map((i) => `${q.id}: ${i.message}`),
	);
}

const content = useContent();

describe('before the bank loads', () => {
	it('there is no content, and only the generated test is offered', () => {
		content.bank.value = emptyBank();
		expect(content.passages.value).toEqual([]);
		expect(content.mathPool.value).toEqual([]);
		expect(mockTests().map((t) => t.id)).toEqual(['generated']);
	});

	it('a generated test still has its math tasks', () => {
		content.bank.value = emptyBank();
		const test = findMockTest('generated')?.build() as MockTest;
		expect(test.sections.map((s) => s.questions.length)).toEqual([3, 5, 3, 3]);
	});
});

describe('with a bank', () => {
	beforeEach(() => {
		content.bank.value = fixtureBank();
	});

	it('offers its content and tests', () => {
		expect(content.passages.value).toEqual(FIXTURE_PASSAGES);
		expect(content.mathPool.value).toEqual(FIXTURE_MATH);
		expect(mockTests().map((t) => t.id)).toEqual(['generated', FIXTURE_TEST.id]);
		expect(content.findPassage('inf-1')).toBe(FIXTURE_PASSAGES[1]);
	});

	it('builds a generated test in the 2025 structure with valid questions', () => {
		const generated = findMockTest('generated');
		for (let run = 0; run < 50; run++) {
			const test = generated?.build() as MockTest;
			expect(test.sections.map((s) => s.questions.length)).toEqual([6, 6, 3, 5, 3, 3]);
			// Passages written for practice, not a real test's own.
			expect(test.sections[0]?.passage?.id).toBe('inf-1');
			expect(test.sections[1]?.passage?.id).toBe('story-1');
			expect(test.sections.flatMap(sectionIssues)).toEqual([]);
		}
	});

	it('builds a bank test from its items', () => {
		const entry = findMockTest(FIXTURE_TEST.id);
		expect(entry?.description).toBe(FIXTURE_TEST.description);
		const built = entry?.build() as MockTest;
		expect(built.sections.map((s) => [s.title, s.instructions, s.passage?.id, s.questions.map((q) => q.id)])).toEqual([
			['קֶטַע test-p1', 'קִרְאוּ וַעֲנוּ.', 'test-p1', ['test-p1-q1', 'test-p1-q2']],
			['חֶשְׁבּוֹן', undefined, undefined, ['test-m1', 'test-m2']],
		]);
	});

	it('leaves hidden items out of practice but not out of the bank', () => {
		const [first, second] = FIXTURE_PASSAGES.slice(1) as [Passage, Passage];
		const math = FIXTURE_MATH[0] as Question;
		content.bank.value = {
			...fixtureBank(),
			passages: [
				{ ...first, questions: first.questions.map((q, i) => (i === 0 ? { ...q, hidden: true } : q)) },
				{ ...second, questions: second.questions.map((q) => ({ ...q, hidden: true })) },
			],
			hidden: [math.id, FIXTURE_TEST.id],
		};
		// A passage with every question hidden is left out too.
		expect(content.passages.value.map((p) => p.id)).toEqual([first.id]);
		expect(content.passages.value[0]?.questions.length).toBe(first.questions.length - 1);
		expect(content.everyPassage.value.length).toBe(2);
		expect(content.mathPool.value.map((q) => q.id)).not.toContain(math.id);
		expect(mockTests().map((t) => t.id)).toEqual(['generated']);
		// Still reachable, e.g. from a saved session.
		expect(findMockTest(FIXTURE_TEST.id)).toBeDefined();
		expect(content.usedInTests.value.has(math.id)).toBe(true);
	});

	it('scores answers like practice does', () => {
		const choice = FIXTURE_MATH[1] as Question;
		if (choice.answer.kind !== 'choice') throw new Error('expected a choice question');
		expect(isCorrect(choice, choice.answer.correctIndex)).toBe(true);
		expect(isCorrect(choice, (choice.answer.correctIndex + 1) % choice.answer.options.length)).toBe(false);
		expect(isCorrect(choice, undefined)).toBe(false);

		const number = FIXTURE_MATH[0] as Question;
		if (number.answer.kind !== 'number') throw new Error('expected a number question');
		expect(isCorrect(number, String(number.answer.solution))).toBe(true);
		expect(isCorrect(number, '')).toBe(false);
	});
});
