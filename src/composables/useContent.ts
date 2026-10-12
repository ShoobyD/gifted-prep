import { computed, shallowRef } from 'vue';
import {
	allMathQuestions,
	allPassages,
	applyToTest,
	emptyOverrides,
	visibleMathQuestions,
	visiblePassages,
	type BaseContent,
	type ContentOverrides,
} from '@/content/overrides';
import { BASE_MATH_QUESTIONS, BASE_PASSAGES } from '@/data/content';
import type { MockTest, Passage } from '@/types';

// The question bank as the app uses it: the built-in content with the parent's changes on
// top. Every screen reads content through here, so a change shows up everywhere at once.

const base: BaseContent = { passages: BASE_PASSAGES, mathQuestions: BASE_MATH_QUESTIONS };
const overrides = shallowRef<ContentOverrides>(emptyOverrides());

const everyPassage = computed(() => allPassages(base, overrides.value));
const passages = computed(() => visiblePassages(base, overrides.value));
const everyMathQuestion = computed(() => allMathQuestions(base, overrides.value));
const mathPool = computed(() => visibleMathQuestions(base, overrides.value));

// Hidden passages too: a saved mistake or session may point at one.
function findPassage(id: string): Passage | undefined {
	return everyPassage.value.find((p) => p.id === id);
}

export function useContent() {
	return {
		overrides,
		// What practice offers (hidden left out).
		passages,
		mathPool,
		// Everything, for the question bank.
		everyPassage,
		everyMathQuestion,
		findPassage,
		applyToTest: (test: MockTest) => applyToTest(test, overrides.value),
	};
}
