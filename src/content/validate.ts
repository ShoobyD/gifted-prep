// Checks a question or passage before it can be used: by the content tests for the built-in
// material, and by the question editor before saving. Messages are for the parent (Hebrew).
import { checkNumber } from '@/engine/checkAnswer';
import { fill, holds, isWellFormed, solutions, variablesOf } from '@/engine/expressions';
import { BLANK, type MathQuestionType, type Passage, type Question, type ReadingQuestionType } from '@/types';

export interface Issue {
	// Which part of the form is wrong, e.g. "options" or "questions.2.body".
	field: string;
	message: string;
}

export const READING_TYPES: ReadingQuestionType[] = [
	'reading-fact', 'word-meaning', 'author-purpose', 'inference', 'not-answered', 'pronoun', 'word-relation',
];

export const MATH_TYPES: MathQuestionType[] = [
	'exercise', 'missing-number', 'inequality', 'word-problem', 'picture-riddle', 'symbol-digit',
];

// The answer search tries every value for each picture or symbol; beyond this it gets slow.
const MAX_UNKNOWNS = 3;

const NIKUD = /[֑-ׇ]/g;

export function lineCount(passage: Passage): number {
	return passage.paragraphs.reduce((n, lines) => n + lines.length, 0);
}

const balancedMath = (text: string) => text.split('$').length % 2 === 1;

function checkText(issues: Issue[], field: string, label: string, text: string | undefined) {
	if (text && !balancedMath(text)) issues.push({ field, message: `ב${label} יש סימן $ בלי סימן סוגר` });
}

// Line numbers a reading question cites ("בשורה 3", "בשורות 4–5").
function citedLines(text: string): number[] {
	const plain = text.replace(NIKUD, '');
	return [...plain.matchAll(/שור(?:ה|ות)\s*(\d+)(?:\s*[-–]\s*(\d+))?/g)].map((m) => Number(m[2] ?? m[1]));
}

// Whether the stored number answer can be verified by computing: the expression is an
// equation with the answer box, and every given fact is an equation too. Other layouts
// (number sequences, a missing operation sign, exercises shown as data) are allowed, but
// their answer can't be checked automatically; the editor says so.
export function isMachineCheckable(question: Question): boolean {
	const { math, lines = [], answer } = question;
	return answer.kind === 'number' && !!math?.includes(BLANK) && isWellFormed(math, true)
		&& lines.every((line) => isWellFormed(line));
}

function checkMath(issues: Issue[], question: Question) {
	if (!isMachineCheckable(question) || question.answer.kind !== 'number') return;
	const { math = '', lines = [], answer } = question;

	if (new Set([...lines, math].flatMap(variablesOf)).size > MAX_UNKNOWNS) {
		issues.push({ field: 'lines', message: `אפשר לבדוק עד ${MAX_UNKNOWNS} ציורים או סמלים שונים` });
		return;
	}
	const found = solutions(lines);
	if (!found.length) {
		issues.push({ field: 'lines', message: 'אין ערכים שמתאימים לכל הנתונים' });
		return;
	}
	// The facts may leave some pictures open, as long as the asked expression always agrees.
	if (!found.every((values) => holds(fill(math, answer.solution), values))) {
		issues.push({ field: 'answer', message: `התשובה ${answer.solution} לא נכונה לתרגיל` });
	}
}

export function validateQuestion(question: Question, context: 'reading' | 'math', passageLines?: number): Issue[] {
	const issues: Issue[] = [];
	const types: string[] = context === 'reading' ? READING_TYPES : MATH_TYPES;
	if (!types.includes(question.type)) issues.push({ field: 'type', message: 'סוג השאלה לא מתאים' });

	if (!question.body?.trim() && !question.math?.trim()) {
		issues.push({ field: 'body', message: 'צריך נוסח לשאלה או תרגיל' });
	}
	if (!question.explanation?.trim()) issues.push({ field: 'explanation', message: 'חסר הסבר לתשובה' });
	checkText(issues, 'prompt', 'ההוראה', question.prompt);
	checkText(issues, 'body', 'נוסח השאלה', question.body);
	checkText(issues, 'explanation', 'ההסבר', question.explanation);

	const { answer } = question;
	if (answer.kind === 'choice') {
		const options = answer.options.map((o) => o.trim());
		if (options.length < 2) issues.push({ field: 'options', message: 'צריך לפחות 2 תשובות לבחירה' });
		if (options.some((o) => !o)) issues.push({ field: 'options', message: 'יש תשובה ריקה' });
		if (new Set(options).size !== options.length) issues.push({ field: 'options', message: 'יש שתי תשובות זהות' });
		answer.options.forEach((o, i) => checkText(issues, 'options', `תשובה ${i + 1}`, o));
		if (!Number.isInteger(answer.correctIndex) || answer.correctIndex < 0 || answer.correctIndex >= answer.options.length) {
			issues.push({ field: 'answer', message: 'צריך לסמן את התשובה הנכונה' });
		}
	} else {
		if (!Number.isFinite(answer.rule.value)) issues.push({ field: 'answer', message: 'חסר מספר בתנאי התשובה' });
		if (!Number.isInteger(answer.solution) || answer.solution < 0) {
			issues.push({ field: 'answer', message: 'התשובה צריכה להיות מספר שלם, 0 ומעלה' });
		} else if (!checkNumber(answer, answer.solution)) {
			issues.push({ field: 'answer', message: 'התשובה לדוגמה לא עומדת בתנאי התשובה' });
		}
	}

	checkMath(issues, question);

	if (passageLines !== undefined) {
		for (const line of citedLines(`${question.body ?? ''} ${question.explanation ?? ''}`)) {
			if (line > passageLines) issues.push({ field: 'body', message: `יש הפניה לשורה ${line}, אבל בקטע יש ${passageLines} שורות` });
		}
	}
	return issues;
}

export function validatePassage(passage: Passage): Issue[] {
	const issues: Issue[] = [];
	if (!passage.title.trim()) issues.push({ field: 'title', message: 'חסרה כותרת' });
	if (!passage.paragraphs.flat().some((line) => line.trim())) issues.push({ field: 'paragraphs', message: 'הקטע ריק' });
	if (!passage.questions.length) issues.push({ field: 'questions', message: 'צריך לפחות שאלה אחת' });

	const ids = passage.questions.map((q) => q.id);
	if (new Set(ids).size !== ids.length) issues.push({ field: 'questions', message: 'יש שתי שאלות עם אותו מזהה' });

	const lines = lineCount(passage);
	passage.questions.forEach((question, i) => {
		for (const issue of validateQuestion(question, 'reading', lines)) {
			issues.push({ field: `questions.${i}.${issue.field}`, message: `שאלה ${i + 1}: ${issue.message}` });
		}
	});
	return issues;
}
