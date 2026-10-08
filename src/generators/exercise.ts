import { BLANK, type Level, type Question } from '@/types';
import { exactly } from './answers';
import { nextId, pick, randInt, type Rng } from './random';

const PROMPT = 'פִּתְרוּ אֶת הַתַּרְגִּיל:';

interface Built {
	math: string;
	result: number;
	explanation: string;
}

function addition(rng: Rng, withCarry: boolean): Built {
	const t1 = randInt(rng, 1, 7);
	// Tens stay ≤ 8 so even with a carry the sum is below 100.
	const t2 = randInt(rng, 1, 8 - t1);
	const u1 = withCarry ? randInt(rng, 1, 9) : randInt(rng, 0, 9);
	const u2 = withCarry ? randInt(rng, 10 - u1, 9) : randInt(rng, 0, 9 - u1);
	const a = t1 * 10 + u1;
	const b = t2 * 10 + u2;
	const tens = (t1 + t2) * 10;
	const units = u1 + u2;
	return {
		math: `${a} + ${b} = ${BLANK}`,
		result: a + b,
		explanation:
			`עֲשָׂרוֹת: $${t1 * 10} + ${t2 * 10} = ${tens}$. אֲחָדוֹת: $${u1} + ${u2} = ${units}$. ` +
			`בְּיַחַד: $${tens} + ${units} = ${a + b}$.`,
	};
}

function subtraction(rng: Rng, withBorrow: boolean): Built {
	const t1 = randInt(rng, 2, 9);
	const t2 = randInt(rng, 1, t1 - 1);
	const u1 = withBorrow ? randInt(rng, 0, 8) : randInt(rng, 1, 9);
	const u2 = withBorrow ? randInt(rng, u1 + 1, 9) : randInt(rng, 0, u1);
	const a = t1 * 10 + u1;
	const b = t2 * 10 + u2;
	const afterTens = a - t2 * 10;
	return {
		math: `${a} − ${b} = ${BLANK}`,
		result: a - b,
		explanation: u2 === 0
			? `מוֹרִידִים ${t2 * 10}: $${a} − ${b} = ${a - b}$.`
			: `קֹדֶם מוֹרִידִים ${t2 * 10}, וְאַחַר כָּךְ עוֹד ${u2}: $${a} − ${t2 * 10} = ${afterTens}$, $${afterTens} − ${u2} = ${a - b}$.`,
	};
}

function multiplication(rng: Rng, maxFactor: number): Built {
	const a = randInt(rng, 2, maxFactor);
	const b = randInt(rng, 2, 10);
	const product = a * b;
	const repeated = Array.from({ length: a }, () => b).join(' + ');
	return {
		math: `${a} × ${b} = ${BLANK}`,
		result: product,
		explanation: a <= 5
			? `$${a} × ${b}$ זֶה ${a} פְּעָמִים ${b}: $${repeated} = ${product}$.`
			: `$${a} × ${b} = ${product}$. אֶפְשָׁר גַּם: $${b} × ${a} = ${product}$.`,
	};
}

// a + b − c, computed left to right.
function threeTerms(rng: Rng): Built {
	const a = randInt(rng, 15, 60);
	const b = randInt(rng, 10, 100 - a);
	const sum = a + b;
	const c = randInt(rng, 5, sum - 5);
	return {
		math: `${a} + ${b} − ${c} = ${BLANK}`,
		result: sum - c,
		explanation: `מְחַשְּׁבִים לְפִי הַסֵּדֶר: $${a} + ${b} = ${sum}$, וְאָז $${sum} − ${c} = ${sum - c}$.`,
	};
}

function fromHundred(rng: Rng): Built {
	const b = randInt(rng, 11, 89);
	const toTen = (10 - (b % 10)) % 10;
	const roundUp = b + toTen;
	return {
		math: `100 − ${b} = ${BLANK}`,
		result: 100 - b,
		explanation: toTen === 0
			? `$100 − ${b} = ${100 - b}$.`
			: `מִ-${b} עַד ${roundUp} חָסֵר ${toTen}, וּמִ-${roundUp} עַד 100 חָסֵר ${100 - roundUp}. בְּיַחַד: $${toTen} + ${100 - roundUp} = ${100 - b}$.`,
	};
}

const BUILDERS: Record<Level, ((rng: Rng) => Built)[]> = {
	1: [(rng) => addition(rng, false), (rng) => subtraction(rng, false)],
	2: [(rng) => addition(rng, true), (rng) => subtraction(rng, true), (rng) => multiplication(rng, 5)],
	3: [threeTerms, fromHundred, (rng) => multiplication(rng, 10), (rng) => subtraction(rng, true)],
};

export function exercise(level: Level, rng: Rng): Question {
	const built = pick(rng, BUILDERS[level])(rng);
	return {
		id: nextId('exercise'),
		type: 'exercise',
		prompt: PROMPT,
		math: built.math,
		answer: exactly(built.result),
		explanation: built.explanation,
		difficulty: level,
	};
}
