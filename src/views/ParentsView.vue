<script setup lang="ts">
import { computed, ref } from 'vue';
import ParentGate from '@/components/ParentGate.vue';
import { useProgress } from '@/composables/useProgress';
import { useSpeech } from '@/composables/useSpeech';
import { ALL_PASSAGES } from '@/data/content';
import { TYPE_LABELS } from '@/data/labels';
import { describeSet } from '@/data/questionSets';
import { MATH_TYPES, isMathType } from '@/generators';
import { attempts, localDate, successRate } from '@/progress/state';
import type { QuestionType } from '@/types';

const MIN_ATTEMPTS = 5;
const WEAK_BELOW = 0.7;

const unlocked = ref(false);
const { state, streak, exportJson, importJson, reset } = useProgress();
const speech = useSpeech();

const READING_TYPES: QuestionType[] = ['reading-fact', 'word-meaning', 'author-purpose', 'inference', 'not-answered', 'pronoun', 'word-relation'];

type Status = 'good' | 'warn' | 'bad' | 'none';

interface Row {
	type: QuestionType;
	label: string;
	attempts: number;
	rate?: number;
	status: Status;
	level?: number;
}

function rowFor(type: QuestionType): Row {
	const stats = state.typeStats[type];
	const count = attempts(stats);
	const rate = successRate(stats);
	const status: Status = rate === undefined || count < MIN_ATTEMPTS
		? 'none'
		: rate >= 0.8 ? 'good' : rate >= 0.6 ? 'warn' : 'bad';
	return {
		type,
		label: TYPE_LABELS[type],
		attempts: count,
		rate,
		status,
		level: isMathType(type) ? state.levels[type] : undefined,
	};
}

const groups = computed(() => [
	{ title: 'הבנת הנקרא', rows: READING_TYPES.map(rowFor) },
	{ title: 'חשבון', rows: MATH_TYPES.map(rowFor) },
]);

const weak = computed(() =>
	groups.value
		.flatMap((g) => g.rows)
		.filter((r) => r.status !== 'none' && (r.rate ?? 1) < WEAK_BELOW)
		.sort((x, y) => (x.rate ?? 0) - (y.rate ?? 0)),
);

const weekMinutes = computed(() => {
	const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
	const seconds = state.sessions
		.filter((s) => new Date(s.at).getTime() >= since)
		.reduce((sum, s) => sum + s.seconds, 0);
	return Math.round(seconds / 60);
});

const recent = computed(() => [...state.sessions].reverse().slice(0, 15));

const STATUS_ICON: Record<Status, string> = { good: '✔', warn: '▲', bad: '✖', none: '–' };

const percent = (rate: number | undefined) => (rate === undefined ? '' : `${Math.round(rate * 100)}%`);

function formatDate(iso: string) {
	const d = new Date(iso);
	return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDuration(seconds: number) {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${String(s).padStart(2, '0')}`;
}

// --- Settings ---------------------------------------------------------------

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

function onReset() {
	if (!confirm('למחוק את כל ההתקדמות, הכוכבים והמדבקות? אי אפשר לבטל.')) return;
	reset();
	message.value = 'ההתקדמות אופסה';
}
</script>

<template>
	<ParentGate v-if="!unlocked" @unlock="unlocked = true" />

	<div v-else class="parents">
		<section class="tiles">
			<div class="tile"><span class="tile-value">{{ state.sessions.length }}</span><span class="tile-label">סבבי תרגול</span></div>
			<div class="tile"><span class="tile-value">{{ weekMinutes }}</span><span class="tile-label">דקות ב-7 הימים האחרונים</span></div>
			<div class="tile"><span class="tile-value">{{ streak }}</span><span class="tile-label">ימים ברצף</span></div>
			<div class="tile"><span class="tile-value">{{ Object.keys(state.passages).length }}/{{ ALL_PASSAGES.length }}</span><span class="tile-label">קטעי קריאה שנקראו</span></div>
			<div class="tile"><span class="tile-value">{{ state.mistakes.length }}</span><span class="tile-label">שאלות שמחכות לחזרה ({{ state.mistakesFixed }} תוקנו)</span></div>
		</section>

		<section v-if="weak.length" class="card">
			<h2>כדאי לחזק</h2>
			<ul class="weak">
				<li v-for="row in weak" :key="row.type">{{ row.label }} – {{ percent(row.rate) }} הצלחה</li>
			</ul>
		</section>

		<section v-for="group in groups" :key="group.title" class="card">
			<h2>{{ group.title }}</h2>
			<div v-for="row in group.rows" :key="row.type" class="row">
				<span class="row-label">{{ row.label }}</span>
				<span class="meter" :aria-label="percent(row.rate)">
					<span v-if="row.rate !== undefined" class="meter-fill" :class="`fill--${row.status}`" :style="{ width: percent(row.rate) }" />
				</span>
				<span class="row-value" :class="`text--${row.status}`">
					<span aria-hidden="true">{{ STATUS_ICON[row.status] }}</span>
					{{ row.attempts ? percent(row.rate) : 'עוד לא תורגל' }}
				</span>
				<span class="row-meta">
					{{ row.attempts }} שאלות<template v-if="row.level"> · רמה {{ row.level }}</template>
				</span>
			</div>
			<p class="legend">✔ 80%+ · ▲ 60–79% · ✖ מתחת ל-60% · – פחות מ-{{ MIN_ATTEMPTS }} שאלות</p>
		</section>

		<section class="card">
			<h2>סבבים אחרונים</h2>
			<p v-if="!recent.length" class="empty">עוד אין סבבים.</p>
			<table v-else class="history">
				<thead><tr><th>מתי</th><th>מה</th><th>ציון</th><th>משך</th></tr></thead>
				<tbody>
					<tr v-for="s in recent" :key="s.at">
						<td><bdi>{{ formatDate(s.at) }}</bdi></td>
						<td>{{ describeSet(s.set) }}</td>
						<td><bdi>{{ s.correct }}/{{ s.total }}</bdi></td>
						<td><bdi>{{ formatDuration(s.seconds) }}</bdi></td>
					</tr>
				</tbody>
			</table>
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
			<p class="note">ההתקדמות נשמרת רק בדפדפן של המכשיר הזה. כדי להעביר אותה למכשיר אחר או לגבות אותה – ייצאו לקובץ.</p>
			<div class="actions">
				<button type="button" class="btn" @click="downloadExport">ייצוא לקובץ</button>
				<button type="button" class="btn" @click="fileInput?.click()">ייבוא מקובץ</button>
				<button type="button" class="btn btn--danger" @click="onReset">איפוס התקדמות</button>
				<input ref="fileInput" type="file" accept="application/json,.json" hidden @change="onImport">
			</div>
			<p v-if="message" class="message" role="status">{{ message }}</p>
		</section>
	</div>
</template>

<style scoped>
.parents {
	display: grid;
	gap: 20px;
	font-size: 18px;
	user-select: text;
}

.tiles {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
	gap: 12px;
}

.tile,
.card {
	padding: 16px;
	border-radius: var(--radius);
	background: var(--surface);
	box-shadow: var(--shadow);
}

.tile {
	display: grid;
	gap: 4px;
	text-align: center;
}

.tile-value {
	font-size: 36px;
	font-weight: 700;
}

.tile-label {
	color: var(--muted);
	font-size: 15px;
}

h2 {
	margin: 0 0 12px;
	font-size: 22px;
}

.weak {
	margin: 0;
	padding-inline-start: 20px;
}

.row {
	display: grid;
	grid-template-columns: minmax(150px, 1.2fr) 2fr 90px;
	grid-template-areas: 'label meter value' 'label meta meta';
	align-items: center;
	column-gap: 12px;
	padding: 8px 0;
	border-bottom: 1px solid #eeeaff;
}

.row-label { grid-area: label; font-weight: 700; }
.row-value { grid-area: value; font-weight: 700; white-space: nowrap; }
.row-meta { grid-area: meta; color: var(--muted); font-size: 14px; }

.meter {
	grid-area: meter;
	height: 10px;
	border-radius: 5px;
	background: #eeeaff;
	overflow: hidden;
}

.meter-fill {
	display: block;
	height: 100%;
	border-radius: 5px;
}

.fill--good { background: var(--good); }
.fill--warn { background: var(--warn); }
.fill--bad { background: var(--bad); }
.fill--none { background: #c9c3e6; }

/* Text stays in ink tones; the icon carries the state alongside the bar color. */
.text--none { color: var(--muted); font-weight: 400; }

.legend,
.note,
.empty {
	margin: 12px 0 0;
	color: var(--muted);
	font-size: 14px;
}

.history {
	width: 100%;
	border-collapse: collapse;
	font-size: 16px;
}

.history th,
.history td {
	padding: 6px 4px;
	border-bottom: 1px solid #eeeaff;
	text-align: start;
}

.history th {
	color: var(--muted);
	font-weight: 400;
}

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

.actions {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-top: 12px;
}

.btn {
	min-height: 48px;
	padding: 0 20px;
	border: 2px solid #e2ddff;
	border-radius: 14px;
	background: var(--surface);
}

.btn--danger {
	border-color: var(--bad);
	color: var(--bad);
}

.message {
	margin: 12px 0 0;
	font-weight: 700;
}
</style>
