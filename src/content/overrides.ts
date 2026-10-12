// The parent's changes to the question bank, kept apart from the built-in content so the
// original is never lost ("revert" just drops the change) and the app still works offline.
import type { MockTest, Passage, Question } from '@/types';

export const OVERRIDES_VERSION = 1;

export interface ContentOverrides {
	version: number;
	// By id: an edited built-in passage (its questions included), or a new one.
	passages: Record<string, Passage>;
	// By id: an edited built-in math question from the real-test pool, or a new one.
	questions: Record<string, Question>;
	// Ids of hidden passages, passage questions and math questions.
	hidden: string[];
}

export function emptyOverrides(): ContentOverrides {
	return { version: OVERRIDES_VERSION, passages: {}, questions: {}, hidden: [] };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	!!value && typeof value === 'object' && !Array.isArray(value);

const looksLikeQuestion = (value: unknown) =>
	isRecord(value) && typeof value.id === 'string' && typeof value.type === 'string' && isRecord(value.answer);

const looksLikePassage = (value: unknown) =>
	isRecord(value) && typeof value.id === 'string' && typeof value.title === 'string'
	&& Array.isArray(value.paragraphs) && Array.isArray(value.questions) && value.questions.every(looksLikeQuestion);

// Accepts changes from the server or the local cache only if they have the expected shape;
// a broken document must never take the question bank down with it. Each item must sit
// under its own id.
export function parseOverrides(value: unknown): ContentOverrides | undefined {
	if (!isRecord(value) || value.version !== OVERRIDES_VERSION) return undefined;
	const { passages, questions, hidden } = value;
	if (!isRecord(passages) || !isRecord(questions)) return undefined;
	if (!Array.isArray(hidden) || !hidden.every((id) => typeof id === 'string')) return undefined;
	const keyedById = (items: Record<string, unknown>, check: (v: unknown) => boolean) =>
		Object.entries(items).every(([id, item]) => check(item) && (item as { id: string }).id === id);
	if (!keyedById(passages, looksLikePassage) || !keyedById(questions, looksLikeQuestion)) return undefined;
	return value as unknown as ContentOverrides;
}

export interface BaseContent {
	passages: Passage[];
	mathQuestions: Question[];
}

// Built-in items in their order, each replaced by its edited version; new items after them.
function merge<T extends { id: string }>(base: T[], changes: Record<string, T>): T[] {
	const baseIds = new Set(base.map((item) => item.id));
	const added = Object.values(changes).filter((item) => !baseIds.has(item.id));
	return [...base.map((item) => changes[item.id] ?? item), ...added];
}

// Everything, hidden included (for the bank and for looking items up by id).
export function allPassages(base: BaseContent, overrides: ContentOverrides): Passage[] {
	return merge(base.passages, overrides.passages);
}

export function allMathQuestions(base: BaseContent, overrides: ContentOverrides): Question[] {
	return merge(base.mathQuestions, overrides.questions);
}

// What practice offers: hidden passages and questions left out, and a passage whose
// questions are all hidden left out too.
export function visiblePassages(base: BaseContent, overrides: ContentOverrides): Passage[] {
	const hidden = new Set(overrides.hidden);
	return allPassages(base, overrides)
		.filter((passage) => !hidden.has(passage.id))
		.map((passage) => ({ ...passage, questions: passage.questions.filter((q) => !hidden.has(q.id)) }))
		.filter((passage) => passage.questions.length > 0);
}

export function visibleMathQuestions(base: BaseContent, overrides: ContentOverrides): Question[] {
	const hidden = new Set(overrides.hidden);
	return allMathQuestions(base, overrides).filter((q) => !hidden.has(q.id));
}

// --- Changes, as intents ----------------------------------------------------------------
// Each returns new overrides. Saving applies the intent again on the server's latest copy
// when another device saved in between, so concurrent changes add up instead of clobbering.

export type OverridesChange = (overrides: ContentOverrides) => ContentOverrides;

export function setHidden(id: string, hidden: boolean): OverridesChange {
	return (o) => ({
		...o,
		hidden: hidden ? [...new Set([...o.hidden, id])] : o.hidden.filter((h) => h !== id),
	});
}

// A real test with the parent's corrections applied. Hidden items stay in: a mock test
// keeps the structure of the booklet it reproduces.
export function applyToTest(test: MockTest, overrides: ContentOverrides): MockTest {
	return {
		...test,
		sections: test.sections.map((section) => {
			if (section.passage) {
				const passage = overrides.passages[section.passage.id] ?? section.passage;
				return { ...section, passage, questions: passage.questions };
			}
			return { ...section, questions: section.questions.map((q) => overrides.questions[q.id] ?? q) };
		}),
	};
}
