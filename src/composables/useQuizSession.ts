import { computed, ref } from 'vue';
import type { Question } from '@/types';

export const MAX_ATTEMPTS = 2;

// answering: waiting for input; wrong: a failed attempt, another is allowed;
// correct / revealed: the question is closed and the child moves on.
export type QuestionStatus = 'answering' | 'wrong' | 'correct' | 'revealed';

export type Outcome = 'first' | 'second' | 'failed';

export function useQuizSession(questions: Question[]) {
	const index = ref(0);
	const attempts = ref(0);
	const status = ref<QuestionStatus>('answering');
	const outcomes = ref<Outcome[]>([]);

	const current = computed(() => questions[index.value]);
	const finished = computed(() => index.value >= questions.length);
	const isClosed = computed(() => status.value === 'correct' || status.value === 'revealed');
	const correctCount = computed(() => outcomes.value.filter((o) => o !== 'failed').length);

	function submit(correct: boolean) {
		if (isClosed.value) return;
		attempts.value++;
		if (correct) {
			status.value = 'correct';
			outcomes.value.push(attempts.value === 1 ? 'first' : 'second');
		} else if (attempts.value >= MAX_ATTEMPTS) {
			status.value = 'revealed';
			outcomes.value.push('failed');
		} else {
			status.value = 'wrong';
		}
	}

	function next() {
		if (!isClosed.value) return;
		index.value++;
		attempts.value = 0;
		status.value = 'answering';
	}

	return {
		total: questions.length,
		index,
		current,
		status,
		outcomes,
		finished,
		isClosed,
		correctCount,
		submit,
		next,
	};
}
