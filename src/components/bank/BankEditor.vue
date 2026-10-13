<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import PassageText from '@/components/PassageText.vue';
import { useBankEditor } from '@/composables/useBankEditor';
import { useContent } from '@/composables/useContent';
import type { HistoryEntry } from '@/content/bankApi';
import { lineCount, validatePassage, validateQuestion } from '@/content/validate';
import type { Passage, Question } from '@/types';
import { formatDateTime } from '@/utils/format';
import PassageForm from './PassageForm.vue';
import QuestionForm from './QuestionForm.vue';
import QuestionPreview from './QuestionPreview.vue';

// Edits one item on a working copy; nothing changes until "save". Saving is blocked while
// the shared validation (the same one the built-in content passes) reports a problem.
const props = defineProps<{
	passage?: Passage;
	question?: Question;
	// The version being edited: saving fails if someone saved the item since.
	version: number;
	// A new item, not saved yet.
	isNew?: boolean;
	// Part of a test: hidden rather than deleted, so the test keeps its structure.
	usedInTest?: boolean;
}>();
const emit = defineEmits<{ close: [] }>();

const editor = useBankEditor();
const content = useContent();
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const id = (props.passage ?? props.question)?.id ?? '';
const baseVersion = ref(props.isNew ? 0 : props.version);
const draftPassage = ref(props.passage && clone(props.passage));
const draftQuestion = ref(props.question && clone(props.question));
const original = JSON.stringify(props.passage ?? props.question);
// Remounts the form when the whole draft is replaced (a version from the history).
const formKey = ref(0);

const view = ref<'edit' | 'preview'>('edit');

const issues = computed(() => {
	if (draftPassage.value) return validatePassage(draftPassage.value);
	return draftQuestion.value ? validateQuestion(draftQuestion.value, 'math') : [];
});
const dirty = computed(() => JSON.stringify(draftPassage.value ?? draftQuestion.value) !== original);

async function save() {
	const saved = draftPassage.value
		? await editor.save('passage', clone(draftPassage.value), baseVersion.value)
		: await editor.save('question', clone(draftQuestion.value as Question), baseVersion.value);
	if (saved) {
		emit('close');
		return;
	}
	// Someone else saved meanwhile: the draft stays, and saving again replaces their version
	// (the error message says so).
	const latest = content.versionOf(id);
	if (latest) baseVersion.value = latest;
}

async function remove() {
	if (!confirm('למחוק את הפריט? הוא ייעלם מהתרגול בכל המכשירים, ואי אפשר לשחזר אותו מכאן.')) return;
	if (await editor.remove(id)) emit('close');
}

// --- History: every saved version; one can be loaded into the form and saved again ---

const history = shallowRef<HistoryEntry[]>([]);
const historyState = ref<'closed' | 'loading' | 'open' | 'failed'>('closed');
const restoredFrom = ref<number>();

async function showHistory() {
	historyState.value = 'loading';
	try {
		history.value = await editor.history(id);
		historyState.value = 'open';
	} catch {
		historyState.value = 'failed';
	}
}

function restore(entry: HistoryEntry) {
	if (dirty.value && !confirm('לטעון את הגרסה הזאת במקום השינויים שעשית?')) return;
	if (draftPassage.value) draftPassage.value = clone(entry.data as Passage);
	else draftQuestion.value = clone(entry.data as Question);
	formKey.value++;
	restoredFrom.value = entry.version;
	historyState.value = 'closed';
	view.value = 'preview';
}

function close() {
	if (dirty.value && !confirm('יש שינויים שלא נשמרו. לסגור בלי לשמור?')) return;
	emit('close');
}

function onKey(event: KeyboardEvent) {
	if (event.key === 'Escape') close();
}
onMounted(() => document.addEventListener('keydown', onKey));
onUnmounted(() => document.removeEventListener('keydown', onKey));
</script>

<template>
	<div class="overlay" role="dialog" aria-modal="true">
		<div class="sheet parents">
			<header class="sheet-head">
				<h2 v-if="isNew">{{ draftPassage ? 'קטע חדש' : 'שאלה חדשה' }}</h2>
				<h2 v-else>עריכה: {{ draftPassage ? draftPassage.title || 'קטע' : 'שאלה' }}</h2>
				<div class="segmented">
					<button type="button" :class="{ on: view === 'edit' }" @click="view = 'edit'">עריכה</button>
					<button type="button" :class="{ on: view === 'preview' }" @click="view = 'preview'">תצוגה מקדימה</button>
				</div>
			</header>

			<p v-if="restoredFrom" class="message" role="status">
				נטענה גרסה {{ restoredFrom }}. כדי שהיא תהיה הגרסה הנוכחית, לוחצים "שמירה".
			</p>

			<section v-if="historyState !== 'closed'" class="card history">
				<div class="history-head">
					<h3>גרסאות קודמות</h3>
					<button type="button" class="btn small" @click="historyState = 'closed'">סגירה</button>
				</div>
				<p v-if="historyState === 'loading'" class="note">טוען…</p>
				<p v-else-if="historyState === 'failed'" class="note tone--warn">אין חיבור לשרת, ואי אפשר להציג את הגרסאות.</p>
				<p v-else-if="!history.length" class="note">אין גרסאות שמורות.</p>
				<ul v-else class="versions">
					<li v-for="entry in history" :key="entry.version">
						<span>גרסה {{ entry.version }} · {{ formatDateTime(entry.savedAt) }}<template v-if="entry.version === baseVersion"> (הנוכחית)</template></span>
						<button v-if="entry.version !== baseVersion" type="button" class="btn small" @click="restore(entry)">טעינה</button>
					</li>
				</ul>
			</section>

			<section v-if="issues.length" class="card issues" role="alert">
				<p class="issues-title">צריך לתקן לפני שמירה:</p>
				<ul>
					<li v-for="(issue, i) in issues" :key="i">{{ issue.message }}</li>
				</ul>
			</section>

			<section v-if="view === 'edit'" class="card">
				<PassageForm v-if="draftPassage" :key="formKey" v-model="draftPassage" :issues="issues" />
				<QuestionForm v-else-if="draftQuestion" :key="formKey" v-model="draftQuestion" context="math" :issues="issues" />
			</section>

			<template v-else>
				<template v-if="draftPassage">
					<PassageText :passage="draftPassage" />
					<p class="note">{{ lineCount(draftPassage) }} שורות</p>
					<section v-for="(q, i) in draftPassage.questions" :key="q.id" class="card">
						<p class="q-number">שאלה {{ i + 1 }}</p>
						<QuestionPreview :question="{ ...q, source: q.source ?? draftPassage.source }" />
					</section>
				</template>
				<section v-else-if="draftQuestion" class="card">
					<QuestionPreview :question="draftQuestion" />
				</section>
			</template>

			<footer class="sheet-foot">
				<button type="button" class="btn btn--primary" :disabled="!dirty || issues.length > 0 || editor.saving.value" @click="save">
					{{ editor.saving.value ? 'שומר…' : 'שמירה' }}
				</button>
				<button type="button" class="btn" @click="close">סגירה</button>
				<template v-if="!isNew">
					<button type="button" class="btn btn--side" :disabled="historyState === 'loading'" @click="showHistory">גרסאות קודמות</button>
					<button v-if="!usedInTest" type="button" class="btn" :disabled="editor.saving.value" @click="remove">מחיקה</button>
				</template>
			</footer>
			<p v-if="usedInTest && !isNew" class="note">הפריט הוא חלק ממבחן, ולכן אפשר להסתיר אותו אבל לא למחוק.</p>
			<p v-if="editor.error.value" class="message tone--warn" role="alert">{{ editor.error.value }}</p>
		</div>
	</div>
</template>

<style scoped>
.overlay {
	position: fixed;
	inset: 0;
	z-index: 30;
	overflow-y: auto;
	padding: 16px;
	background: rgba(42, 37, 80, .45);
}

.sheet {
	max-width: 760px;
	margin: 0 auto;
	padding: 16px;
	border-radius: var(--radius);
	background: var(--bg);
}

.sheet-head {
	position: sticky;
	top: -16px;
	z-index: 1;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	margin: -16px -16px 0;
	padding: 12px 16px;
	border-radius: var(--radius) var(--radius) 0 0;
	background: var(--bg);
}

.sheet-head h2 {
	margin: 0;
	font-size: 20px;
}

.segmented {
	display: grid;
	grid-template-columns: 1fr 1fr;
	padding: 4px;
	border-radius: 12px;
	background: #eeeaff;
}

.segmented button {
	min-height: 40px;
	padding: 0 12px;
	border: 0;
	border-radius: 9px;
	background: transparent;
}

.segmented .on {
	background: var(--surface);
	font-weight: 700;
	box-shadow: var(--shadow);
}

.issues {
	border: 2px solid var(--bad);
}

.issues-title {
	margin: 0 0 6px;
	font-weight: 700;
	color: var(--bad);
}

.issues ul {
	margin: 0;
	padding-inline-start: 20px;
	font-size: 15px;
}

.history-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
}

.history h3 {
	margin: 0;
	font-size: 17px;
}

.versions {
	display: grid;
	gap: 6px;
	margin: 10px 0 0;
	padding: 0;
	list-style: none;
}

.versions li {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	min-height: 40px;
}

.btn.small {
	min-height: 36px;
	padding: 0 12px;
}

.q-number {
	margin: 0 0 8px;
	font-weight: 700;
}

.sheet-foot {
	position: sticky;
	bottom: -16px;
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	margin: 0 -16px -16px;
	padding: 12px 16px;
	border-radius: 0 0 var(--radius) var(--radius);
	background: var(--bg);
	box-shadow: 0 -2px 8px rgba(42, 37, 80, .08);
}

.btn--primary {
	background: var(--primary);
	border-color: var(--primary);
	color: #fff;
	font-weight: 700;
}

.btn--side {
	margin-inline-start: auto;
}
</style>
