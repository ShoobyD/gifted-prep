<script setup lang="ts">
import MathExpression from './MathExpression.vue';
import RichText from './RichText.vue';
import type { Question } from '@/types';

// The question itself (instruction, text, given facts, expression), without the answer input.
defineProps<{
	question: Question;
	// Value shown in the expression's box.
	fill?: string;
	state?: 'correct' | 'wrong' | 'revealed';
	// In a mock test the section already shows the instruction.
	hidePrompt?: boolean;
}>();
</script>

<template>
	<p v-if="question.prompt && !hidePrompt" class="prompt">{{ question.prompt }}</p>
	<p v-if="question.body" class="body"><RichText :text="question.body" /></p>
	<img v-if="question.image" class="image" :src="question.image" alt="">
	<div v-if="question.lines?.length" class="given">
		<MathExpression v-for="line in question.lines" :key="line" :expression="line" />
	</div>
	<div v-if="question.math" class="math-row">
		<MathExpression :expression="question.math" :fill="fill" :state="state" />
	</div>
</template>

<style scoped>
.prompt {
	margin: 0;
	color: var(--muted);
	font-size: 22px;
}

.body {
	margin: 0;
	font-size: 26px;
	line-height: 1.7;
}

/* On a tablet the question is the page's main thing, read alone by a young child: it
   runs large, and the small instruction above it stays small. */
@media (min-width: 700px) {
	.body {
		font-size: 34px;
		line-height: 1.55;
	}
}

.image {
	max-width: 100%;
	justify-self: center;
}

.given {
	display: grid;
	justify-items: center;
	gap: 4px;
	padding: 12px;
	border: 2px solid var(--line-soft);
	border-radius: 18px;
	background: var(--tint-soft);
}

.math-row {
	text-align: center;
	padding: 8px 0;
}
</style>
