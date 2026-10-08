import { useLevels } from '@/composables/useLevels';
import { isMathType, MATH_GENERATORS, MATH_TYPES } from '@/generators';
import { pick, type Rng } from '@/generators/random';
import type { MathQuestionType, QuestionSource } from '@/types';

export const SESSION_LENGTH = 10;

const MIX = 'math-mix';

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

// Set names: "math-mix" or "math-<type>", e.g. "math-word-problem".
export function isValidSet(set: string): boolean {
	return set === MIX || (set.startsWith('math-') && isMathType(set.slice('math-'.length)));
}

export function createSource(set: string): QuestionSource | undefined {
	if (set === MIX) return mathSource(MATH_TYPES);
	const type = set.slice('math-'.length);
	if (set.startsWith('math-') && isMathType(type)) return mathSource([type]);
	return undefined;
}

export function mathSetName(type: MathQuestionType | 'mix'): string {
	return `math-${type}`;
}
