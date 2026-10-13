<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import RichText from '@/components/RichText.vue';
import { useContent } from '@/composables/useContent';
import { useContentEditor } from '@/composables/useContentEditor';
import { isHidden, itemOrigin, matches, passageText, questionText, type ItemOrigin } from '@/content/bank';
import { setHidden } from '@/content/overrides';
import { MATH_TYPES, READING_TYPES } from '@/content/validate';
import { SOURCE_LABELS } from '@/data/content';
import { TYPE_LABELS } from '@/data/labels';
import type { ContentSource, Passage, Question, QuestionType } from '@/types';
import { newMathQuestion, newPassage } from '@/content/templates';
import BankEditor from './BankEditor.vue';
import BankPreview from './BankPreview.vue';

// The question bank on a parent device: everything (hidden included), with the parent's
// changes marked. Generated math questions aren't stored anywhere, so they aren't listed.
const content = useContent();
const editor = useContentEditor();

type Status = 'all' | 'visible' | 'hidden' | 'edited' | 'added';

const area = ref<'reading' | 'math'>('reading');
const query = ref('');
const source = ref<ContentSource | ''>('');
const type = ref<QuestionType | ''>('');
const status = ref<Status>('all');

const STATUS_LABELS: Record<Status, string> = {
	all: 'הכול',
	visible: 'מוצגים',
	hidden: 'מוסתרים',
	edited: 'נערכו',
	added: 'נוספו',
};
const ORIGIN_LABELS: Record<Exclude<ItemOrigin, 'built-in'>, string> = { edited: 'נערך', added: 'נוסף' };

const types = computed(() => (area.value === 'reading' ? READING_TYPES : MATH_TYPES));

function switchArea(next: 'reading' | 'math') {
	area.value = next;
	type.value = '';
}

const hidden = (id: string) => isHidden(content.overrides.value, id);

function statusMatches(origin: ItemOrigin, isHiddenItem: boolean): boolean {
	switch (status.value) {
		case 'visible': return !isHiddenItem;
		case 'hidden': return isHiddenItem;
		case 'edited': return origin === 'edited';
		case 'added': return origin === 'added';
		default: return true;
	}
}

interface PassageRow {
	passage: Passage;
	origin: ItemOrigin;
	hidden: boolean;
	hiddenQuestions: number;
}

const passageRows = computed<PassageRow[]>(() =>
	content.everyPassage.value
		.map((passage) => ({
			passage,
			origin: itemOrigin(passage.id, content.basePassageIds.value, content.overrides.value.passages),
			hidden: hidden(passage.id),
			hiddenQuestions: passage.questions.filter((q) => hidden(q.id)).length,
		}))
		.filter((row) =>
			(!source.value || row.passage.source === source.value)
			&& (!type.value || row.passage.questions.some((q) => q.type === type.value))
			&& statusMatches(row.origin, row.hidden || row.hiddenQuestions > 0)
			&& matches(passageText(row.passage), query.value)),
);

interface QuestionRow {
	question: Question;
	origin: ItemOrigin;
	hidden: boolean;
}

const questionRows = computed<QuestionRow[]>(() =>
	content.everyMathQuestion.value
		.map((question) => ({
			question,
			origin: itemOrigin(question.id, content.baseQuestionIds.value, content.overrides.value.questions),
			hidden: hidden(question.id),
		}))
		.filter((row) =>
			(!source.value || row.question.source === source.value)
			&& (!type.value || row.question.type === type.value)
			&& statusMatches(row.origin, row.hidden)
			&& matches(questionText(row.question), query.value)),
);

const shown = computed(() => (area.value === 'reading' ? passageRows.value.length : questionRows.value.length));
const total = computed(() =>
	area.value === 'reading' ? content.everyPassage.value.length : content.everyMathQuestion.value.length,
);

const toggle = (id: string) => editor.update(setHidden(id, !hidden(id)));

// The preview always shows the current version (it updates after hiding inside it).
const previewId = shallowRef<{ kind: 'passage' | 'question'; id: string }>();
const previewPassage = computed(() =>
	previewId.value?.kind === 'passage' ? content.everyPassage.value.find((p) => p.id === previewId.value?.id) : undefined,
);
const previewQuestion = computed(() =>
	previewId.value?.kind === 'question' ? content.everyMathQuestion.value.find((q) => q.id === previewId.value?.id) : undefined,
);

// The item being edited, looked up fresh so it reflects the latest saved version; a new
// item brings its own empty draft.
const editTarget = shallowRef<{ kind: 'passage' | 'question'; id: string; draft?: Passage | Question }>();
const editing = computed(() => {
	const target = editTarget.value;
	if (!target) return undefined;
	if (target.draft) {
		return target.kind === 'passage'
			? { passage: target.draft as Passage, question: undefined, origin: 'new' as const }
			: { passage: undefined, question: target.draft as Question, origin: 'new' as const };
	}
	if (target.kind === 'passage') {
		const passage = content.everyPassage.value.find((p) => p.id === target.id);
		const origin = itemOrigin(target.id, content.basePassageIds.value, content.overrides.value.passages);
		return passage && { passage, question: undefined, origin };
	}
	const question = content.everyMathQuestion.value.find((q) => q.id === target.id);
	const origin = itemOrigin(target.id, content.baseQuestionIds.value, content.overrides.value.questions);
	return question && { passage: undefined, question, origin };
});

function addNew() {
	const draft = area.value === 'reading' ? newPassage() : newMathQuestion();
	editTarget.value = { kind: area.value === 'reading' ? 'passage' : 'question', id: draft.id, draft };
}

// Math questions show their expression when there's no text, e.g. "38 + 27 = ☐".
const snippet = (q: Question) => q.body ?? (q.math ? `$${q.math}$` : q.id);
</script>

<template>
	<section class="card filters">
		<div class="segmented" role="tablist">
			<button type="button" role="tab" :aria-selected="area === 'reading'" :class="{ on: area === 'reading' }" @click="switchArea('reading')">📖 קטעי קריאה</button>
			<button type="button" role="tab" :aria-selected="area === 'math'" :class="{ on: area === 'math' }" @click="switchArea('math')">🔢 שאלות חשבון</button>
		</div>
		<input v-model="query" class="search" type="search" placeholder="חיפוש (בלי צורך בניקוד)" aria-label="חיפוש">
		<div class="selects">
			<select v-model="source" aria-label="מקור">
				<option value="">כל המקורות</option>
				<option v-for="(label, key) in SOURCE_LABELS" :key="key" :value="key">{{ label }}</option>
			</select>
			<select v-model="type" aria-label="סוג שאלה">
				<option value="">כל סוגי השאלות</option>
				<option v-for="t in types" :key="t" :value="t">{{ TYPE_LABELS[t] }}</option>
			</select>
			<select v-model="status" aria-label="מצב">
				<option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
			</select>
		</div>
		<button type="button" class="btn add" @click="addNew">{{ area === 'reading' ? '+ קטע חדש' : '+ שאלת חשבון חדשה' }}</button>
		<p class="note">מוצגים {{ shown }} מתוך {{ total }}. שאלות חשבון שנוצרות אוטומטית לא נשמרות במאגר.</p>
	</section>

	<p v-if="editor.error.value" class="message tone--warn" role="alert">{{ editor.error.value }}</p>

	<template v-if="area === 'reading'">
		<article v-for="row in passageRows" :key="row.passage.id" class="card row" :class="{ hidden: row.hidden }">
			<div class="row-main">
				<p class="row-title">{{ row.passage.kind === 'story' ? '📗' : '📘' }} {{ row.passage.title }}</p>
				<p class="row-meta">
					{{ SOURCE_LABELS[row.passage.source] }}<template v-if="row.passage.sourceNote"> · {{ row.passage.sourceNote }}</template>
					· {{ row.passage.questions.length }} שאלות<template v-if="row.hiddenQuestions"> ({{ row.hiddenQuestions }} מוסתרות)</template>
				</p>
				<p class="badges">
					<span v-if="row.hidden" class="badge">מוסתר</span>
					<span v-if="row.origin !== 'built-in'" class="badge badge--changed">{{ ORIGIN_LABELS[row.origin] }}</span>
				</p>
			</div>
			<div class="row-actions">
				<button type="button" class="btn" @click="previewId = { kind: 'passage', id: row.passage.id }">תצוגה</button>
				<button type="button" class="btn" @click="editTarget = { kind: 'passage', id: row.passage.id }">עריכה</button>
				<button type="button" class="btn" :disabled="editor.saving.value" @click="toggle(row.passage.id)">{{ row.hidden ? 'הצגה' : 'הסתרה' }}</button>
			</div>
		</article>
	</template>

	<template v-else>
		<article v-for="row in questionRows" :key="row.question.id" class="card row" :class="{ hidden: row.hidden }">
			<div class="row-main">
				<p class="row-title"><RichText :text="snippet(row.question)" /></p>
				<p class="row-meta">
					{{ TYPE_LABELS[row.question.type] }}
					<template v-if="row.question.source"> · {{ SOURCE_LABELS[row.question.source] }}</template>
					<template v-if="row.question.sourceNote"> · {{ row.question.sourceNote }}</template>
				</p>
				<p class="badges">
					<span v-if="row.hidden" class="badge">מוסתרת</span>
					<span v-if="row.origin !== 'built-in'" class="badge badge--changed">{{ ORIGIN_LABELS[row.origin] }}</span>
				</p>
			</div>
			<div class="row-actions">
				<button type="button" class="btn" @click="previewId = { kind: 'question', id: row.question.id }">תצוגה</button>
				<button type="button" class="btn" @click="editTarget = { kind: 'question', id: row.question.id }">עריכה</button>
				<button type="button" class="btn" :disabled="editor.saving.value" @click="toggle(row.question.id)">{{ row.hidden ? 'הצגה' : 'הסתרה' }}</button>
			</div>
		</article>
	</template>

	<p v-if="!shown" class="note">אין תוצאות.</p>

	<!-- Keyed: each item gets a fresh working copy. -->
	<BankEditor
		v-if="editing && editTarget"
		:key="editTarget.id"
		:passage="editing.passage"
		:question="editing.question"
		:edited="editing.origin === 'edited'"
		:added="editing.origin === 'added'"
		:is-new="editing.origin === 'new'"
		@close="editTarget = undefined"
	/>

	<BankPreview
		v-if="previewPassage || previewQuestion"
		:passage="previewPassage"
		:question="previewQuestion"
		@close="previewId = undefined"
	/>
</template>

<style scoped>
.filters {
	display: grid;
	gap: 12px;
}

.segmented {
	display: grid;
	grid-template-columns: 1fr 1fr;
	padding: 4px;
	border-radius: 14px;
	background: #eeeaff;
}

.segmented button {
	min-height: 44px;
	border: 0;
	border-radius: 10px;
	background: transparent;
	font-weight: 700;
}

.segmented button.on {
	background: var(--surface);
	box-shadow: var(--shadow);
}

.add {
	justify-self: start;
	border-color: var(--primary);
	color: var(--primary);
	font-weight: 700;
}

.search,
select {
	width: 100%;
	min-height: 44px;
	padding: 0 12px;
	border: 2px solid #e2ddff;
	border-radius: 12px;
	background: var(--surface);
	font: inherit;
	font-size: 16px;
}

.selects {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 8px;
}

.row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
}

.row.hidden {
	opacity: .55;
}

.row-main {
	flex: 1 1 240px;
	min-width: 0;
}

.row-title {
	margin: 0;
	font-weight: 700;
	overflow-wrap: anywhere;
}

.row-meta {
	margin: 4px 0 0;
	color: var(--muted);
	font-size: 14px;
}

.badges {
	display: flex;
	gap: 6px;
	margin: 6px 0 0;
}

.badges:empty {
	display: none;
}

.badge {
	padding: 2px 10px;
	border-radius: 999px;
	background: #eeeaff;
	font-size: 13px;
}

.badge--changed {
	background: #fff1d6;
}

.row-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}
</style>
