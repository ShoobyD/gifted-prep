import { BLANK, type Level, type Question } from '@/types';
import { exactly } from './answers';
import { nextId, pick, randInt, sample, type Rng } from './random';

const PROMPT = 'כָּל צִיּוּר מְסַמֵּן מִסְפָּר. צִיּוּר זֵהֶה – מִסְפָּר זֵהֶה.';

export const PICTURES = ['🍎', '🍌', '🍇', '🍓', '⭐', '🐱', '🚗', '🎈', '🍪', '⚽'];

interface Built {
	lines: string[];
	math: string;
	result: number;
	explanation: string;
}

// A + A = 2x; ask A + k.
function doubleThenAdd(rng: Rng, [a]: string[]): Built {
	const x = randInt(rng, 2, 10);
	const k = randInt(rng, 1, 10);
	return {
		lines: [`${a} + ${a} = ${2 * x}`],
		math: `${a} + ${k} = ${BLANK}`,
		result: x + k,
		explanation: `$${x} + ${x} = ${2 * x}$, לָכֵן $${a} = ${x}$. וְאָז $${x} + ${k} = ${x + k}$.`,
	};
}

// A + A + A = 3x; ask A.
function triple(rng: Rng, [a]: string[]): Built {
	const x = randInt(rng, 2, 9);
	return {
		lines: [`${a} + ${a} + ${a} = ${3 * x}`],
		math: `${a} = ${BLANK}`,
		result: x,
		explanation: `שְׁלוֹשָׁה צִיּוּרִים זֵהִים הֵם ${3 * x}: $${x} + ${x} + ${x} = ${3 * x}$, לָכֵן $${a} = ${x}$.`,
	};
}

// A + A = 2x, A + B = x + y; ask B.
function chainAdd(rng: Rng, [a, b]: string[]): Built {
	const x = randInt(rng, 2, 10);
	const y = randInt(rng, 2, 15);
	return {
		lines: [`${a} + ${a} = ${2 * x}`, `${a} + ${b} = ${x + y}`],
		math: `${b} = ${BLANK}`,
		result: y,
		explanation: `$${a} = ${x}$ (כִּי $${x} + ${x} = ${2 * x}$). אָז $${x} + ${b} = ${x + y}$, לָכֵן $${b} = ${y}$.`,
	};
}

// A + A + A = 3x, B − A = y − x; ask B.
function chainSub(rng: Rng, [a, b]: string[]): Built {
	const x = randInt(rng, 2, 9);
	const y = randInt(rng, x + 2, 25);
	return {
		lines: [`${a} + ${a} + ${a} = ${3 * x}`, `${b} − ${a} = ${y - x}`],
		math: `${b} = ${BLANK}`,
		result: y,
		explanation: `$${a} = ${x}$ (כִּי $${x} + ${x} + ${x} = ${3 * x}$). אָז $${b} − ${x} = ${y - x}$, לָכֵן $${b} = ${x} + ${y - x} = ${y}$.`,
	};
}

// A + A = 2x, A + B = x + y, B + C = y + z; ask C or the sum of all three.
function chainOfThree(rng: Rng, [a, b, c]: string[]): Built {
	const x = randInt(rng, 2, 10);
	const y = randInt(rng, 2, 15);
	const z = randInt(rng, 2, 15);
	const askSum = rng() < 0.5;
	const steps = `$${a} = ${x}$, $${b} = ${y}$, $${c} = ${z}$`;
	return {
		lines: [`${a} + ${a} = ${2 * x}`, `${a} + ${b} = ${x + y}`, `${b} + ${c} = ${y + z}`],
		math: askSum ? `${a} + ${b} + ${c} = ${BLANK}` : `${c} = ${BLANK}`,
		result: askSum ? x + y + z : z,
		explanation: askSum
			? `מוֹצְאִים אֶחָד אַחֲרֵי הַשֵּׁנִי: ${steps}. בְּיַחַד: $${x} + ${y} + ${z} = ${x + y + z}$.`
			: `מוֹצְאִים אֶחָד אַחֲרֵי הַשֵּׁנִי: ${steps}.`,
	};
}

// A × A = x², A + B = x + y; ask B.
function squareThenAdd(rng: Rng, [a, b]: string[]): Built {
	const x = randInt(rng, 2, 9);
	const y = randInt(rng, 2, 15);
	return {
		lines: [`${a} × ${a} = ${x * x}`, `${a} + ${b} = ${x + y}`],
		math: `${b} = ${BLANK}`,
		result: y,
		explanation: `$${x} × ${x} = ${x * x}$, לָכֵן $${a} = ${x}$. אָז $${b} = ${x + y} − ${x} = ${y}$.`,
	};
}

const BUILDERS: Record<Level, ((rng: Rng, pictures: string[]) => Built)[]> = {
	1: [doubleThenAdd, triple],
	2: [chainAdd, chainSub],
	3: [chainOfThree, squareThenAdd],
};

export function pictureRiddle(level: Level, rng: Rng): Question {
	const built = pick(rng, BUILDERS[level])(rng, sample(rng, PICTURES, 3));
	return {
		id: nextId('picture'),
		type: 'picture-riddle',
		prompt: PROMPT,
		lines: built.lines,
		math: built.math,
		answer: exactly(built.result),
		explanation: built.explanation,
		difficulty: level,
	};
}
