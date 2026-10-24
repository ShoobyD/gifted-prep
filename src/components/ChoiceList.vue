<script setup lang="ts">
import RichText from './RichText.vue';

const LABELS = ['א', 'ב', 'ג', 'ד', 'ה'];

defineProps<{
	options: string[];
	// Options already tried and wrong.
	wrong: number[];
	// Index to highlight as correct (after answering correctly or revealing).
	correct?: number;
	// Neutral "chosen" mark, used in mock tests where there is no feedback.
	selected?: number;
	disabled: boolean;
}>();

const emit = defineEmits<{ pick: [index: number] }>();
</script>

<template>
	<ol class="choices">
		<li v-for="(option, i) in options" :key="i">
			<button
				type="button"
				class="choice"
				:class="{
					'choice--wrong': wrong.includes(i),
					'choice--correct': correct === i,
					'choice--selected': selected === i,
				}"
				:disabled="disabled || wrong.includes(i)"
				@click="emit('pick', i)"
			>
				<span class="choice-label">{{ LABELS[i] }}</span>
				<span class="choice-text"><RichText :text="option" /></span>
			</button>
		</li>
	</ol>
</template>

<style scoped>
.choices {
	display: grid;
	gap: 14px;
	margin: 0;
	padding: 0;
	list-style: none;
}

.choice {
	display: flex;
	align-items: center;
	gap: 16px;
	width: 100%;
	min-height: 72px;
	padding: 10px 14px;
	border: 3px solid var(--line);
	border-radius: 16px;
	background: var(--surface);
	text-align: start;
	font-size: 24px;
	box-shadow: var(--shadow-sm);
	transition: transform .1s, background-color .2s, border-color .2s;
}

.choice:active:not(:disabled) {
	transform: translateY(2px);
}

.choice:disabled {
	cursor: default;
}

/* The letter on a little tile, like a sticker's number. */
.choice-label {
	flex: none;
	display: grid;
	place-items: center;
	width: 48px;
	height: 48px;
	border-radius: 12px;
	background: var(--tint);
	color: var(--primary);
	font-family: var(--font-display);
	font-size: 34px;
	font-weight: 700;
	line-height: 1;
}

.choice--wrong {
	border-color: var(--bad);
	background: var(--bad-soft);
	opacity: .7;
	animation: shake .35s;
}

.choice--correct {
	border-color: var(--good);
	background: var(--good-soft);
	animation: pop .35s;
}

.choice--selected {
	border-color: var(--primary);
	background: var(--tint);
}

/* On a tablet the answers grow with the question. */
@media (min-width: 700px) {
	.choice {
		min-height: 84px;
		font-size: 28px;
	}

	.choice-label {
		width: 56px;
		height: 56px;
		font-size: 40px;
	}
}

.choice--selected .choice-label {
	background: var(--primary);
	color: var(--on-primary);
}

.choice--correct .choice-label {
	background: var(--good);
	color: var(--on-primary);
}
</style>
