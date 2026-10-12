// Helpers for browsing the question bank: search and the state of each item.
import type { Passage, Question } from '@/types';
import type { ContentOverrides } from './overrides';

// built-in: as shipped; edited: a built-in item changed by the parent; added: new from the parent.
export type ItemOrigin = 'built-in' | 'edited' | 'added';

export function itemOrigin(id: string, builtInIds: Set<string>, changed: Record<string, unknown>): ItemOrigin {
	if (!(id in changed)) return 'built-in';
	return builtInIds.has(id) ? 'edited' : 'added';
}

export function isHidden(overrides: ContentOverrides, id: string): boolean {
	return overrides.hidden.includes(id);
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

// Every word of the query must appear (in any order).
export function matches(text: string, query: string): boolean {
	const haystack = normalize(text);
	return normalize(query).split(' ').filter(Boolean).every((word) => haystack.includes(word));
}
