<script setup lang="ts">
import { computed, ref } from 'vue';
import ParentGate from '@/components/ParentGate.vue';
import ProgressDashboard from '@/components/ProgressDashboard.vue';
import { useDevice } from '@/composables/useDevice';
import { useProgress } from '@/composables/useProgress';
import { useSession } from '@/composables/useSession';
import { useSpeech } from '@/composables/useSpeech';
import { useSync } from '@/composables/useSync';
import { localDate } from '@/progress/state';
import { formatDateTime } from '@/utils/format';

// The parents area on the child's device: the gate, the dashboard on local progress,
// backup status and the device's settings.
const unlocked = ref(false);
const { state, exportJson, importJson, reset } = useProgress();
const speech = useSpeech();
const session = useSession();
const sync = useSync();
const device = useDevice();

const syncState = computed(() => {
	const { status, meta } = sync;
	if (status.value === 'syncing') return { tone: 'busy', text: 'מסנכרן…' };
	if (status.value === 'failed') {
		return meta.dirty
			? { tone: 'warn', text: 'אין חיבור לשרת. השינויים שמורים במכשיר ויישלחו כשהחיבור יחזור.' }
			: { tone: 'warn', text: 'אין חיבור לשרת.' };
	}
	if (meta.dirty) return { tone: 'busy', text: 'יש שינויים שממתינים לשליחה.' };
	if (!meta.lastSyncedAt) return { tone: 'busy', text: 'עוד לא סונכרן.' };
	return { tone: 'ok', text: `מסונכרן ✓ · ${formatDateTime(meta.lastSyncedAt)}` };
});

const fileInput = ref<HTMLInputElement>();
const message = ref('');

function downloadExport() {
	const blob = new Blob([exportJson()], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = `gifted-prep-progress-${localDate(new Date())}.json`;
	link.click();
	URL.revokeObjectURL(url);
}

async function onImport(event: Event) {
	const file = (event.target as HTMLInputElement).files?.[0];
	if (!file) return;
	if (!confirm('הייבוא יחליף את כל ההתקדמות הנוכחית. להמשיך?')) return;
	message.value = importJson(await file.text()) ? 'ההתקדמות יובאה בהצלחה' : 'הקובץ אינו קובץ התקדמות תקין';
	if (fileInput.value) fileInput.value.value = '';
}

function onLogout() {
	if (!confirm('להתנתק? כדי להיכנס שוב תצטרכו את הסיסמה.')) return;
	void session.logout();
}

function onChangeDevice() {
	if (!confirm('לשנות את סוג המכשיר? אחרי הבחירה המכשיר ישמש לתרגול או למעקב בלבד.')) return;
	device.setRole(undefined);
}

function onReset() {
	if (!confirm('למחוק את כל ההתקדמות, הכוכבים והמדבקות? אי אפשר לבטל.')) return;
	reset();
	message.value = 'ההתקדמות אופסה';
}
</script>

<template>
	<ParentGate v-if="!unlocked" @unlock="unlocked = true" />

	<div v-else class="parents">
		<ProgressDashboard :progress="state" />

		<section v-if="session.authenticated.value" class="card">
			<h2>גיבוי בשרת</h2>
			<p class="status-line" :class="`tone--${syncState.tone}`" role="status">{{ syncState.text }}</p>
			<div class="actions">
				<button type="button" class="btn" :disabled="sync.status.value === 'syncing'" @click="sync.syncNow()">סנכרון עכשיו</button>
			</div>
		</section>

		<section class="card">
			<h2>הגדרות</h2>
			<label class="setting">
				<input v-model="state.settings.speech" type="checkbox" :disabled="!speech.hasVoice.value">
				<span>כפתור הקראה 🔊 בשאלות חשבון ובהסברים (לא בקטעי קריאה ולא במבחן)</span>
			</label>
			<p v-if="speech.hasVoice.value" class="note">קול בעברית: {{ speech.voiceName.value }}</p>
			<p v-else class="note">
				לא נמצא במכשיר קול בעברית, ולכן ההקראה לא זמינה. באנדרואיד: הגדרות ← מערכת ← שפות וקלט ← פלט של המרת טקסט לדיבור ←
				מנוע Google ← התקנת נתונים קוליים ← עברית. אחר כך יש לסגור ולפתוח את האפליקציה.
			</p>
			<p class="note">ההתקדמות נשמרת בדפדפן של המכשיר הזה<template v-if="session.authenticated.value"> ומגובה בשרת</template>. אפשר גם לייצא אותה לקובץ.</p>
			<div class="actions">
				<button type="button" class="btn" @click="downloadExport">ייצוא לקובץ</button>
				<button type="button" class="btn" @click="fileInput?.click()">ייבוא מקובץ</button>
				<button type="button" class="btn btn--danger" @click="onReset">איפוס התקדמות</button>
				<input ref="fileInput" type="file" accept="application/json,.json" hidden @change="onImport">
			</div>
			<div v-if="session.authenticated.value" class="actions">
				<button type="button" class="btn" @click="onChangeDevice">שינוי סוג המכשיר</button>
				<button type="button" class="btn" @click="onLogout">התנתקות מהמכשיר הזה</button>
			</div>
			<p v-if="message" class="message" role="status">{{ message }}</p>
		</section>
	</div>
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
