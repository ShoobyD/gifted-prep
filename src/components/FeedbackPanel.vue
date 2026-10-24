<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from './AppIcon.vue';
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

const PRAISE = ['כָּל הַכָּבוֹד!', 'מְצֻיָּן!', 'יָפֶה מְאוֹד!', 'מַדְהִים!', 'נָכוֹן!'];

const message = computed(() => {
	switch (props.status) {
		case 'correct':
			return PRAISE[Math.floor(Math.random() * PRAISE.length)];
		case 'wrong':
			return 'לֹא נוֹרָא, נְנַסֶּה שׁוּב';
		case 'revealed':
			return 'זוֹ הַתְּשׁוּבָה הַנְּכוֹנָה. בַּפַּעַם הַבָּאָה!';
		default:
			return '';
	}
});

const showNext = computed(() => props.status === 'correct' || props.status === 'revealed');

// The stamp beside the message.
const stamp = computed(() => {
	if (props.status === 'correct') return 'check';
	if (props.status === 'wrong') return 'retry';
	return 'show';
});
</script>

<template>
	<Transition name="slide">
		<section v-if="status !== 'answering'" class="feedback" :class="`feedback--${status}`" aria-live="polite">
			<p class="message">
				<span class="stamp"><AppIcon :name="stamp" /></span>
				{{ message }}
			</p>
			<div v-if="showNext && explanation" class="explanation-row">
				<p class="explanation"><RichText :text="explanation" /></p>
				<SpeakButton v-if="speakable" :text="textToSpeech(explanation)" />
			</div>
			<button v-if="showNext" type="button" class="next" @click="emit('next')">
				{{ isLast ? 'סִיּוּם' : 'הַשְּׁאֵלָה הַבָּאָה' }}
				<AppIcon name="next" />
			</button>
		</section>
	</Transition>
</template>

<style scoped>
/* A slip in the answer's color, with its stamp. */
.feedback {
	--tone: var(--primary);
	display: grid;
	gap: 12px;
	padding: 16px 20px;
	border-radius: var(--radius);
	background: var(--tint);
}

.feedback--correct {
	--tone: var(--good);
	background: var(--good-soft);
}

.feedback--wrong {
	--tone: var(--warn);
	background: var(--warn-soft);
}

.feedback--revealed {
	--tone: var(--bad);
	background: var(--bad-soft);
}

.message {
	display: flex;
	align-items: center;
	gap: 14px;
	margin: 0;
	font-size: 28px;
	font-weight: 700;
}

.stamp {
	flex: none;
	display: grid;
	place-items: center;
	width: 52px;
	height: 52px;
	border-radius: 50%;
	background: var(--tone);
	color: var(--on-primary);
	font-size: 30px;
	transform: rotate(-8deg);
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
	display: flex;
	align-items: center;
	gap: 12px;
	min-height: 64px;
	padding: 0 28px;
	border: 0;
	border-radius: 18px;
	background: var(--primary);
	color: var(--on-primary);
	font-size: 24px;
	font-weight: 700;
	box-shadow: var(--shadow);
}

.next:active {
	transform: translateY(2px);
}

.slide-enter-active {
	transition: transform .25s cubic-bezier(.16, 1, .3, 1), opacity .2s;
}

.slide-enter-from {
	transform: translateY(12px);
	opacity: 0;
}
</style>
