// A tiny independent evaluator for question expressions, used by tests to verify answers.
import { PICTURES } from '@/generators/pictureRiddles';
import { SYMBOLS } from '@/generators/symbolDigits';
import { BLANK } from '@/types';

export type Values = Map<string, number>;

const isVariable = (ch: string) => PICTURES.includes(ch) || SYMBOLS.includes(ch);

export function variablesOf(expression: string): string[] {
	return Array.from(expression).filter(isVariable);
}

// An operand is a number, a picture, or digits/symbols forming a multi-digit number ("5△", "△△").
function operandValue(token: string, values: Values): number {
	const chars = Array.from(token);
	if (chars.length === 1 && PICTURES.includes(token)) return values.get(token) as number;
	return chars.reduce((n, ch) => n * 10 + (isVariable(ch) ? (values.get(ch) as number) : Number(ch)), 0);
}

// Evaluates "a + b × c − d" with ×/÷ before +/−. Division is written ÷ or ":".
function side(tokens: string[], values: Values): number {
	const terms: number[] = [];
	const signs: string[] = ['+'];
	let product = operandValue(tokens[0] as string, values);
	for (let i = 1; i < tokens.length; i += 2) {
		const op = tokens[i] as string;
		const value = operandValue(tokens[i + 1] as string, values);
		if (op === '×') {
			product *= value;
		} else if (op === '÷' || op === ':') {
			product /= value;
		} else {
			terms.push(product);
			signs.push(op);
			product = value;
		}
	}
	terms.push(product);
	return terms.reduce((sum, term, i) => (signs[i] === '−' ? sum - term : sum + term), 0);
}

export function holds(statement: string, values: Values = new Map()): boolean {
	const tokens = statement.split(' ');
	const at = tokens.findIndex((t) => t === '=' || t === '>' || t === '<');
	const left = side(tokens.slice(0, at), values);
	const right = side(tokens.slice(at + 1), values);
	const op = tokens[at];
	return op === '=' ? left === right : op === '>' ? left > right : left < right;
}

// All assignments of the given facts' variables that satisfy them.
export function solutions(lines: string[]): Values[] {
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

export const fill = (math: string, n: number) => math.replace(BLANK, String(n));

export function numbersIn(text: string): number[] {
	return (text.match(/\d+/g) ?? []).map(Number);
}
