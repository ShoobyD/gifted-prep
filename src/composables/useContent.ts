import { computed, shallowRef } from 'vue';
import { buildTest, builtInBank, type BankContent } from '@/content/bankContent';
import {
	allMathQuestions,
	allPassages,
	emptyOverrides,
	visibleMathQuestions,
	visiblePassages,
	type ContentOverrides,
} from '@/content/overrides';
import type { BankTest, MockTest, Passage } from '@/types';

// The question bank as the app uses it: the bank from the server (the built-in content
// until it first loads) with the parent's changes on top. Every screen reads content
// through here, so a change shows up everywhere at once.

const bank = shallowRef<BankContent>(builtInBank());
const overrides = shallowRef<ContentOverrides>(emptyOverrides());

// The bank's own hiding and the parent's changes count together.
const withBankHidden = computed<ContentOverrides>(() => ({
	...overrides.value,
	hidden: [...bank.value.hidden, ...overrides.value.hidden],
}));

const everyPassage = computed(() => allPassages(bank.value, overrides.value));
const passages = computed(() => visiblePassages(bank.value, withBankHidden.value));
const everyMathQuestion = computed(() => allMathQuestions(bank.value, overrides.value));
const mathPool = computed(() => visibleMathQuestions(bank.value, withBankHidden.value));
const basePassageIds = computed(() => new Set(bank.value.passages.map((p) => p.id)));
const baseQuestionIds = computed(() => new Set(bank.value.mathQuestions.map((q) => q.id)));
const everyTest = computed(() => bank.value.tests);
const tests = computed(() => everyTest.value.filter((t) => !bank.value.hidden.includes(t.id)));

// Hidden passages too: a saved mistake or session may point at one.
function findPassage(id: string): Passage | undefined {
	return everyPassage.value.find((p) => p.id === id);
}

// A test filled in with the current content, the parent's corrections included.
function resolveTest(test: BankTest): MockTest {
	return buildTest(test, everyPassage.value, everyMathQuestion.value);
}

export function useContent() {
	return {
		bank,
		overrides,
		// What practice offers (hidden left out).
		passages,
		mathPool,
		tests,
		// Everything, for the question bank.
		everyPassage,
		everyMathQuestion,
		everyTest,
		// Items that come from the bank itself (as opposed to added as a change).
		basePassageIds,
		baseQuestionIds,
		findPassage,
		resolveTest,
	};
}
