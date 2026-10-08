import { BLANK, type Level, type NumberAnswer, type Question } from '@/types';
import { greaterThan, lessThan } from './answers';
import { nextId, pick, randInt, type Rng } from './random';

const PROMPT = 'הַשְׁלִימוּ מִסְפָּר שֶׁמַּתְאִים (יֵשׁ כַּמָּה תְּשׁוּבוֹת נְכוֹנוֹת):';

interface Built {
	math: string;
	answer: NumberAnswer;
	explanation: string;
}

function above(threshold: number): string {
	return `לָכֵן כָּל מִסְפָּר גָּדוֹל מִ-${threshold} מַתְאִים, לְמָשָׁל ${threshold + 1}.`;
}

function below(threshold: number): string {
	return `לָכֵן כָּל מִסְפָּר קָטָן מִ-${threshold} מַתְאִים, לְמָשָׁל ${threshold - 1}.`;
}

// a + x > c  or  a + x < c
function sum(rng: Rng, max: number): Built {
	const a = randInt(rng, 5, max - 10);
	const c = randInt(rng, a + 3, max);
	const t = c - a;
	const greater = rng() < 0.5;
	return {
		math: `${a} + ${BLANK} ${greater ? '>' : '<'} ${c}`,
		answer: greater ? greaterThan(t) : lessThan(t),
		explanation: `$${a} + ${t} = ${c}$ בְּדִיּוּק, ${greater ? above(t) : below(t)}`,
	};
}

// x − b > c
function difference(rng: Rng): Built {
	const b = randInt(rng, 5, 40);
	const c = randInt(rng, 5, 99 - b);
	const t = b + c;
	return {
		math: `${BLANK} − ${b} > ${c}`,
		answer: greaterThan(t),
		explanation: `$${t} − ${b} = ${c}$ בְּדִיּוּק, ${above(t)}`,
	};
}

// a − x > c: the more we take away, the less is left.
function takeAway(rng: Rng): Built {
	const a = randInt(rng, 20, 100);
	const c = randInt(rng, 5, a - 3);
	const t = a - c;
	return {
		math: `${a} − ${BLANK} > ${c}`,
		answer: lessThan(t),
		explanation: `$${a} − ${t} = ${c}$ בְּדִיּוּק. כְּדֵי שֶׁיִּשָּׁאֵר יוֹתֵר צָרִיךְ לְהוֹרִיד פָּחוֹת, ${below(t)}`,
	};
}

// a + x > b + c
function twoSided(rng: Rng): Built {
	const b = randInt(rng, 10, 45);
	const c = randInt(rng, 5, 40);
	const total = b + c;
	const a = randInt(rng, 5, total - 3);
	const t = total - a;
	const greater = rng() < 0.5;
	return {
		math: `${a} + ${BLANK} ${greater ? '>' : '<'} ${b} + ${c}`,
		answer: greater ? greaterThan(t) : lessThan(t),
		explanation: `$${b} + ${c} = ${total}$, וְ-$${a} + ${t} = ${total}$ בְּדִיּוּק, ${greater ? above(t) : below(t)}`,
	};
}

// a × x > c  or  a × x < c, with c between multiples of a.
function product(rng: Rng): Built {
	const a = randInt(rng, 2, 9);
	const k = randInt(rng, 2, 9);
	const c = a * k + randInt(rng, 1, a - 1 || 1);
	const greater = rng() < 0.5;
	if (greater) {
		// a × k ≤ c < a × (k + 1)
		const t = Math.floor(c / a);
		return {
			math: `${a} × ${BLANK} > ${c}`,
			answer: greaterThan(t),
			explanation: `$${a} × ${t} = ${a * t}$ עוֹד לֹא גָּדוֹל מִ-${c}, אֲבָל $${a} × ${t + 1} = ${a * (t + 1)}$ כְּבָר גָּדוֹל. ${above(t)}`,
		};
	}
	// a × (t − 1) < c ≤ a × t
	const t = Math.ceil(c / a);
	return {
		math: `${a} × ${BLANK} < ${c}`,
		answer: lessThan(t),
		explanation: `$${a} × ${t} = ${a * t}$ כְּבָר לֹא קָטָן מִ-${c}, אֲבָל $${a} × ${t - 1} = ${a * (t - 1)}$ קָטָן. ${below(t)}`,
	};
}

const BUILDERS: Record<Level, ((rng: Rng) => Built)[]> = {
	1: [(rng) => sum(rng, 30)],
	2: [(rng) => sum(rng, 100), difference, takeAway],
	3: [twoSided, product, takeAway],
};

export function inequality(level: Level, rng: Rng): Question {
	const built = pick(rng, BUILDERS[level])(rng);
	return {
		id: nextId('inequality'),
		type: 'inequality',
		prompt: PROMPT,
		math: built.math,
		answer: built.answer,
		explanation: built.explanation,
		difficulty: level,
	};
}
