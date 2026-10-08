<script setup lang="ts">
import { computed, ref } from 'vue';
import ChoiceList from './ChoiceList.vue';
import NumPad from './NumPad.vue';
import QuestionStem from './QuestionStem.vue';
import { checkChoice, checkNumber } from '@/engine/checkAnswer';
import type { QuestionStatus } from '@/composables/useQuizSession';
import type { Question } from '@/types';

// Owns the input state of one question; the parent keys it by question id to reset.
const props = defineProps<{
	question: Question;
	status: QuestionStatus;
}>();

const emit = defineEmits<{ submit: [correct: boolean] }>();

const wrongChoices = ref<number[]>([]);
const typed = ref('');
// Last wrong number, kept on screen briefly so the child sees what was checked.
const lastWrong = ref('');

const closed = computed(() => props.status === 'correct' || props.status === 'revealed');

const correctChoice = computed(() => {
	const { answer } = props.question;
	return answer.kind === 'choice' && closed.value ? answer.correctIndex : undefined;
});

const blankFill = computed(() => {
	const { answer } = props.question;
	// Choice with a box in the expression (e.g. a missing operation sign): show the answer once closed.
	if (answer.kind === 'choice') return closed.value ? answer.options[answer.correctIndex] : undefined;
	if (props.status === 'revealed') return String(answer.solution);
	return typed.value || lastWrong.value;
});

const blankState = computed(() => {
	if (props.status === 'correct') return 'correct';
	if (props.status === 'revealed') return 'revealed';
	if (!typed.value && lastWrong.value) return 'wrong';
	return undefined;
});

function pickChoice(index: number) {
	const { answer } = props.question;
	if (answer.kind !== 'choice') return;
	const correct = checkChoice(answer, index);
	if (!correct) wrongChoices.value.push(index);
	emit('submit', correct);
}

function submitNumber() {
	const { answer } = props.question;
	if (answer.kind !== 'number' || !typed.value) return;
	const correct = checkNumber(answer, Number(typed.value));
	if (!correct) {
		lastWrong.value = typed.value;
		typed.value = '';
	}
	emit('submit', correct);
}
</script>

<template>
	<article class="card">
		<QuestionStem :question="question" :fill="blankFill" :state="blankState" />

		<ChoiceList
			v-if="question.answer.kind === 'choice'"
			:options="question.answer.options"
			:wrong="wrongChoices"
			:correct="correctChoice"
			:disabled="closed"
			@pick="pickChoice"
		/>
		<template v-else>
			<p v-if="!question.math" class="typed" :class="blankState && `typed--${blankState}`">
				{{ blankFill || ' ' }}
			</p>
			<NumPad v-model="typed" :disabled="closed" @submit="submitNumber" />
		</template>
	</article>
</template>

<style scoped>
.card {
	display: grid;
	gap: 20px;
}

.typed {
	justify-self: center;
	min-width: 140px;
	margin: 0;
	padding: 4px 16px;
	border: 4px dashed var(--primary);
	border-radius: 14px;
	font-size: 40px;
	font-weight: 700;
	text-align: center;
	color: var(--primary);
}

.typed--correct,
.typed--revealed {
	border-style: solid;
	border-color: var(--good);
	color: var(--good);
}

.typed--wrong {
	border-color: var(--bad);
}
</style>
