<script setup lang="ts">
import { computed } from 'vue';
import QuestionStem from '@/components/QuestionStem.vue';
import RichText from '@/components/RichText.vue';
import { SOURCE_LABELS } from '@/data/content';
import { TYPE_LABELS } from '@/data/labels';
import { CHOICE_LABELS, correctAnswerText } from '@/engine/answerText';
import type { Question } from '@/types';

// A question as the child sees it, with the answer and explanation revealed, for the bank.
const props = defineProps<{ question: Question }>();

// A typed answer is shown inside the expression's box, like after a reveal in practice.
const fill = computed(() =>
	props.question.answer.kind === 'number' ? String(props.question.answer.solution) : undefined,
);
</script>

<template>
	<article class="preview">
		<p class="meta">
			{{ TYPE_LABELS[question.type] }}
			<template v-if="question.source"> · {{ SOURCE_LABELS[question.source] }}</template>
			<template v-if="question.sourceNote"> · {{ question.sourceNote }}</template>
		</p>
		<div class="stem">
			<QuestionStem :question="question" :fill="fill" state="revealed" />
		</div>
		<ol v-if="question.answer.kind === 'choice'" class="options">
			<li
				v-for="(option, i) in question.answer.options"
				:key="i"
				class="option"
				:class="{ correct: i === question.answer.correctIndex }"
			>
				<span class="label">{{ CHOICE_LABELS[i] }}</span>
				<RichText :text="option" />
				<span v-if="i === question.answer.correctIndex" class="check" aria-label="התשובה הנכונה">✓</span>
			</li>
		</ol>
		<p v-else class="answer">התשובה: <RichText :text="correctAnswerText(question)" /></p>
		<p v-if="question.explanation" class="explanation"><RichText :text="question.explanation" /></p>
	</article>
</template>

<style scoped>
.preview {
	display: grid;
	gap: 10px;
}

.meta {
	margin: 0;
	color: var(--muted);
	font-size: 14px;
}

.stem {
	display: grid;
	gap: 10px;
	font-size: 20px;
}

/* The child-size text is too big for a list on a phone. */
.stem :deep(.body) {
	font-size: 20px;
}

.stem :deep(.math) {
	font-size: 28px;
}

.options {
	display: grid;
	gap: 6px;
	margin: 0;
	padding: 0;
	list-style: none;
}

.option {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 6px 10px;
	border: 2px solid #eeeaff;
	border-radius: 12px;
}

.option.correct {
	border-color: var(--good);
	background: #e3f8ef;
	font-weight: 700;
}

.label {
	flex: none;
	display: grid;
	place-items: center;
	width: 28px;
	height: 28px;
	border-radius: 50%;
	background: #ece8ff;
	font-size: 15px;
}

.check {
	margin-inline-start: auto;
	color: var(--good);
}

.answer {
	margin: 0;
	font-weight: 700;
	color: var(--good);
}

.explanation {
	margin: 0;
	color: var(--muted);
	font-size: 16px;
}
</style>
