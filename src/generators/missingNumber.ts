import { BLANK, type Level, type Question } from '@/types';
import { exactly } from './answers';
import { nextId, pick, randInt, type Rng } from './random';

const PROMPT = 'הַשְׁלִימוּ אֶת הַמִּסְפָּר הֶחָסֵר:';

interface Built {
	math: string;
	missing: number;
	explanation: string;
}

// x + b = c  or  a + x = c
function addend(rng: Rng, max: number): Built {
	const x = randInt(rng, 2, max - 10);
	const known = randInt(rng, 2, max - x);
	const sum = x + known;
	const first = rng() < 0.5;
	return {
		math: first ? `${BLANK} + ${known} = ${sum}` : `${known} + ${BLANK} = ${sum}`,
		missing: x,
		explanation: `מְחַפְּשִׂים כַּמָּה חָסֵר מִ-${known} עַד ${sum}: $${sum} − ${known} = ${x}$.`,
	};
}

// x − b = c
function minuend(rng: Rng, max: number): Built {
	const x = randInt(rng, 12, max);
	const b = randInt(rng, 2, x - 2);
	const c = x - b;
	return {
		math: `${BLANK} − ${b} = ${c}`,
		missing: x,
		explanation: `הוֹרַדְנוּ ${b} וְנִשְׁאַר ${c}, אָז בַּהַתְחָלָה הָיָה: $${c} + ${b} = ${x}$.`,
	};
}

// a − x = c
function subtrahend(rng: Rng, max: number): Built {
	const a = randInt(rng, 15, max);
	const x = randInt(rng, 2, a - 2);
	const c = a - x;
	return {
		math: `${a} − ${BLANK} = ${c}`,
		missing: x,
		explanation: `מִ-${a} צָרִיךְ לְהוֹרִיד כָּךְ שֶׁיִּשָּׁאֵר ${c}: $${a} − ${c} = ${x}$.`,
	};
}

// a × x = c
function factor(rng: Rng, maxFactor: number): Built {
	const a = randInt(rng, 2, maxFactor);
	const x = randInt(rng, 2, 10);
	const c = a * x;
	return {
		math: `${a} × ${BLANK} = ${c}`,
		missing: x,
		explanation: `כַּמָּה פְּעָמִים ${a} נוֹתְנִים ${c}? $${a} × ${x} = ${c}$.`,
	};
}

// x + a = b + c (a balance: both sides equal)
function balance(rng: Rng): Built {
	const b = randInt(rng, 10, 50);
	const c = randInt(rng, 5, 40);
	const total = b + c;
	const a = randInt(rng, 2, total - 2);
	const x = total - a;
	return {
		math: `${BLANK} + ${a} = ${b} + ${c}`,
		missing: x,
		explanation: `קֹדֶם מְחַשְּׁבִים אֶת הַצַּד הַשֵּׁנִי: $${b} + ${c} = ${total}$. אָז $${total} − ${a} = ${x}$.`,
	};
}

// a × x = b + c
function factorBalance(rng: Rng): Built {
	const a = randInt(rng, 2, 5);
	const x = randInt(rng, 2, 10);
	const total = a * x;
	const b = randInt(rng, 1, total - 1);
	const c = total - b;
	return {
		math: `${a} × ${BLANK} = ${b} + ${c}`,
		missing: x,
		explanation: `$${b} + ${c} = ${total}$, וְ-$${a} × ${x} = ${total}$.`,
	};
}

const BUILDERS: Record<Level, ((rng: Rng) => Built)[]> = {
	1: [(rng) => addend(rng, 40), (rng) => minuend(rng, 40)],
	2: [(rng) => addend(rng, 100), (rng) => minuend(rng, 100), (rng) => subtrahend(rng, 100), (rng) => factor(rng, 5)],
	3: [balance, factorBalance, (rng) => subtrahend(rng, 100), (rng) => factor(rng, 10)],
};

export function missingNumber(level: Level, rng: Rng): Question {
	const built = pick(rng, BUILDERS[level])(rng);
	return {
		id: nextId('missing'),
		type: 'missing-number',
		prompt: PROMPT,
		math: built.math,
		answer: exactly(built.missing),
		explanation: built.explanation,
		difficulty: level,
	};
}
