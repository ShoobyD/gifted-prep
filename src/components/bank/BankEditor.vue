<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import PassageText from '@/components/PassageText.vue';
import { useContentEditor } from '@/composables/useContentEditor';
import { lineCount, validatePassage, validateQuestion } from '@/content/validate';
import { revertItem, savePassage, saveQuestion } from '@/content/overrides';
import type { Passage, Question } from '@/types';
import PassageForm from './PassageForm.vue';
import QuestionForm from './QuestionForm.vue';
import QuestionPreview from './QuestionPreview.vue';

// Edits one item on a working copy; nothing changes until "save". Saving is blocked while
// the shared validation (the same one the built-in content passes) reports a problem.
const props = defineProps<{
	passage?: Passage;
	question?: Question;
	// A built-in item the parent already changed: it can go back to the original.
	edited?: boolean;
}>();
const emit = defineEmits<{ close: [] }>();

const editor = useContentEditor();
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const draftPassage = props.passage ? reactive(clone(props.passage)) : undefined;
const draftQuestion = props.question ? reactive(clone(props.question)) : undefined;
const original = JSON.stringify(props.passage ?? props.question);

const view = ref<'edit' | 'preview'>('edit');

const issues = computed(() => {
	if (draftPassage) return validatePassage(draftPassage);
	return draftQuestion ? validateQuestion(draftQuestion, 'math') : [];
});
const dirty = computed(() => JSON.stringify(draftPassage ?? draftQuestion) !== original);

async function save() {
	const change = draftPassage ? savePassage(clone(draftPassage)) : saveQuestion(clone(draftQuestion as Question));
	if (await editor.update(change)) emit('close');
}

async function revert() {
	if (!confirm('לבטל את כל השינויים שנעשו בפריט הזה ולחזור לגרסה המקורית?')) return;
	const id = (props.passage ?? props.question)?.id;
	if (id && (await editor.update(revertItem(id)))) emit('close');
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
				<h2>עריכה: {{ draftPassage ? draftPassage.title || 'קטע' : 'שאלה' }}</h2>
				<div class="segmented">
					<button type="button" :class="{ on: view === 'edit' }" @click="view = 'edit'">עריכה</button>
					<button type="button" :class="{ on: view === 'preview' }" @click="view = 'preview'">תצוגה מקדימה</button>
				</div>
			</header>

			<section v-if="issues.length" class="card issues" role="alert">
				<p class="issues-title">צריך לתקן לפני שמירה:</p>
				<ul>
					<li v-for="(issue, i) in issues" :key="i">{{ issue.message }}</li>
				</ul>
			</section>

			<section v-if="view === 'edit'" class="card">
				<PassageForm v-if="draftPassage" v-model="draftPassage" :issues="issues" />
				<QuestionForm v-else-if="draftQuestion" v-model="draftQuestion" context="math" :issues="issues" />
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
				<button v-if="edited" type="button" class="btn btn--danger" :disabled="editor.saving.value" @click="revert">חזרה למקור</button>
			</footer>
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

.btn--danger {
	margin-inline-start: auto;
}
</style>
