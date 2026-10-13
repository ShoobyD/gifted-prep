// Helpers for browsing the question bank: search and the state of each item.
import type { Passage, Question } from '@/types';
import { CUSTOM_PREFIX } from './templates';

// unchanged: as first loaded into the bank; edited: saved again since; added: new from the parent.
export type ItemOrigin = 'unchanged' | 'edited' | 'added';

export function itemOrigin(id: string, version: number): ItemOrigin {
	if (id.startsWith(CUSTOM_PREFIX)) return 'added';
	return version > 1 ? 'edited' : 'unchanged';
}

const NIKUD = /[֑-ׇ]/g;

// Search ignores nikud, punctuation marks used in the texts, case and extra spaces, so
// typing "תמנון" finds "הַתְּמָנוּן".
export function normalize(text: string): string {
	return text.replace(NIKUD, '').replace(/[״׳"'$]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function questionText(question: Question): string {
	const answer = question.answer.kind === 'choice' ? question.answer.options : [String(question.answer.solution)];
	return [question.prompt, question.body, question.math, ...(question.lines ?? []), ...answer, question.explanation, question.sourceNote, question.id]
		.filter(Boolean)
		.join(' ');
}

export function passageText(passage: Passage): string {
	return [passage.title, passage.sourceNote, passage.id, ...passage.paragraphs.flat(), ...passage.questions.map(questionText)]
		.filter(Boolean)
		.join(' ');
}

// Passage text as the parent types it: a line per row, a blank row between paragraphs.
// Rows are kept as printed, since questions cite line numbers.
export function paragraphsToText(paragraphs: string[][]): string {
	return paragraphs.map((lines) => lines.join('\n')).join('\n\n');
}

export function textToParagraphs(text: string): string[][] {
	return text
		.replace(/\r/g, '')
		.split(/\n\s*\n/)
		.map((block) => block.split('\n').map((line) => line.trim()).filter(Boolean))
		.filter((lines) => lines.length > 0);
}

// Every word of the query must appear (in any order).
export function matches(text: string, query: string): boolean {
	const haystack = normalize(text);
	return normalize(query).split(' ').filter(Boolean).every((word) => haystack.includes(word));
}
