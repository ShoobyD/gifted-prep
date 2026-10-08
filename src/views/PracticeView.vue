<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import FeedbackPanel from '@/components/FeedbackPanel.vue';
import PassageText from '@/components/PassageText.vue';
import QuestionCard from '@/components/QuestionCard.vue';
import SessionSummary from '@/components/SessionSummary.vue';
import { useProgress } from '@/composables/useProgress';
import { useQuizSession } from '@/composables/useQuizSession';
import type { Sticker } from '@/progress/stickers';
import { starsFor } from '@/progress/state';
import type { Passage, QuestionSource } from '@/types';

const props = defineProps<{
	set: string;
	source: QuestionSource;
	// Reading practice: the text stays visible while answering.
	passage?: Passage;
}>();

const router = useRouter();
const progress = useProgress();
const startedAt = Date.now();
const earnedStickers = ref<Sticker[]>([]);

const session = useQuizSession(props.source, {
	onClose: (question, outcome) => progress.recordAnswer(question.type, outcome),
	onFinish: () => {
		earnedStickers.value = progress.finishSession(
			{
				at: new Date().toISOString(),
				set: props.set,
				correct: correctCount.value,
				total,
				stars: stars.value,
				seconds: Math.round((Date.now() - startedAt) / 1000),
			},
			props.passage?.id,
		);
	},
});
const { index, current, status, finished, correctCount, outcomes, total, submit, next } = session;

const stars = computed(() => outcomes.value.reduce((sum, o) => sum + starsFor(o), 0));

// Same set again; the changed query remounts the view (App keys RouterView by full path).
function again() {
	router.replace({ query: { run: Date.now() } });
}
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

	<SessionSummary
		v-else
		:correct="correctCount"
		:total="total"
		:stars="stars"
		:stickers="earnedStickers"
		@again="again"
	/>
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
</style>
