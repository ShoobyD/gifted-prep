// Shape checks for content that comes from outside the app (the server, the local cache).
// Only the shape: content rules are in validate.ts. A broken item is skipped, so it can
// never take the question bank down with it.
import type { BankTest, Passage, Question } from '@/types';

export const isRecord = (value: unknown): value is Record<string, unknown> =>
	!!value && typeof value === 'object' && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
	Array.isArray(value) && value.every((item) => typeof item === 'string');

export const looksLikeQuestion = (value: unknown): value is Question =>
	isRecord(value) && typeof value.id === 'string' && typeof value.type === 'string' && isRecord(value.answer);

export const looksLikePassage = (value: unknown): value is Passage =>
	isRecord(value) && typeof value.id === 'string' && typeof value.title === 'string'
	&& Array.isArray(value.paragraphs) && Array.isArray(value.questions) && value.questions.every(looksLikeQuestion);

const looksLikeSection = (value: unknown) =>
	isRecord(value)
	&& (value.passageId === undefined || typeof value.passageId === 'string')
	&& (value.questionIds === undefined || isStringArray(value.questionIds));

export const looksLikeTest = (value: unknown): value is BankTest =>
	isRecord(value) && typeof value.id === 'string' && typeof value.title === 'string'
	&& Array.isArray(value.sections) && value.sections.every(looksLikeSection);
