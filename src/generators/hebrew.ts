// Voweled Hebrew building blocks for word problems, with gender agreement.
export type Gender = 'm' | 'f';

export interface Person {
	name: string;
	g: Gender;
}

// Names start with a plain consonant so the prefixes לְ / וּלְ stay regular.
export const PEOPLE: Person[] = [
	{ name: 'נֹעָה', g: 'f' },
	{ name: 'מָאיָה', g: 'f' },
	{ name: 'שִׁירָה', g: 'f' },
	{ name: 'תָּמָר', g: 'f' },
	{ name: 'יָעֵל', g: 'f' },
	{ name: 'הִלָּה', g: 'f' },
	{ name: 'יוֹנָתָן', g: 'm' },
	{ name: 'אִיתַי', g: 'm' },
	{ name: 'עוֹמֶר', g: 'm' },
	{ name: 'דָּנִיֵּאל', g: 'm' },
	{ name: 'נָדָב', g: 'm' },
	{ name: 'רוֹעִי', g: 'm' },
];

export interface Item {
	sg: string;
	pl: string;
	g: Gender;
}

// Things bought in a shop.
export const SHOP_ITEMS: Item[] = [
	{ sg: 'עִפָּרוֹן', pl: 'עֶפְרוֹנוֹת', g: 'm' },
	{ sg: 'מַחְבֶּרֶת', pl: 'מַחְבָּרוֹת', g: 'f' },
	{ sg: 'כַּדּוּר', pl: 'כַּדּוּרִים', g: 'm' },
	{ sg: 'מַחַק', pl: 'מַחֲקִים', g: 'm' },
	{ sg: 'גְּלִידָה', pl: 'גְּלִידוֹת', g: 'f' },
	{ sg: 'סֵפֶר', pl: 'סְפָרִים', g: 'm' },
	{ sg: 'בַּלּוֹן', pl: 'בַּלּוֹנִים', g: 'm' },
	{ sg: 'עוּגִיָּה', pl: 'עוּגִיּוֹת', g: 'f' },
];

// Things children collect and share.
export const COLLECTIBLES: Item[] = [
	{ sg: 'מַדְבֵּקָה', pl: 'מַדְבֵּקוֹת', g: 'f' },
	{ sg: 'קְלָף', pl: 'קְלָפִים', g: 'm' },
	{ sg: 'גֻּלָּה', pl: 'גֻּלּוֹת', g: 'f' },
	{ sg: 'סֻכָּרִיָּה', pl: 'סֻכָּרִיּוֹת', g: 'f' },
];

export function byGender(subject: { g: Gender }, masculine: string, feminine: string): string {
	return subject.g === 'm' ? masculine : feminine;
}

export function shekels(n: number): string {
	return n === 1 ? 'שֶׁקֶל אֶחָד' : `${n} שְׁקָלִים`;
}

const SHVA = 'ְ';
const DAGESH = 'ּ';

// The conjunction "and": וּ before ב/ו/מ/פ or a shva, otherwise וְ.
export function and(word: string): string {
	const first = word[0] ?? '';
	let i = 1;
	if (word[i] === DAGESH) i++;
	if ('בומפ'.includes(first) || word[i] === SHVA) return `וּ${word}`;
	return `וְ${word}`;
}
