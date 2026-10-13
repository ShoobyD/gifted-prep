import { computed, shallowRef } from 'vue';
import { buildTest, emptyBank, type BankContent } from '@/content/bankContent';
import type { BankTest, MockTest, Passage, Question } from '@/types';

// The question bank as the app uses it: the bank from the server (empty until it first
// loads; then kept on the device). Every screen reads content through here, so a change
// shows up everywhere at once.

const bank = shallowRef<BankContent>(emptyBank());

const hiddenIds = computed(() => new Set(bank.value.hidden));

function isHidden(id: string): boolean {
	return hiddenIds.value.has(id);
}

const everyPassage = computed(() => bank.value.passages);
const everyMathQuestion = computed(() => bank.value.mathQuestions);
const everyTest = computed(() => bank.value.tests);

// What practice offers: hidden passages and questions left out, and a passage whose
// questions are all hidden left out too.
const passages = computed<Passage[]>(() =>
	everyPassage.value
		.filter((passage) => !isHidden(passage.id))
		.map((passage) => ({ ...passage, questions: passage.questions.filter((q) => !q.hidden) }))
		.filter((passage) => passage.questions.length > 0),
);
const mathPool = computed<Question[]>(() => everyMathQuestion.value.filter((q) => !isHidden(q.id)));
const tests = computed(() => everyTest.value.filter((t) => !isHidden(t.id)));

// Ids of passages and questions some test is made of.
const usedInTests = computed(() => new Set(everyTest.value.flatMap((test) =>
	test.sections.flatMap((s) => [...(s.passageId ? [s.passageId] : []), ...(s.questionIds ?? [])]))));

// Hidden passages too: a saved mistake or session may point at one.
function findPassage(id: string): Passage | undefined {
	return everyPassage.value.find((p) => p.id === id);
}

// A test filled in with the current content.
function resolveTest(test: BankTest): MockTest {
	return buildTest(test, everyPassage.value, everyMathQuestion.value);
}

// The server version of an item (0: not in the bank as far as this device knows).
function versionOf(id: string): number {
	return bank.value.versions[id] ?? 0;
}

export function useContent() {
	return {
		bank,
		// What practice offers (hidden left out).
		passages,
		mathPool,
		tests,
		// Everything, for the question bank.
		everyPassage,
		everyMathQuestion,
		everyTest,
		usedInTests,
		isHidden,
		versionOf,
		findPassage,
		resolveTest,
	};
}
