<script setup lang="ts">
import RichText from './RichText.vue';

const LABELS = ['א', 'ב', 'ג', 'ד', 'ה'];

defineProps<{
	options: string[];
	// Options already tried and wrong.
	wrong: number[];
	// Index to highlight as correct (after answering correctly or revealing).
	correct?: number;
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
	padding: 12px 16px;
	border: 3px solid #e2ddff;
	border-radius: 18px;
	background: var(--surface);
	text-align: start;
	font-size: 24px;
	box-shadow: var(--shadow);
	transition: transform .1s, background .2s;
}

.choice:active:not(:disabled) {
	transform: translateY(2px);
}

.choice:disabled {
	cursor: default;
}

.choice-label {
	flex: none;
	display: grid;
	place-items: center;
	width: 48px;
	height: 48px;
	border-radius: 50%;
	background: #ece8ff;
	font-weight: 700;
}

.choice--wrong {
	border-color: var(--bad);
	background: #ffeceb;
	opacity: .7;
	animation: shake .35s;
}

.choice--correct {
	border-color: var(--good);
	background: #e3f8ef;
	animation: pop .35s;
}

.choice--correct .choice-label {
	background: var(--good);
	color: #fff;
}
</style>
