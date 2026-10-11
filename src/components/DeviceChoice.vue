<script setup lang="ts">
import { useDevice } from '@/composables/useDevice';

// Asked once per device, right after the first login.
const { setRole } = useDevice();
</script>

<template>
	<section class="choice">
		<h2 class="title">מה המכשיר הזה?</h2>
		<p class="hint">בוחרים פעם אחת. אפשר לשנות אחר כך באזור ההורים.</p>
		<div class="options">
			<button type="button" class="option" @click="setRole('child')">
				<span class="icon" aria-hidden="true">🧒</span>
				<span class="label">הַטַּאבְּלֶט שֶׁל הַיֶּלֶד</span>
				<span class="desc">לתרגול. ההתקדמות נשמרת כאן ומגובה בשרת.</span>
			</button>
			<button type="button" class="option" @click="setRole('parent')">
				<span class="icon" aria-hidden="true">📊</span>
				<span class="label">מכשיר של הורה</span>
				<span class="desc">למעקב בלבד: מציג את ההתקדמות שהטאבלט שמר בשרת.</span>
			</button>
		</div>
	</section>
</template>

<style scoped>
.choice {
	display: grid;
	justify-items: center;
	gap: 12px;
	margin-top: 24px;
	text-align: center;
}

.title {
	margin: 0;
	font-size: 30px;
}

.hint {
	margin: 0;
	color: var(--muted);
	font-size: 18px;
}

.options {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	gap: 16px;
	width: 100%;
	max-width: 640px;
	margin-top: 8px;
}

.option {
	display: grid;
	justify-items: center;
	gap: 8px;
	padding: 24px 16px;
	border: 0;
	border-radius: var(--radius);
	border-bottom: 6px solid var(--primary);
	background: var(--surface);
	box-shadow: var(--shadow);
}

.option:active {
	transform: translateY(3px);
}

.icon {
	font-size: 56px;
	line-height: 1;
}

.label {
	font-size: 24px;
	font-weight: 700;
}

.desc {
	color: var(--muted);
	font-size: 16px;
	line-height: 1.4;
}
</style>
