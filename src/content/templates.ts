// Empty items for the "add" buttons of the question bank. Ids of added content start with
// "custom-" plus a random part, so they never collide with the original items' ids or with each other.
import type { Passage, Question } from '@/types';

export const CUSTOM_PREFIX = 'custom-';

function randomPart(): string {
	return crypto.randomUUID().replace(/-/g, '').slice(0, 10);
}

export function newMathQuestion(): Question {
	return {
		id: `${CUSTOM_PREFIX}m-${randomPart()}`,
		type: 'word-problem',
		source: 'other',
		body: '',
		explanation: '',
		answer: { kind: 'choice', options: ['', '', '', ''], correctIndex: 0 },
	};
}

// A question inside a passage; its id is tied to the passage for readability.
export function newReadingQuestion(passageId: string): Question {
	return {
		id: `${passageId}-q-${randomPart()}`,
		type: 'reading-fact',
		body: '',
		explanation: '',
		answer: { kind: 'choice', options: ['', '', '', ''], correctIndex: 0 },
	};
}

export function newPassage(): Passage {
	const id = `${CUSTOM_PREFIX}p-${randomPart()}`;
	return {
		id,
		title: '',
		kind: 'story',
		source: 'other',
		paragraphs: [],
		questions: [newReadingQuestion(id)],
	};
}
