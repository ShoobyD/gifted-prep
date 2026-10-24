<script setup lang="ts">
import { ref } from 'vue';

// A grown-up check: a multiplication a 7-year-old is unlikely to know yet.
const emit = defineEmits<{ unlock: [] }>();

const a = 6 + Math.floor(Math.random() * 4);
const b = 6 + Math.floor(Math.random() * 4);
const value = ref('');
const wrong = ref(false);

function check() {
	if (Number(value.value) === a * b) {
		emit('unlock');
	} else {
		wrong.value = true;
		value.value = '';
	}
}
</script>

<template>
	<form class="gate" @submit.prevent="check">
		<p class="title">אזור הורים</p>
		<label class="question" for="gate-answer">
			כמה זה <bdi dir="ltr">{{ a }} × {{ b }}</bdi>?
		</label>
		<input
			id="gate-answer"
			v-model="value"
			class="input"
			type="text"
			inputmode="numeric"
			autocomplete="off"
			dir="ltr"
		>
		<p v-if="wrong" class="error">לא נכון, נסו שוב</p>
		<button type="submit" class="submit" :disabled="!value">כניסה</button>
	</form>
</template>

<style scoped>
.gate {
	display: grid;
	justify-items: center;
	gap: 16px;
	max-width: 360px;
	margin: 48px auto 0;
	padding: 24px;
	border-radius: var(--radius);
	background: var(--surface);
	box-shadow: var(--shadow);
}

.title {
	margin: 0;
	font-size: 28px;
	font-weight: 700;
}

.input {
	width: 140px;
	padding: 8px;
	border: 3px solid var(--line);
	border-radius: 14px;
	font: inherit;
	font-size: 32px;
	text-align: center;
	user-select: text;
}

.error {
	margin: 0;
	color: var(--bad);
}

.submit {
	min-height: 56px;
	padding: 0 32px;
	border: 0;
	border-radius: 16px;
	background: var(--primary);
	color: var(--on-primary);
	font-weight: 700;
}

.submit:disabled {
	opacity: .5;
}
</style>
