<script setup lang="ts">
import { ref, watch } from 'vue';
import { paragraphsToText, textToParagraphs } from '@/content/bank';
import { lineCount, type Issue } from '@/content/validate';
import { SOURCE_LABELS } from '@/data/content';
import type { Passage } from '@/types';
import QuestionForm from './QuestionForm.vue';

// Edits a passage and its questions in place.
const passage = defineModel<Passage>({ required: true });
const props = defineProps<{ issues: Issue[] }>();

// The text is edited as typed and converted on the way out, so blank rows can be typed
// freely (converting back on every keystroke would swallow a new paragraph break).
const text = ref(paragraphsToText(passage.value.paragraphs));
watch(text, (value) => {
	passage.value.paragraphs = textToParagraphs(value);
});

const hasIssue = (field: string) => props.issues.some((i) => i.field === field);

// A question's own problems, with its field names made local again.
function questionIssues(index: number): Issue[] {
	const prefix = `questions.${index}.`;
	return props.issues
		.filter((i) => i.field.startsWith(prefix))
		.map((i) => ({ ...i, field: i.field.slice(prefix.length) }));
}

function setSourceNote(value: string) {
	passage.value.sourceNote = value.trim() ? value : undefined;
}
</script>

<template>
	<div class="form">
		<div class="field-row">
			<label class="field">
				<span>כותרת</span>
				<input v-model="passage.title" :class="{ bad: hasIssue('title') }">
			</label>
			<label class="field">
				<span>סוג</span>
				<select v-model="passage.kind">
					<option value="story">סיפור</option>
					<option value="informational">קטע מידע</option>
				</select>
			</label>
		</div>

		<div class="field-row">
			<label class="field">
				<span>מקור</span>
				<select v-model="passage.source">
					<option v-for="(label, key) in SOURCE_LABELS" :key="key" :value="key">{{ label }}</option>
				</select>
			</label>
			<label class="field">
				<span>פרטי המקור (לא חובה)</span>
				<input :value="passage.sourceNote ?? ''" placeholder="למשל: חוברת X, עמוד 5" @input="setSourceNote(($event.target as HTMLInputElement).value)">
			</label>
		</div>

		<label class="field">
			<span>הטקסט: שורה לכל שורה בחוברת, ושורה ריקה בין פסקאות ({{ lineCount(passage) }} שורות)</span>
			<textarea v-model="text" rows="12" :class="{ bad: hasIssue('paragraphs') }" />
		</label>
		<p class="hint">השאלות מפנות למספרי שורות, ולכן כדאי לשמור על חלוקת השורות כמו במקור.</p>

		<h3 class="questions-title">השאלות</h3>
		<details v-for="(_, i) in passage.questions" :key="passage.questions[i]?.id" class="question" :class="{ bad: questionIssues(i).length }">
			<summary>שאלה {{ i + 1 }}<template v-if="questionIssues(i).length"> · ⚠ {{ questionIssues(i).length }}</template></summary>
			<QuestionForm v-model="passage.questions[i]!" context="reading" :issues="questionIssues(i)" />
		</details>
	</div>
</template>

<style scoped>
.form {
	display: grid;
	gap: 12px;
}

.field {
	display: grid;
	gap: 4px;
	min-width: 0;
	font-size: 15px;
}

.field > span {
	color: var(--muted);
}

.field-row {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
	gap: 10px;
}

input,
textarea,
select {
	width: 100%;
	min-height: 44px;
	padding: 8px 10px;
	border: 2px solid #e2ddff;
	border-radius: 12px;
	background: var(--surface);
	font: inherit;
	font-size: 17px;
	user-select: text;
}

textarea {
	resize: vertical;
	line-height: 1.7;
}

.bad {
	border-color: var(--bad);
}

.hint {
	margin: 0;
	color: var(--muted);
	font-size: 13px;
}

.questions-title {
	margin: 8px 0 0;
}

.question {
	padding: 10px 12px;
	border: 2px solid #e2ddff;
	border-radius: 14px;
	background: var(--surface);
}

.question summary {
	font-weight: 700;
	cursor: pointer;
}

.question[open] summary {
	margin-bottom: 10px;
}
</style>
