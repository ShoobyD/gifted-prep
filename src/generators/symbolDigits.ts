import { BLANK, type Level, type Question } from '@/types';
import { exactly } from './answers';
import { nextId, pick, randInt, sample, type Rng } from './random';

const PROMPT = 'כָּל סִמָּן מְסַמֵּן סִפְרָה אַחַת. סִמָּן זֵהֶה – סִפְרָה זֵהָה.';

// Avoids □, which looks like the answer box.
export const SYMBOLS = ['△', '○', '◇', '☆', '♡'];

interface Built {
	lines: string[];
	math: string;
	result: number;
	explanation: string;
}

// T△ + k = …: the symbol is the units digit.
function units(rng: Rng, [s]: string[]): Built {
	const t = randInt(rng, 1, 8);
	const d = randInt(rng, 0, 8);
	const k = randInt(rng, 1, 9 - d);
	const total = t * 10 + d + k;
	return {
		lines: [`${t}${s} + ${k} = ${total}`],
		math: `${s} = ${BLANK}`,
		result: d,
		explanation: `$${total} − ${k} = ${t * 10 + d}$, לָכֵן סִפְרַת הָאֲחָדוֹת הִיא ${d}.`,
	};
}

// △u − 10m = …: the symbol is the tens digit.
function tens(rng: Rng, [s]: string[]): Built {
	const d = randInt(rng, 2, 9);
	const u = randInt(rng, 0, 9);
	const m = randInt(rng, 1, d - 1);
	const n = d * 10 + u;
	return {
		lines: [`${s}${u} − ${m * 10} = ${n - m * 10}`],
		math: `${s} = ${BLANK}`,
		result: d,
		explanation: `$${n - m * 10} + ${m * 10} = ${n}$, לָכֵן סִפְרַת הָעֲשָׂרוֹת הִיא ${d}.`,
	};
}

// △△ − △ = 10△.
function repeatedMinus(rng: Rng, [s]: string[]): Built {
	const d = randInt(rng, 1, 9);
	return {
		lines: [`${s}${s} − ${s} = ${d * 10}`],
		math: `${s} = ${BLANK}`,
		result: d,
		explanation: `מְנַסִּים: $${d}${d} − ${d} = ${d * 10}$, לָכֵן הַסִּפְרָה הִיא ${d}.`,
	};
}

// △△ + △ = 12△.
function repeatedPlus(rng: Rng, [s]: string[]): Built {
	const d = randInt(rng, 1, 8);
	return {
		lines: [`${s}${s} + ${s} = ${d * 12}`],
		math: `${s} = ${BLANK}`,
		result: d,
		explanation: `מְנַסִּים: $${d}${d} + ${d} = ${d * 12}$, לָכֵן הַסִּפְרָה הִיא ${d}.`,
	};
}

// △ + ○ = a + b, △ − ○ = a − b; ask the number △○.
function twoSymbols(rng: Rng, [s1, s2]: string[]): Built {
	const a = randInt(rng, 2, 9);
	const b = randInt(rng, 1, a - 1);
	return {
		lines: [`${s1} + ${s2} = ${a + b}`, `${s1} − ${s2} = ${a - b}`],
		math: `${s1}${s2} = ${BLANK}`,
		result: a * 10 + b,
		explanation: `מְחַפְּשִׂים שְׁתֵּי סְפָרוֹת שֶׁסְּכוּמָן ${a + b} וְהַהֶפְרֵשׁ בֵּינֵיהֶן ${a - b}: ${a} וְ-${b}. לָכֵן הַמִּסְפָּר הוּא ${a * 10 + b}.`,
	};
}

const BUILDERS: Record<Level, ((rng: Rng, symbols: string[]) => Built)[]> = {
	1: [units, tens],
	2: [repeatedMinus, repeatedPlus, tens],
	3: [twoSymbols, repeatedPlus],
};

export function symbolDigit(level: Level, rng: Rng): Question {
	const built = pick(rng, BUILDERS[level])(rng, sample(rng, SYMBOLS, 2));
	return {
		id: nextId('symbol'),
		type: 'symbol-digit',
		prompt: PROMPT,
		lines: built.lines,
		math: built.math,
		answer: exactly(built.result),
		explanation: built.explanation,
		difficulty: level,
	};
}
