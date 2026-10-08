import { useLevels } from '@/composables/useLevels';
import { isMathType, MATH_GENERATORS, MATH_TYPES } from '@/generators';
import { pick, shuffle, type Rng } from '@/generators/random';
import type { MathQuestionType, Passage, Question, QuestionSource } from '@/types';
import { findPassage, REAL_MATH_QUESTIONS } from './content';

export const SESSION_LENGTH = 10;

const MIX = 'math-mix';
const REAL_MATH = 'math-real';
const READING_PREFIX = 'reading-';

export interface PracticeSet {
	source: QuestionSource;
	passage?: Passage;
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

// Set names: "math-mix", "math-real", "math-<type>" (e.g. "math-word-problem"), "reading-<passage id>".
export function resolveSet(set: string): PracticeSet | undefined {
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

export function mathSetName(type: MathQuestionType | 'mix' | 'real'): string {
	return `math-${type}`;
}

export function readingSetName(passage: Passage): string {
	return `${READING_PREFIX}${passage.id}`;
}
