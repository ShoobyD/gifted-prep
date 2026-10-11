<script setup lang="ts">
import { computed } from 'vue';
import { ALL_PASSAGES } from '@/data/content';
import { TYPE_LABELS } from '@/data/labels';
import { describeSet } from '@/data/questionSets';
import { MATH_TYPES, isMathType } from '@/generators';
import { attempts, dayStreak, successRate, type ProgressState } from '@/progress/state';
import type { QuestionType } from '@/types';
import { formatDateTime, formatDuration } from '@/utils/format';

// The child's progress at a glance. Read-only: the same view serves the tablet's parents
// area (local progress) and parent devices (the copy on the server).
const props = defineProps<{ progress: ProgressState }>();

const MIN_ATTEMPTS = 5;
const WEAK_BELOW = 0.7;

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
	const stats = props.progress.typeStats[type];
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
		level: isMathType(type) ? props.progress.levels[type] : undefined,
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

const streak = computed(() => dayStreak(props.progress.practiceDays, new Date()));

const weekMinutes = computed(() => {
	const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
	const seconds = props.progress.sessions
		.filter((s) => new Date(s.at).getTime() >= since)
		.reduce((sum, s) => sum + s.seconds, 0);
	return Math.round(seconds / 60);
});

const recent = computed(() => [...props.progress.sessions].reverse().slice(0, 15));

const STATUS_ICON: Record<Status, string> = { good: '✔', warn: '▲', bad: '✖', none: '–' };

const percent = (rate: number | undefined) => (rate === undefined ? '' : `${Math.round(rate * 100)}%`);
</script>

<template>
	<section class="tiles">
		<div class="tile"><span class="tile-value">{{ progress.sessions.length }}</span><span class="tile-label">סבבי תרגול</span></div>
		<div class="tile"><span class="tile-value">{{ weekMinutes }}</span><span class="tile-label">דקות ב-7 הימים האחרונים</span></div>
		<div class="tile"><span class="tile-value">{{ streak }}</span><span class="tile-label">ימים ברצף</span></div>
		<div class="tile"><span class="tile-value">{{ Object.keys(progress.passages).length }}/{{ ALL_PASSAGES.length }}</span><span class="tile-label">קטעי קריאה שנקראו</span></div>
		<div class="tile"><span class="tile-value">{{ progress.mistakes.length }}</span><span class="tile-label">שאלות שמחכות לחזרה ({{ progress.mistakesFixed }} תוקנו)</span></div>
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
		<p class="note">✔ 80%+ · ▲ 60–79% · ✖ מתחת ל-60% · – פחות מ-{{ MIN_ATTEMPTS }} שאלות</p>
	</section>

	<section class="card">
		<h2>סבבים אחרונים</h2>
		<p v-if="!recent.length" class="note">עוד אין סבבים.</p>
		<table v-else class="history">
			<thead><tr><th>מתי</th><th>מה</th><th>ציון</th><th>משך</th></tr></thead>
			<tbody>
				<tr v-for="s in recent" :key="s.at">
					<td><bdi>{{ formatDateTime(s.at) }}</bdi></td>
					<td>{{ describeSet(s.set) }}</td>
					<td><bdi>{{ s.correct }}/{{ s.total }}</bdi></td>
					<td><bdi>{{ formatDuration(s.seconds) }}</bdi></td>
				</tr>
			</tbody>
		</table>
	</section>
</template>

<style scoped>
.tiles {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
	gap: 12px;
}

.tile {
	display: grid;
	gap: 4px;
	padding: 16px;
	border-radius: var(--radius);
	background: var(--surface);
	box-shadow: var(--shadow);
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
</style>
