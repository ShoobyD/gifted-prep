<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { isMachineCheckable, MATH_TYPES, READING_TYPES, type Issue } from '@/content/validate';
import { SOURCE_LABELS } from '@/data/sources';
import { TYPE_LABELS } from '@/data/labels';
import { CHOICE_LABELS } from '@/engine/answerText';
import { PICTURES } from '@/generators/pictureRiddles';
import { SYMBOLS } from '@/generators/symbolDigits';
import { BLANK, type NumberRule, type Question } from '@/types';

// Edits one question in place. In a passage, the question inherits the passage's source.
const question = defineModel<Question>({ required: true });
const props = defineProps<{
	context: 'reading' | 'math';
	// Problems with this question; field names are local ("options", "math", …).
	issues: Issue[];
}>();

const MAX_OPTIONS = CHOICE_LABELS.length;
const types = computed(() => (props.context === 'reading' ? READING_TYPES : MATH_TYPES));
const hasIssue = (field: string) => props.issues.some((i) => i.field === field || i.field.startsWith(`${field}.`));

// Given facts, one per row.
const linesText = computed({
	get: () => (question.value.lines ?? []).join('\n'),
	set: (text: string) => {
		const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
		question.value.lines = lines.length ? lines : undefined;
	},
});

// Optional text fields are dropped rather than saved empty.
function setOptional(field: 'prompt' | 'body' | 'math' | 'sourceNote', value: string) {
	question.value[field] = value.trim() ? value : undefined;
}

// --- Symbols that are hard to type, inserted where the cursor was ----------------------

const KEYS = [BLANK, '+', '−', '×', '÷', '=', '>', '<', ...PICTURES, ...SYMBOLS];
const mathInput = ref<HTMLInputElement>();
const linesInput = ref<HTMLTextAreaElement>();
const lastField = ref<'math' | 'lines'>('math');

async function insert(symbol: string) {
	const field = lastField.value === 'lines' ? linesInput.value : mathInput.value;
	if (!field) return;
	const start = field.selectionStart ?? field.value.length;
	const end = field.selectionEnd ?? start;
	const next = field.value.slice(0, start) + symbol + field.value.slice(end);
	if (lastField.value === 'lines') linesText.value = next;
	else setOptional('math', next);
	await nextTick();
	field.focus();
	field.setSelectionRange(start + symbol.length, start + symbol.length);
}

// --- Answer ------------------------------------------------------------------------------

function setAnswerKind(kind: 'choice' | 'number') {
	if (question.value.answer.kind === kind) return;
	question.value.answer = kind === 'choice'
		? { kind: 'choice', options: ['', ''], correctIndex: 0 }
		: { kind: 'number', rule: { op: 'eq', value: 0 }, solution: 0 };
}

function addOption() {
	if (question.value.answer.kind === 'choice' && question.value.answer.options.length < MAX_OPTIONS) {
		question.value.answer.options.push('');
	}
}

function removeOption(index: number) {
	const { answer } = question.value;
	if (answer.kind !== 'choice' || answer.options.length <= 2) return;
	answer.options.splice(index, 1);
	if (answer.correctIndex === index) answer.correctIndex = 0;
	else if (answer.correctIndex > index) answer.correctIndex--;
}

// An exact answer is its own example; for "greater/less than", the example is separate.
function setRule(op: NumberRule['op'], value: number) {
	const { answer } = question.value;
	if (answer.kind !== 'number') return;
	answer.rule = { op, value };
	if (op === 'eq') answer.solution = value;
	else if (op === 'gt' && answer.solution <= value) answer.solution = value + 1;
	else if (op === 'lt' && answer.solution >= value) answer.solution = Math.max(0, value - 1);
}

const checkable = computed(() => isMachineCheckable(question.value));
</script>

<template>
	<div class="form">
		<label class="field">
			<span>סוג השאלה</span>
			<select v-model="question.type" :class="{ bad: hasIssue('type') }">
				<option v-for="t in types" :key="t" :value="t">{{ TYPE_LABELS[t] }}</option>
			</select>
		</label>

		<div v-if="context === 'math'" class="field-row">
			<label class="field">
				<span>מקור</span>
				<select v-model="question.source">
					<option v-for="(label, key) in SOURCE_LABELS" :key="key" :value="key">{{ label }}</option>
				</select>
			</label>
			<label class="field">
				<span>פרטי המקור (לא חובה)</span>
				<input :value="question.sourceNote ?? ''" placeholder="למשל: חוברת X, עמוד 5" @input="setOptional('sourceNote', ($event.target as HTMLInputElement).value)">
			</label>
		</div>

		<label class="field">
			<span>הוראה (לא חובה)</span>
			<input :value="question.prompt ?? ''" :class="{ bad: hasIssue('prompt') }" placeholder="למשל: הַשְׁלִימוּ אֶת הַמִּסְפָּר הֶחָסֵר:" @input="setOptional('prompt', ($event.target as HTMLInputElement).value)">
		</label>

		<label class="field">
			<span>נוסח השאלה</span>
			<textarea :value="question.body ?? ''" rows="3" :class="{ bad: hasIssue('body') }" @input="setOptional('body', ($event.target as HTMLTextAreaElement).value)" />
		</label>

		<template v-if="context === 'math'">
			<label class="field">
				<span>נתונים (שורה לכל תרגיל, לא חובה)</span>
				<textarea ref="linesInput" v-model="linesText" rows="2" dir="ltr" :class="{ bad: hasIssue('lines') }" placeholder="🍎 + 🍎 = 12" @focus="lastField = 'lines'" />
			</label>
			<label class="field">
				<span>תרגיל (☐ = התיבה שממלאים)</span>
				<input ref="mathInput" :value="question.math ?? ''" dir="ltr" :class="{ bad: hasIssue('math') }" placeholder="38 + 27 = ☐" @focus="lastField = 'math'" @input="setOptional('math', ($event.target as HTMLInputElement).value)">
			</label>
			<div class="keys" aria-label="הוספת סימן">
				<button v-for="key in KEYS" :key="key" type="button" class="key" @mousedown.prevent @click="insert(key)">{{ key }}</button>
			</div>
			<p class="hint">רווח אחד בין כל מספר לסימן, למשל <bdi dir="ltr">38 + 27 = ☐</bdi>. ציורים וסמלים מחליפים מספרים.</p>
		</template>

		<fieldset class="field answer" :class="{ bad: hasIssue('answer') || hasIssue('options') }">
			<legend>תשובה</legend>
			<div class="segmented">
				<button type="button" :class="{ on: question.answer.kind === 'choice' }" @click="setAnswerKind('choice')">בחירה מרשימה</button>
				<button type="button" :class="{ on: question.answer.kind === 'number' }" @click="setAnswerKind('number')">מספר שמקלידים</button>
			</div>

			<template v-if="question.answer.kind === 'choice'">
				<div v-for="(_, i) in question.answer.options" :key="i" class="option">
					<label class="correct" :title="'התשובה הנכונה'">
						<input v-model="question.answer.correctIndex" type="radio" :value="i" :name="`correct-${question.id}`">
						<span>{{ CHOICE_LABELS[i] }}</span>
					</label>
					<input v-model="question.answer.options[i]" class="option-text" :aria-label="`תשובה ${CHOICE_LABELS[i]}`">
					<button type="button" class="key" :disabled="question.answer.options.length <= 2" aria-label="מחיקת תשובה" @click="removeOption(i)">✕</button>
				</div>
				<button v-if="question.answer.options.length < MAX_OPTIONS" type="button" class="btn small" @click="addOption">+ עוד תשובה</button>
				<p class="hint">מסמנים בעיגול את התשובה הנכונה.</p>
			</template>

			<template v-else>
				<div class="field-row">
					<label class="field">
						<span>התשובה הנכונה</span>
						<select :value="question.answer.rule.op" @change="setRule(($event.target as HTMLSelectElement).value as NumberRule['op'], question.answer.kind === 'number' ? question.answer.rule.value : 0)">
							<option value="eq">שווה בדיוק ל־</option>
							<option value="gt">כל מספר גדול מ־</option>
							<option value="lt">כל מספר קטן מ־</option>
						</select>
					</label>
					<label class="field">
						<span>מספר</span>
						<input type="number" min="0" :value="question.answer.rule.value" @input="setRule(question.answer.kind === 'number' ? question.answer.rule.op : 'eq', Number(($event.target as HTMLInputElement).value))">
					</label>
					<label v-if="question.answer.rule.op !== 'eq'" class="field">
						<span>תשובה לדוגמה (מוצגת אחרי טעות)</span>
						<input v-model.number="question.answer.solution" type="number" min="0">
					</label>
				</div>
				<p class="hint">{{ checkable ? '✓ התשובה תיבדק אוטומטית מול התרגיל.' : 'התשובה לא נבדקת אוטומטית (התרגיל אינו משוואה). כדאי לבדוק אותה בתצוגה המקדימה.' }}</p>
			</template>
		</fieldset>

		<label class="field">
			<span>הסבר לתשובה</span>
			<textarea v-model="question.explanation" rows="3" :class="{ bad: hasIssue('explanation') }" />
		</label>
		<p class="hint">חשבון בתוך טקסט עוטפים בסימני $, למשל: נשאר <bdi dir="ltr">$20 − 12 = 8$</bdi>. כך הוא מוצג משמאל לימין.</p>
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
	margin: 0;
	font-size: 15px;
}

.field > span,
legend {
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
	line-height: 1.6;
}

.bad,
.answer.bad {
	border-color: var(--bad);
}

.answer {
	display: grid;
	gap: 10px;
	padding: 10px 12px;
	border: 2px solid #e2ddff;
	border-radius: 14px;
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
	border: 0;
	border-radius: 9px;
	background: transparent;
}

.segmented .on {
	background: var(--surface);
	font-weight: 700;
	box-shadow: var(--shadow);
}

.option {
	display: flex;
	align-items: center;
	gap: 8px;
}

.correct {
	display: flex;
	align-items: center;
	gap: 4px;
	font-weight: 700;
}

.correct input {
	width: 22px;
	min-height: 22px;
}

.option-text {
	flex: 1;
}

.keys {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.key {
	min-width: 40px;
	min-height: 40px;
	border: 2px solid #e2ddff;
	border-radius: 10px;
	background: var(--surface);
	font-size: 18px;
}

.key:disabled {
	opacity: .35;
}

.hint {
	margin: 0;
	color: var(--muted);
	font-size: 13px;
}

.btn.small {
	justify-self: start;
	min-height: 40px;
}
</style>
