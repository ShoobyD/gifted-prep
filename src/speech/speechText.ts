import { BLANK, type Question } from '@/types';

// Spoken names for the pictures and symbols the generators use.
const WORDS: Record<string, string> = {
	'🍎': 'תַּפּוּחַ',
	'🍌': 'בָּנָנָה',
	'🍇': 'עֲנָבִים',
	'🍓': 'תּוּת',
	'⭐': 'כּוֹכָב',
	'🐱': 'חָתוּל',
	'🚗': 'מְכוֹנִית',
	'🎈': 'בַּלּוֹן',
	'🍪': 'עוּגִיָּה',
	'⚽': 'כַּדּוּר',
	'△': 'מְשֻׁלָּשׁ',
	'○': 'עִגּוּל',
	'◇': 'מְעֻיָּן',
	'☆': 'כּוֹכָב',
	'♡': 'לֵב',
};

const OPERATORS: Record<string, string> = {
	'+': 'וְעוֹד',
	'−': 'פָּחוֹת',
	'-': 'פָּחוֹת',
	'×': 'כָּפוּל',
	'÷': 'חֲלֻקָּה לְ',
	':': 'חֲלֻקָּה לְ',
	'=': 'שָׁוֶה',
	'>': 'גָּדוֹל מִ',
	'<': 'קָטָן מִ',
	[BLANK]: 'כַּמָּה',
};

// Reads an expression token by token, left to right ("5△" → "5 מְשֻׁלָּשׁ").
export function expressionToSpeech(expression: string): string {
	return expression
		.split(' ')
		.map((token) => OPERATORS[token] ?? Array.from(token).map((ch) => WORDS[ch] ?? ch).join(' ').replace(/(\d) (?=\d)/g, '$1'))
		.join(' ');
}

// Free text: inline $math$ is spoken as an expression; leftover pictures become words.
export function textToSpeech(text: string): string {
	return text
		.split('$')
		.map((part, i) => (i % 2 ? expressionToSpeech(part) : Array.from(part).map((ch) => WORDS[ch] ?? ch).join('')))
		.join('');
}

// Everything the child sees before answering: instruction, text, given facts, expression, options.
export function questionToSpeech(question: Question): string {
	const parts = [
		question.prompt && textToSpeech(question.prompt),
		question.body && textToSpeech(question.body),
		...(question.lines ?? []).map((line) => `${expressionToSpeech(line)}.`),
		question.math && `${expressionToSpeech(question.math)}?`,
	];
	if (question.answer.kind === 'choice') {
		const letters = ['א', 'ב', 'ג', 'ד', 'ה'];
		question.answer.options.forEach((option, i) => parts.push(`${letters[i]}: ${textToSpeech(option)}.`));
	}
	return parts.filter(Boolean).join(' ');
}

// Some Android engines cut long utterances; speak sentence by sentence.
export function splitSentences(text: string): string[] {
	return text
		.split(/(?<=[.?!:])\s+/)
		.map((s) => s.trim())
		.filter(Boolean);
}
