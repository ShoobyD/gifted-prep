<script setup lang="ts">
import FeedbackPanel from '@/components/FeedbackPanel.vue';
import PassageText from '@/components/PassageText.vue';
import QuestionCard from '@/components/QuestionCard.vue';
import { useQuizSession } from '@/composables/useQuizSession';
import type { Passage, QuestionSource } from '@/types';

const props = defineProps<{
	source: QuestionSource;
	// Reading practice: the text stays visible while answering.
	passage?: Passage;
}>();

const session = useQuizSession(props.source);
const { index, current, status, finished, correctCount, total, submit, next } = session;
</script>

<template>
	<div v-if="!finished && current" class="practice" :class="{ 'practice--reading': passage }">
		<details v-if="passage" class="passage-panel" open>
			<summary>📖 הַטֶּקְסְט</summary>
			<div class="passage-scroll">
				<PassageText :passage="passage" />
			</div>
		</details>

		<div class="question-col">
			<div class="progress" role="progressbar" :aria-valuenow="index" :aria-valuemax="total">
				<span
					v-for="n in total"
					:key="n"
					class="dot"
					:class="{
						'dot--done': n - 1 < index,
						'dot--current': n - 1 === index,
					}"
				/>
			</div>

			<QuestionCard :key="current.id" :question="current" :status="status" @submit="submit" />
			<FeedbackPanel
				:status="status"
				:explanation="current.explanation"
				:is-last="index === total - 1"
				@next="next"
			/>
		</div>
	</div>

	<div v-else class="done">
		<p class="done-title">סִיַּמְתֶּם! 🎉</p>
		<p class="done-score">{{ correctCount }} מִתּוֹךְ {{ total }} נְכוֹנוֹת</p>
		<RouterLink class="done-home" :to="{ name: 'home' }" replace>לְמָסַךְ הַבַּיִת</RouterLink>
	</div>
</template>

<style scoped>
.practice,
.question-col {
	display: grid;
	gap: 24px;
	align-content: start;
}

.passage-panel summary {
	padding: 8px 4px;
	font-weight: 700;
	cursor: pointer;
}

/* Portrait: the text is a scrollable panel above the question. */
.passage-scroll {
	max-height: 42vh;
	overflow-y: auto;
	border-radius: var(--radius);
}

/* Landscape tablet: text and question side by side. */
@media (min-width: 1000px) {
	.practice--reading {
		grid-template-columns: 1fr 1fr;
	}

	.practice--reading .passage-scroll {
		max-height: calc(100vh - 160px);
	}
}

.progress {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	justify-content: center;
}

.dot {
	width: 18px;
	height: 18px;
	border-radius: 50%;
	background: #dcd6ff;
}

.dot--done {
	background: var(--primary);
}

.dot--current {
	outline: 3px solid var(--primary);
	outline-offset: 2px;
}

.done {
	display: grid;
	justify-items: center;
	gap: 12px;
	margin-top: 48px;
	text-align: center;
}

.done-title {
	margin: 0;
	font-size: 40px;
	font-weight: 700;
}

.done-score {
	margin: 0;
	font-size: 28px;
}

.done-home {
	margin-top: 16px;
	padding: 16px 32px;
	border-radius: 18px;
	background: var(--primary);
	color: #fff;
	font-weight: 700;
	text-decoration: none;
	box-shadow: var(--shadow);
}
</style>
