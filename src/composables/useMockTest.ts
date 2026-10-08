import { computed, onUnmounted, reactive, ref } from 'vue';
import { checkChoice, checkNumber } from '@/engine/checkAnswer';
import type { MockTest, Question, TestSection } from '@/types';

// Minutes per part (reading / math), as reported for the real test (2 × 20).
export const PART_MINUTES = 20;

// A choice index, or the digits typed so far.
export type MockAnswer = number | string;

export interface Item {
	question: Question;
	section: TestSection;
	sectionIndex: number;
}

export function isAnswered(answer: MockAnswer | undefined): boolean {
	return typeof answer === 'number' || (typeof answer === 'string' && answer !== '');
}

export function isCorrect(question: Question, answer: MockAnswer | undefined): boolean {
	if (!isAnswered(answer)) return false;
	return question.answer.kind === 'choice'
		? typeof answer === 'number' && checkChoice(question.answer, answer)
		: checkNumber(question.answer, Number(answer));
}

// Reading sections form part 1, math sections part 2 (whatever their order in the booklet).
const partOf = (section: TestSection) => (section.passage ? 'reading' : 'math');

export function useMockTest(test: MockTest) {
	const items: Item[] = test.sections.flatMap((section, sectionIndex) =>
		section.questions.map((question) => ({ question, section, sectionIndex })),
	);

	const index = ref(0);
	const answers = reactive(new Map<string, MockAnswer>());
	const current = computed(() => items[index.value] as Item);
	const unanswered = computed(() => items.filter((it) => !isAnswered(answers.get(it.question.id))).length);

	// Soft timer: counts down per part, never blocks.
	const now = ref(Date.now());
	const partStarted = reactive(new Map<string, number>());
	const tick = setInterval(() => (now.value = Date.now()), 1000);
	onUnmounted(() => clearInterval(tick));

	function enterCurrentPart() {
		const part = partOf(current.value.section);
		// Sync the clock first; it otherwise lags up to a second behind the part's start.
		now.value = Date.now();
		if (!partStarted.has(part)) partStarted.set(part, now.value);
	}

	const secondsLeft = computed(() => {
		const started = partStarted.get(partOf(current.value.section)) ?? now.value;
		const elapsed = Math.max(0, Math.floor((now.value - started) / 1000));
		return Math.max(0, PART_MINUTES * 60 - elapsed);
	});

	function goTo(i: number) {
		if (i < 0 || i >= items.length) return;
		index.value = i;
		enterCurrentPart();
	}

	function answer(value: MockAnswer) {
		answers.set(current.value.question.id, value);
	}

	// The clock of a part starts when the child first reaches it, beginning at start().
	return { items, index, current, answers, unanswered, secondsLeft, start: enterCurrentPart, goTo, answer };
}
