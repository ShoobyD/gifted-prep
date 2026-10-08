<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import FeedbackPanel from '@/components/FeedbackPanel.vue';
import PassagePanel from '@/components/PassagePanel.vue';
import QuestionCard from '@/components/QuestionCard.vue';
import SessionSummary from '@/components/SessionSummary.vue';
import { useProgress } from '@/composables/useProgress';
import { useQuizSession } from '@/composables/useQuizSession';
import type { Sticker } from '@/progress/stickers';
import { starsFor } from '@/progress/state';
import type { Passage, Question, QuestionSource } from '@/types';

const props = defineProps<{
	set: string;
	source: QuestionSource;
	// Reading practice: the text stays visible while answering.
	passage?: Passage;
	// Mixed sessions (review): each reading question brings its own passage.
	passageOf?: (question: Question) => Passage | undefined;
}>();

const router = useRouter();
const progress = useProgress();
const startedAt = Date.now();
const earnedStickers = ref<Sticker[]>([]);

const session = useQuizSession(props.source, {
	onClose: (question, outcome) => {
		progress.recordAnswer(question.type, outcome);
		progress.recordMistake(question, outcome, passageFor(question)?.id);
	},
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

// Captured once, like the source: the session must not change under the child mid-way.
const { passage, passageOf } = props;

function passageFor(question: Question): Passage | undefined {
	return passage ?? passageOf?.(question);
}

const currentPassage = computed(() => (current.value ? passageFor(current.value) : undefined));

const stars = computed(() => outcomes.value.reduce((sum, o) => sum + starsFor(o), 0));

// Same set again; the changed query remounts the view (App keys RouterView by full path).
function again() {
	router.replace({ query: { run: Date.now() } });
}
</script>

<template>
	<div v-if="!finished && current" class="practice" :class="{ 'practice--reading': currentPassage }">
		<PassagePanel v-if="currentPassage" :key="currentPassage.id" :passage="currentPassage" />

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

			<QuestionCard :key="current.id" :question="current" :status="status" :speakable="!currentPassage" @submit="submit" />
			<FeedbackPanel
				:status="status"
				:explanation="current.explanation"
				:is-last="index === total - 1"
				:speakable="!currentPassage"
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

/* Landscape tablet: text and question side by side. */
@media (min-width: 1000px) {
	.practice--reading {
		grid-template-columns: 1fr 1fr;
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
