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
