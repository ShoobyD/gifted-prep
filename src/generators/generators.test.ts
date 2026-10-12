import { describe, expect, it } from 'vitest';
import { checkNumber } from '@/engine/checkAnswer';
import { fill, holds, numbersIn, solutions, type Values } from '@/engine/expressions';
import type { Level, NumberAnswer, Question } from '@/types';
import { MATH_GENERATORS, MATH_TYPES } from '.';
import { seeded } from './random';

const SAMPLES = 1000;
const LEVELS: Level[] = [1, 2, 3];
const MAX_NUMBER = 100;

function checkNumberQuestion(q: Question, answer: NumberAnswer) {
	expect(checkNumber(answer, answer.solution), `${q.math}: solution passes its own rule`).toBe(true);
	expect(answer.solution).toBeGreaterThanOrEqual(0);
	expect(answer.solution).toBeLessThanOrEqual(MAX_NUMBER);

	const math = q.math as string;
	const lines = q.lines ?? [];
	const found = solutions(lines);
	expect(found, `${lines.join(' | ')}: exactly one solution`).toHaveLength(1);
	const values = found[0] as Values;

	// The math, with the solution in the box, must hold under the facts' values.
	expect(holds(fill(math, answer.solution), values), `${math} with ${answer.solution}`).toBe(true);

	// Thresholds are exact: the boundary value itself must fail.
	const { rule } = answer;
	if (rule.op === 'eq') {
		expect(holds(fill(math, answer.solution + 1), values)).toBe(false);
	} else {
		expect(holds(fill(math, rule.value), values), `${math} boundary ${rule.value}`).toBe(false);
	}
}

describe.each(MATH_TYPES)('%s generator', (type) => {
	it.each(LEVELS)('level %i produces valid questions', (level) => {
		const rng = seeded(level * 1000 + type.length);
		const ids = new Set<string>();

		for (let i = 0; i < SAMPLES; i++) {
			const q = MATH_GENERATORS[type](level, rng);
			expect(q.type).toBe(type);
			expect(ids.has(q.id)).toBe(false);
			ids.add(q.id);
			expect(q.explanation).toBeTruthy();
			// Balanced $...$ math markers in every free-text field.
			for (const text of [q.body, q.explanation].filter(Boolean)) {
				expect((text as string).split('$').length % 2, text).toBe(1);
			}

			// Grade-2 range: no number above 100 anywhere in the question.
			const visible = [q.math, q.body, ...(q.lines ?? [])].filter(Boolean).join(' ');
			for (const n of numbersIn(visible)) expect(n, visible).toBeLessThanOrEqual(MAX_NUMBER);

			if (q.answer.kind === 'number') {
				checkNumberQuestion(q, q.answer);
			} else {
				const { options, correctIndex } = q.answer;
				expect(options).toHaveLength(4);
				expect(new Set(options).size).toBe(4);
				expect(correctIndex).toBeGreaterThanOrEqual(0);
				expect(correctIndex).toBeLessThan(4);
			}
		}
	});
});
