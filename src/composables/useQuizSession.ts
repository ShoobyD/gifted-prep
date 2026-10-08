import { computed, ref } from 'vue';
import type { Outcome, Question, QuestionSource } from '@/types';

export const MAX_ATTEMPTS = 2;

// answering: waiting for input; wrong: a failed attempt, another is allowed;
// correct / revealed: the question is closed and the child moves on.
export type QuestionStatus = 'answering' | 'wrong' | 'correct' | 'revealed';

export interface QuizHooks {
	onClose?(question: Question, outcome: Outcome): void;
	onFinish?(): void;
}

export function useQuizSession(source: QuestionSource, hooks: QuizHooks = {}) {
	// Questions are pulled lazily so the source can adapt to earlier outcomes.
	const questions = ref<Question[]>([source.next()]);
	const index = ref(0);
	const attempts = ref(0);
	const status = ref<QuestionStatus>('answering');
	const outcomes = ref<Outcome[]>([]);

	const current = computed(() => questions.value[index.value]);
	const finished = computed(() => index.value >= source.total);
	const isClosed = computed(() => status.value === 'correct' || status.value === 'revealed');
	const correctCount = computed(() => outcomes.value.filter((o) => o !== 'failed').length);

	function close(outcome: Outcome) {
		outcomes.value.push(outcome);
		if (!current.value) return;
		source.report?.(current.value, outcome);
		hooks.onClose?.(current.value, outcome);
	}

	function submit(correct: boolean) {
		if (isClosed.value) return;
		attempts.value++;
		if (correct) {
			status.value = 'correct';
			close(attempts.value === 1 ? 'first' : 'second');
		} else if (attempts.value >= MAX_ATTEMPTS) {
			status.value = 'revealed';
			close('failed');
		} else {
			status.value = 'wrong';
		}
	}

	function next() {
		if (!isClosed.value) return;
		index.value++;
		attempts.value = 0;
		status.value = 'answering';
		if (index.value < source.total) questions.value.push(source.next());
		else hooks.onFinish?.();
	}

	return {
		total: source.total,
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
