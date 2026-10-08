import { describe, expect, it } from 'vitest';
import { checkNumber } from '@/engine/checkAnswer';
import { BLANK, type Level, type NumberAnswer, type Question } from '@/types';
import { MATH_GENERATORS, MATH_TYPES } from '.';
import { PICTURES } from './pictureRiddles';
import { seeded } from './random';
import { SYMBOLS } from './symbolDigits';

const SAMPLES = 1000;
const LEVELS: Level[] = [1, 2, 3];
const MAX_NUMBER = 100;

// --- A tiny independent evaluator for the generated expressions -------------------

type Values = Map<string, number>;

const isVariable = (ch: string) => PICTURES.includes(ch) || SYMBOLS.includes(ch);

function variablesOf(expression: string): string[] {
	return Array.from(expression).filter(isVariable);
}

// An operand is a number, a picture, or digits/symbols forming a multi-digit number ("5△", "△△").
function operandValue(token: string, values: Values): number {
	const chars = Array.from(token);
	if (chars.length === 1 && PICTURES.includes(token)) return values.get(token) as number;
	return chars.reduce((n, ch) => n * 10 + (isVariable(ch) ? (values.get(ch) as number) : Number(ch)), 0);
}

// Evaluates "a + b × c − d" with × before +/−.
function side(tokens: string[], values: Values): number {
	const terms: number[] = [];
	const signs: string[] = ['+'];
	let product = operandValue(tokens[0] as string, values);
	for (let i = 1; i < tokens.length; i += 2) {
		const op = tokens[i] as string;
		const value = operandValue(tokens[i + 1] as string, values);
		if (op === '×') {
			product *= value;
		} else {
			terms.push(product);
			signs.push(op);
			product = value;
		}
	}
	terms.push(product);
	return terms.reduce((sum, term, i) => (signs[i] === '−' ? sum - term : sum + term), 0);
}

function holds(statement: string, values: Values): boolean {
	const tokens = statement.split(' ');
	const at = tokens.findIndex((t) => t === '=' || t === '>' || t === '<');
	const left = side(tokens.slice(0, at), values);
	const right = side(tokens.slice(at + 1), values);
	const op = tokens[at];
	return op === '=' ? left === right : op === '>' ? left > right : left < right;
}

// All assignments of the given facts' variables that satisfy them.
function solutions(lines: string[]): Values[] {
	const vars = [...new Set(lines.flatMap(variablesOf))];
	// Check each fact as soon as all its variables are assigned, to prune the search.
	const readyAt = lines.map((line) => Math.max(-1, ...variablesOf(line).map((v) => vars.indexOf(v))));
	const found: Values[] = [];
	const assign = (i: number, values: Values) => {
		if (i === vars.length) {
			if (lines.every((line, l) => readyAt[l] !== -1 || holds(line, values))) found.push(new Map(values));
			return;
		}
		const v = vars[i] as string;
		const max = SYMBOLS.includes(v) ? 9 : 30;
		for (let n = 0; n <= max; n++) {
			values.set(v, n);
			if (lines.every((line, l) => readyAt[l] !== i || holds(line, values))) assign(i + 1, values);
		}
		values.delete(v);
	};
	assign(0, new Map());
	return found;
}

const fill = (math: string, n: number) => math.replace(BLANK, String(n));

function numbersIn(text: string): number[] {
	return (text.match(/\d+/g) ?? []).map(Number);
}

// --- Checks ------------------------------------------------------------------------

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
