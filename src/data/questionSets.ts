import { toRaw } from 'vue';
import { useLevels } from '@/composables/useLevels';
import { useProgress } from '@/composables/useProgress';
import { isMathType, MATH_GENERATORS, MATH_TYPES } from '@/generators';
import { pick, shuffle, type Rng } from '@/generators/random';
import type { MathQuestionType, Passage, Question, QuestionSource } from '@/types';
import { findPassage, REAL_MATH_QUESTIONS } from './content';
import { TYPE_LABELS } from './labels';
import { findMockTest } from './mockTests';

export const SESSION_LENGTH = 10;

const MIX = 'math-mix';
const REAL_MATH = 'math-real';
const READING_PREFIX = 'reading-';

export interface PracticeSet {
	source: QuestionSource;
	// A whole session on one passage.
	passage?: Passage;
	// Mixed sessions (review): the passage of each reading question.
	passageOf?: (question: Question) => Passage | undefined;
}

const REVIEW = 'review';

// Up to a session of the oldest mistakes. Copies get session-unique ids, because
// generated questions saved on different days can share an id.
function reviewSet(): PracticeSet | undefined {
	// Read untracked: the router's props function must not re-run (and rebuild the
	// session) every time an answer updates the mistakes list.
	const entries = toRaw(useProgress().state).mistakes.slice(0, SESSION_LENGTH);
	if (!entries.length) return undefined;
	const passages = new Map<string, Passage | undefined>();
	const questions = entries.map((entry, i) => {
		const question = { ...entry.question, id: `review-${i}-${entry.question.id}` };
		passages.set(question.id, entry.passageId ? findPassage(entry.passageId) : undefined);
		return question;
	});
	return { source: listSource(questions), passageOf: (q) => passages.get(q.id) };
}

function mathSource(types: MathQuestionType[], rng: Rng = Math.random): QuestionSource {
	const { levels, recordOutcome } = useLevels();
	let last: MathQuestionType | undefined;
	return {
		total: SESSION_LENGTH,
		next() {
			// In a mix, avoid the same type twice in a row.
			const options = types.length > 1 ? types.filter((t) => t !== last) : types;
			const type = pick(rng, options);
			last = type;
			return MATH_GENERATORS[type](levels[type], rng);
		},
		report(question, outcome) {
			if (isMathType(question.type)) recordOutcome(question.type, outcome);
		},
	};
}

// A fixed list, in order. Fixed questions don't change the adaptive levels.
function listSource(questions: Question[]): QuestionSource {
	let i = 0;
	return {
		total: questions.length,
		next: () => questions[i++] as Question,
	};
}

// Set names: "review", "math-mix", "math-real", "math-<type>" (e.g. "math-word-problem"), "reading-<passage id>".
export function resolveSet(set: string): PracticeSet | undefined {
	if (set === REVIEW) return reviewSet();
	if (set === MIX) return { source: mathSource(MATH_TYPES) };
	if (set === REAL_MATH) {
		return { source: listSource(shuffle(Math.random, REAL_MATH_QUESTIONS).slice(0, SESSION_LENGTH)) };
	}
	if (set.startsWith('math-')) {
		const type = set.slice('math-'.length);
		return isMathType(type) ? { source: mathSource([type]) } : undefined;
	}
	if (set.startsWith(READING_PREFIX)) {
		const passage = findPassage(set.slice(READING_PREFIX.length));
		return passage && { source: listSource(passage.questions), passage };
	}
	return undefined;
}

// Human-readable name of a set, for the parents' history.
export function describeSet(set: string): string {
	if (set === REVIEW) return 'חזרה על טעויות';
	if (set === MIX) return 'חשבון – ערבוב';
	if (set === REAL_MATH) return 'חשבון – שאלות אמיתיות';
	if (set.startsWith('test-')) return `מבחן – ${findMockTest(set.slice('test-'.length))?.title ?? set}`;
	if (set.startsWith(READING_PREFIX)) {
		const passage = findPassage(set.slice(READING_PREFIX.length));
		return `קריאה – ${passage?.title ?? set}`;
	}
	const type = set.slice('math-'.length);
	return isMathType(type) ? `חשבון – ${TYPE_LABELS[type]}` : set;
}

export function mathSetName(type: MathQuestionType | 'mix' | 'real'): string {
	return `math-${type}`;
}

export function readingSetName(passage: Passage): string {
	return `${READING_PREFIX}${passage.id}`;
}
