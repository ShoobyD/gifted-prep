<script setup lang="ts">
import { computed, ref } from 'vue';
import { useChildren } from '@/composables/useChildren';
import { useRemoteProgress } from '@/composables/useRemoteProgress';
import { importedProgress, localDate, parseProgress, resetProgress } from '@/progress/state';
import { formatDateTime } from '@/utils/format';

// The child's settings and progress, managed from a parent device. Every change is written to
// the server; the tablet picks it up the next time it syncs (when the app opens or returns).
const remote = useRemoteProgress();
const { activeChild } = useChildren();
// "the child" until the family's children are known.
const childName = computed(() => activeChild.value?.name ?? 'הילד');
const message = ref('');
const fileInput = ref<HTMLInputElement>();

const voice = computed(() => {
	const report = remote.progress.value?.device;
	if (!report) return { tone: 'busy', text: 'הטאבלט עוד לא דיווח אם יש בו קול בעברית. הדיווח נשלח בפעם הבאה שהאפליקציה נפתחת בו.' };
	if (!report.hebrewVoice) return { tone: 'warn', text: 'לא נמצא בטאבלט קול בעברית, ולכן כפתור ההקראה לא מופיע בו.' };
	return { tone: 'ok', text: `קול בעברית בטאבלט: ${report.hebrewVoice}` };
});

async function setSpeech(speech: boolean) {
	await remote.update((p) => ({ ...p, settings: { ...p.settings, speech, updatedAt: Date.now() } }));
}

function downloadExport() {
	if (!remote.progress.value) return;
	const blob = new Blob([JSON.stringify(remote.progress.value, null, '\t')], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = `gifted-prep-progress-${activeChild.value?.id ?? 'child'}-${localDate(new Date())}.json`;
	link.click();
	URL.revokeObjectURL(url);
}

async function onImport(event: Event) {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];
	input.value = '';
	if (!file) return;
	const parsed = parseProgress(await file.text());
	if (!parsed) {
		message.value = 'הקובץ אינו קובץ התקדמות תקין.';
		return;
	}
	if (!confirm(`הייבוא יחליף את כל ההתקדמות של ${childName.value}, גם בטאבלט. להמשיך?`)) return;
	if (await remote.update((current) => importedProgress(current, parsed))) message.value = 'ההתקדמות יובאה. היא תגיע לטאבלט בפתיחה הבאה שלו.';
}

async function onReset() {
	if (!confirm(`למחוק את כל ההתקדמות של ${childName.value}: כוכבים, מדבקות, סבבים, רמות ושאלות לחזרה? אי אפשר לבטל.`)) return;
	if (await remote.update(resetProgress)) message.value = 'ההתקדמות אופסה. האיפוס יגיע לטאבלט בפתיחה הבאה שלו.';
}
</script>

<template>
	<section class="card">
		<h2>הקראה</h2>
		<label class="setting">
			<input
				type="checkbox"
				:checked="remote.progress.value?.settings.speech ?? true"
				:disabled="remote.saving.value"
				@change="setSpeech(($event.target as HTMLInputElement).checked)"
			>
			<span>כפתור הקראה 🔊 בשאלות חשבון ובהסברים (לא בקטעי קריאה ולא במבחן)</span>
		</label>
		<p class="status-line note" :class="`tone--${voice.tone}`">{{ voice.text }}</p>
		<p v-if="remote.progress.value?.device && !remote.progress.value.device.hebrewVoice" class="note">
			להתקנה בטאבלט: הגדרות ← מערכת ← שפות וקלט ← פלט של המרת טקסט לדיבור ← מנוע Google ←
			התקנת נתונים קוליים ← עברית. אחר כך סוגרים ופותחים את האפליקציה בטאבלט.
		</p>
		<p v-if="remote.progress.value?.device" class="note">דווח: {{ formatDateTime(remote.progress.value.device.reportedAt) }}</p>
	</section>

	<section class="card">
		<h2>ההתקדמות של {{ childName }}</h2>
		<p class="note">השינויים כאן נשמרים בשרת ומגיעים לטאבלט בפעם הבאה שהאפליקציה נפתחת בו או חוזרים אליה.</p>
		<div class="actions">
			<button type="button" class="btn" :disabled="!remote.progress.value" @click="downloadExport">ייצוא לקובץ</button>
			<button type="button" class="btn" :disabled="remote.saving.value" @click="fileInput?.click()">ייבוא מקובץ</button>
			<button type="button" class="btn btn--danger" :disabled="remote.saving.value || !remote.progress.value" @click="onReset">איפוס התקדמות</button>
			<input ref="fileInput" type="file" accept="application/json,.json" hidden @change="onImport">
		</div>
		<p v-if="remote.saving.value" class="message tone--busy" role="status">שומר…</p>
		<p v-else-if="remote.error.value" class="message tone--warn" role="alert">{{ remote.error.value }}</p>
		<p v-else-if="message" class="message tone--ok" role="status">{{ message }}</p>
	</section>
</template>

<style scoped>
.setting {
	display: flex;
	align-items: center;
	gap: 12px;
	cursor: pointer;
}

.setting input {
	flex: none;
	width: 24px;
	height: 24px;
}
</style>
