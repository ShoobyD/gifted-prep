<script setup lang="ts">
import AppIcon from './AppIcon.vue';

const MAX_DIGITS = 3;

const model = defineModel<string>({ required: true });

defineProps<{
	disabled: boolean;
	// Mock tests save as you type, with no check button.
	noSubmit?: boolean;
}>();

const emit = defineEmits<{ submit: [] }>();

// Phone-style order; rendered left-to-right regardless of page direction.
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

function press(digit: string) {
	if (model.value.length >= MAX_DIGITS) return;
	// No leading zeros ("07").
	model.value = model.value === '0' ? digit : model.value + digit;
}

function erase() {
	model.value = model.value.slice(0, -1);
}
</script>

<template>
	<div class="numpad" dir="ltr">
		<button
			v-for="key in KEYS"
			:key="key"
			type="button"
			class="key"
			:disabled="disabled"
			@click="press(key)"
		>
			{{ key }}
		</button>
		<button type="button" class="key key--erase" :disabled="disabled || !model" aria-label="מחיקה" @click="erase"><AppIcon name="erase" /></button>
		<button type="button" class="key" :disabled="disabled" @click="press('0')">0</button>
		<button v-if="!noSubmit" type="button" class="key key--ok" :disabled="disabled || !model" @click="emit('submit')">בְּדִיקָה</button>
	</div>
</template>

<style scoped>
.numpad {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 12px;
	max-width: 380px;
	margin: 0 auto;
}

.key {
	display: grid;
	place-items: center;
	min-height: 72px;
	border: 3px solid var(--line);
	border-radius: 16px;
	background: var(--surface);
	box-shadow: var(--shadow-sm);
	font-size: 34px;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
}

.key:active:not(:disabled) {
	transform: translateY(2px);
	box-shadow: none;
}

.key:disabled {
	opacity: .45;
	cursor: default;
}

.key--erase {
	border-color: var(--accent-soft);
	background: var(--accent-soft);
	color: var(--reading);
}

.key--ok {
	border-color: var(--good);
	background: var(--good);
	color: var(--on-primary);
	font-size: 24px;
}
</style>
