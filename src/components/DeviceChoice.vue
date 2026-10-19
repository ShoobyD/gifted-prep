<script setup lang="ts">
import { ref } from 'vue';
import TabletModePicker from '@/components/TabletModePicker.vue';
import { useChildren } from '@/composables/useChildren';
import { useDevice } from '@/composables/useDevice';
import { useTablet, type TabletMode } from '@/composables/useTablet';

// Asked once per device, right after the first login. A child's tablet in a family with
// several children also says whose it is.
const { setRole } = useDevice();
const { children } = useChildren();
const tablet = useTablet();
const step = ref<'role' | 'tablet'>('role');

function chooseChildDevice() {
	if (children.value.length > 1) step.value = 'tablet';
	else setRole('child');
}

function onPick(mode: TabletMode, childId?: string) {
	tablet.setMode(mode, childId);
	setRole('child');
}
</script>

<template>
	<section v-if="step === 'tablet'" class="choice">
		<h2 class="title">של מי הטאבלט?</h2>
		<p class="hint">אפשר לשנות אחר כך בלחיצה ארוכה על הכותרת.</p>
		<TabletModePicker class="tablet-modes" @pick="onPick" />
		<button type="button" class="back" @click="step = 'role'">חזרה</button>
	</section>
	<section v-else class="choice">
		<h2 class="title">מה המכשיר הזה?</h2>
		<p class="hint">בוחרים פעם אחת. אפשר לשנות אחר כך: במכשיר הורה בלשונית "הגדרות", ובטאבלט בלחיצה ארוכה על הכותרת.</p>
		<div class="options">
			<button type="button" class="option" @click="chooseChildDevice">
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
.tablet-modes {
	max-width: 640px;
}

.back {
	min-height: 44px;
	padding: 0 20px;
	border: 2px solid #e2ddff;
	border-radius: 14px;
	background: var(--surface);
	font: inherit;
}

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
