import type { ChoiceAnswer, NumberAnswer } from '@/types';
import { shuffle, type Rng } from './random';

export function exactly(value: number): NumberAnswer {
	return { kind: 'number', rule: { op: 'eq', value }, solution: value };
}

export function greaterThan(value: number): NumberAnswer {
	return { kind: 'number', rule: { op: 'gt', value }, solution: value + 1 };
}

export function lessThan(value: number): NumberAnswer {
	return { kind: 'number', rule: { op: 'lt', value }, solution: value - 1 };
}

// Distractors are given in priority order (likely mistakes first); the first three
// distinct ones that differ from the correct option are used.
export function choice(rng: Rng, correct: string, distractors: string[]): ChoiceAnswer {
	const picked = [...new Set(distractors)].filter((d) => d !== correct).slice(0, 3);
	if (picked.length < 3) throw new Error(`Not enough distractors for "${correct}"`);
	const options = shuffle(rng, [correct, ...picked]);
	return { kind: 'choice', options, correctIndex: options.indexOf(correct) };
}

// Likely-mistake candidates first, then near misses as a fallback; keeps valid non-negative integers.
export function numberDistractors(correct: number, candidates: number[]): number[] {
	const fallback = [correct + 1, correct - 1, correct + 2, correct - 2, correct + 10, correct - 10];
	return [...candidates, ...fallback].filter((n) => Number.isInteger(n) && n >= 0 && n !== correct);
}

// Multiple choice over numbers, each formatted (e.g. with a unit).
export function numberChoice(
	rng: Rng,
	correct: number,
	candidates: number[],
	format: (n: number) => string = String,
): ChoiceAnswer {
	return choice(rng, format(correct), numberDistractors(correct, candidates).map(format));
}
