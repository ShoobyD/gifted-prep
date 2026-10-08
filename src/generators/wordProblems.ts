import type { ChoiceAnswer, Level, Question } from '@/types';
import { choice, numberChoice } from './answers';
import { and, byGender, COLLECTIBLES, PEOPLE, SHOP_ITEMS, shekels, type Person } from './hebrew';
import { nextId, pick, randInt, sample, type Rng } from './random';

const PROMPT = 'קִרְאוּ וּבַחֲרוּ אֶת הַתְּשׁוּבָה הַנְּכוֹנָה:';

interface Built {
	body: string;
	answer: ChoiceAnswer;
	explanation: string;
}

const he = (p: Person) => byGender(p, 'הוּא', 'הִיא');
const to = (p: Person) => byGender(p, 'לוֹ', 'לָהּ');
const bought = (p: Person) => byGender(p, 'קָנָה', 'קָנְתָה');
const paid = (p: Person) => byGender(p, 'שִׁלֵּם', 'שִׁלְּמָה');
const got = (p: Person) => byGender(p, 'קִבֵּל', 'קִבְּלָה');

// Received more: a + b.
function collect(rng: Rng): Built {
	const p = pick(rng, PEOPLE);
	const it = pick(rng, COLLECTIBLES);
	const a = randInt(rng, 12, 45);
	const b = randInt(rng, 5, 30);
	const total = a + b;
	return {
		body: `לְ${p.name} הָיוּ ${a} ${it.pl}. ${he(p)} ${got(p)} מִסָּבְתָא עוֹד ${b} ${it.pl}. כַּמָּה ${it.pl} יֵשׁ ${to(p)} עַכְשָׁו?`,
		answer: numberChoice(rng, total, [a - b, total + 10, total - 10], (n) => `${n} ${it.pl}`),
		explanation: `הָיוּ ${a} וְנוֹסְפוּ ${b}: $${a} + ${b} = ${total}$.`,
	};
}

// Gave some away: a − b.
function giveAway(rng: Rng): Built {
	const p = pick(rng, PEOPLE);
	const it = pick(rng, COLLECTIBLES);
	const a = randInt(rng, 20, 60);
	const b = randInt(rng, 5, a - 5);
	const left = a - b;
	const sibling = byGender(p, 'לְאָחִיו', 'לְאָחִיהָ');
	const gave = byGender(p, 'נָתַן', 'נָתְנָה');
	return {
		body: `לְ${p.name} הָיוּ ${a} ${it.pl}. ${he(p)} ${gave} ${sibling} ${b} ${it.pl}. כַּמָּה ${it.pl} נִשְׁאֲרוּ ${to(p)}?`,
		answer: numberChoice(rng, left, [a + b, left + 10, left - 10], (n) => `${n} ${it.pl}`),
		explanation: `הָיוּ ${a}, ${he(p)} ${gave} ${b}: $${a} − ${b} = ${left}$.`,
	};
}

// Change from a 20-shekel note for one item.
function changeOne(rng: Rng): Built {
	const p = pick(rng, PEOPLE);
	const it = pick(rng, SHOP_ITEMS);
	const price = randInt(rng, 3, 15);
	const change = 20 - price;
	return {
		body: `${p.name} ${bought(p)} ${it.sg} בְּ-${price} שְׁקָלִים ${and(paid(p))} בִּשְׁטָר שֶׁל 20 שְׁקָלִים. כַּמָּה עֹדֶף ${got(p)}?`,
		answer: numberChoice(rng, change, [20 + price, price, change + 2], shekels),
		explanation: `$20 − ${price} = ${change}$.`,
	};
}

// k items at a price, change from 50.
function changeMany(rng: Rng): Built {
	const p = pick(rng, PEOPLE);
	const it = pick(rng, SHOP_ITEMS);
	const k = randInt(rng, 2, 5);
	const price = randInt(rng, 2, Math.min(9, Math.floor(45 / k)));
	const cost = k * price;
	const change = 50 - cost;
	return {
		body:
			`${p.name} ${bought(p)} ${k} ${it.pl}. כָּל ${it.sg} ${byGender(it, 'עוֹלֶה', 'עוֹלָה')} ${shekels(price)}. ` +
			`${he(p)} ${paid(p)} בִּשְׁטָר שֶׁל 50 שְׁקָלִים. כַּמָּה עֹדֶף ${got(p)}?`,
		answer: numberChoice(rng, change, [cost, 50 - price, change + price, change - price], shekels),
		explanation: `${k} ${it.pl} עוֹלִים $${k} × ${price} = ${cost}$ שְׁקָלִים. הָעֹדֶף: $50 − ${cost} = ${change}$.`,
	};
}

// Equal sharing: n = k × q.
function share(rng: Rng): Built {
	const p = pick(rng, PEOPLE);
	const it = pick(rng, COLLECTIBLES);
	const k = randInt(rng, 2, 5);
	const q = randInt(rng, 2, 10);
	const n = k * q;
	const them = byGender(it, 'אוֹתָם', 'אוֹתָן');
	return {
		body: `לְ${p.name} הָיוּ ${n} ${it.pl}. ${he(p)} ${byGender(p, 'חִלֵּק', 'חִלְּקָה')} ${them} בְּשָׁוֶה בֵּין ${k} חֲבֵרִים. כַּמָּה ${it.pl} קִבֵּל כָּל חָבֵר?`,
		answer: numberChoice(rng, q, [n - k, q + 1, q - 1, k], (x) => `${x} ${it.pl}`),
		explanation: `$${k} × ${q} = ${n}$, לָכֵן כָּל חָבֵר קִבֵּל ${q}.`,
	};
}

// B has d more than A; how much together?
function twoKids(rng: Rng): Built {
	const [a, b] = sample(rng, PEOPLE, 2) as [Person, Person];
	const x = randInt(rng, 5, 30);
	const d = randInt(rng, 2, 15);
	const y = x + d;
	const total = x + y;
	const both = a.g === 'f' && b.g === 'f' ? 'לִשְׁתֵּיהֶן' : 'לִשְׁנֵיהֶם';
	return {
		body:
			`לְ${a.name} יֵשׁ ${x} שְׁקָלִים. לְ${b.name} יֵשׁ ${d} שְׁקָלִים יוֹתֵר ${byGender(a, 'מִמֶּנּוּ', 'מִמֶּנָּה')}. ` +
			`כַּמָּה כֶּסֶף יֵשׁ ${both} יַחַד?`,
		answer: numberChoice(rng, total, [y, x + d + d, 2 * x, total + 10], shekels),
		explanation: `לְ${b.name} יֵשׁ $${x} + ${d} = ${y}$. בְּיַחַד: $${x} + ${y} = ${total}$.`,
	};
}

const ORDINALS: Record<number, string> = { 3: 'הַשְּׁלִישִׁי', 4: 'הָרְבִיעִי', 5: 'הַחֲמִישִׁי' };

// Grows by d every day; value on day N.
function growing(rng: Rng): Built {
	const p = pick(rng, PEOPLE);
	const s = randInt(rng, 3, 10);
	const d = randInt(rng, 2, 5);
	const day = randInt(rng, 3, 5);
	const value = s + (day - 1) * d;
	const read = byGender(p, 'קָרָא', 'קָרְאָה');
	const days = Array.from({ length: day }, (_, i) => `$${s + i * d}$`).join(', ');
	return {
		body:
			`${p.name} ${read} בַּיּוֹם הָרִאשׁוֹן ${s} עַמּוּדִים בַּסֵּפֶר. בְּכָל יוֹם ${he(p)} ${read} ${d} עַמּוּדִים יוֹתֵר ` +
			`מֵהַיּוֹם שֶׁלְּפָנָיו. כַּמָּה עַמּוּדִים ${read} בַּיּוֹם ${ORDINALS[day]}?`,
		answer: numberChoice(rng, value, [s + day * d, s + (day - 2) * d, s + day], (n) => `${n} עַמּוּדִים`),
		explanation: `בְּכָל יוֹם מוֹסִיפִים ${d}: ${days}.`,
	};
}

const COINS = [10, 5, 2, 1];

// Fewest coins summing to the amount.
function coinsFor(amount: number): number[] {
	const result: number[] = [];
	let left = amount;
	for (const coin of COINS) {
		while (left >= coin) {
			result.push(coin);
			left -= coin;
		}
	}
	return result;
}

function coinsText(amount: number): string {
	const parts = COINS.flatMap((coin) => {
		const count = coinsFor(amount).filter((c) => c === coin).length;
		if (!count) return [];
		const value = coin === 1 ? 'שֶׁקֶל אֶחָד' : `${coin} שְׁקָלִים`;
		return [count === 1 ? `מַטְבֵּעַ שֶׁל ${value}` : `${count} מַטְבְּעוֹת שֶׁל ${value}`];
	});
	if (parts.length === 1) return parts[0] as string;
	const last = parts.pop() as string;
	return `${parts.join(', ')} ${/^\d/.test(last) ? `וְ-${last}` : and(last)}`;
}

// Two items, paid with 20: which coins make up the change.
function coinChange(rng: Rng): Built {
	const p = pick(rng, PEOPLE);
	const [it1, it2] = sample(rng, SHOP_ITEMS, 2) as [typeof SHOP_ITEMS[number], typeof SHOP_ITEMS[number]];
	const p1 = randInt(rng, 2, 8);
	const p2 = randInt(rng, 2, 8);
	const cost = p1 + p2;
	const change = 20 - cost;
	const near = [change + 1, change - 1, change + 2, change - 2, change + 5].filter((n) => n > 0);
	return {
		body:
			`${p.name} ${bought(p)} ${it1.sg} בְּ-${shekels(p1)} ${and(it2.sg)} בְּ-${shekels(p2)}. ` +
			`${he(p)} ${paid(p)} בִּשְׁטָר שֶׁל 20 שְׁקָלִים. אֵיזֶה עֹדֶף ${got(p)}?`,
		answer: choice(rng, coinsText(change), near.map(coinsText)),
		explanation: `$${p1} + ${p2} = ${cost}$, וְהָעֹדֶף: $20 − ${cost} = ${change}$. זֶה ${coinsText(change)}.`,
	};
}

const BUILDERS: Record<Level, ((rng: Rng) => Built)[]> = {
	1: [collect, giveAway, changeOne],
	2: [changeMany, share, twoKids],
	3: [growing, coinChange, changeMany],
};

export function wordProblem(level: Level, rng: Rng): Question {
	const built = pick(rng, BUILDERS[level])(rng);
	return {
		id: nextId('word'),
		type: 'word-problem',
		prompt: PROMPT,
		body: built.body,
		answer: built.answer,
		explanation: built.explanation,
		difficulty: level,
	};
}
