<script setup lang="ts">
import { computed } from 'vue';
import RichText from './RichText.vue';
import SpeakButton from './SpeakButton.vue';
import type { QuestionStatus } from '@/composables/useQuizSession';
import { textToSpeech } from '@/speech/speechText';

const props = defineProps<{
	status: QuestionStatus;
	explanation?: string;
	isLast: boolean;
	speakable?: boolean;
}>();

const emit = defineEmits<{ next: [] }>();

const PRAISE = ['כָּל הַכָּבוֹד!', 'מְצֻיָּן!', 'יָפֶה מְאוֹד!', 'אַלּוּף!', 'נָכוֹן!'];

const message = computed(() => {
	switch (props.status) {
		case 'correct':
			return `${PRAISE[Math.floor(Math.random() * PRAISE.length)]} ⭐`;
		case 'wrong':
			return 'לֹא נוֹרָא, נַסֵּה שׁוּב 💪';
		case 'revealed':
			return 'זוֹ הַתְּשׁוּבָה הַנְּכוֹנָה. בַּפַּעַם הַבָּאָה! 🌱';
		default:
			return '';
	}
});

const showNext = computed(() => props.status === 'correct' || props.status === 'revealed');
</script>

<template>
	<Transition name="slide">
		<section v-if="status !== 'answering'" class="feedback" :class="`feedback--${status}`" aria-live="polite">
			<p class="message">{{ message }}</p>
			<div v-if="showNext && explanation" class="explanation-row">
				<p class="explanation"><RichText :text="explanation" /></p>
				<SpeakButton v-if="speakable" :text="textToSpeech(explanation)" />
			</div>
			<button v-if="showNext" type="button" class="next" @click="emit('next')">
				{{ isLast ? 'סִיּוּם' : 'הַשְּׁאֵלָה הַבָּאָה' }} ←
			</button>
		</section>
	</Transition>
</template>

<style scoped>
.feedback {
	display: grid;
	gap: 12px;
	padding: 16px 20px;
	border-radius: var(--radius);
	background: var(--surface);
	box-shadow: var(--shadow);
	border-inline-start: 10px solid var(--primary);
}

.feedback--correct {
	border-color: var(--good);
}

.feedback--wrong {
	border-color: var(--warn);
}

.feedback--revealed {
	border-color: var(--bad);
}

.message {
	margin: 0;
	font-size: 28px;
	font-weight: 700;
}

.explanation-row {
	display: flex;
	align-items: flex-start;
	gap: 12px;
}

.explanation {
	flex: 1;
	margin: 0;
	color: var(--muted);
}

.next {
	justify-self: end;
	min-height: 64px;
	padding: 0 28px;
	border: 0;
	border-radius: 18px;
	background: var(--primary);
	color: #fff;
	font-size: 24px;
	font-weight: 700;
	box-shadow: var(--shadow);
}

.slide-enter-active {
	transition: transform .2s, opacity .2s;
}

.slide-enter-from {
	transform: translateY(12px);
	opacity: 0;
}
</style>
