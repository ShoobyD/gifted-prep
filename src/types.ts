// Question types follow the official stage-A test (see resources/README.md).
export type ReadingQuestionType =
	| 'reading-fact'
	| 'word-meaning'
	| 'author-purpose'
	| 'inference'
	| 'not-answered'
	| 'pronoun'
	| 'word-relation';

export type MathQuestionType =
	| 'exercise'
	| 'missing-number'
	| 'inequality'
	| 'word-problem'
	| 'picture-riddle'
	| 'symbol-digit';

export type QuestionType = ReadingQuestionType | MathQuestionType;

export interface ChoiceAnswer {
	kind: 'choice';
	options: string[];
	correctIndex: number;
}

// Inequality items accept any number past a threshold, so the rule is declarative.
export type NumberRule =
	| { op: 'eq'; value: number }
	| { op: 'gt'; value: number }
	| { op: 'lt'; value: number };

export interface NumberAnswer {
	kind: 'number';
	rule: NumberRule;
	// A correct value to reveal after the last failed attempt.
	solution: number;
}

export type Answer = ChoiceAnswer | NumberAnswer;

export type Level = 1 | 2 | 3;

// Free-text fields (body, options, explanation) may contain inline math between $...$,
// rendered left-to-right by RichText.
export interface Question {
	id: string;
	type: QuestionType;
	// Short instruction line, e.g. "הַשְׁלִימוּ אֶת הַמִּסְפָּר הֶחָסֵר:".
	prompt?: string;
	// Main question text (word problem, reading question).
	body?: string;
	// Given facts shown above the main expression (picture riddles, symbol digits).
	lines?: string[];
	// Left-to-right expression; BLANK marks the box the child fills in.
	math?: string;
	image?: string;
	answer: Answer;
	explanation?: string;
	difficulty?: Level;
}

export const BLANK = '☐';

// Where content comes from: written for this app, the ministry's papers, or prep-site samples.
export type ContentSource = 'original' | 'official-2025' | 'official-sample' | 'noam' | 'gaonchik';

export type PassageKind = 'informational' | 'story';

// A reading passage with its questions. Lines are kept as in the source because
// questions refer to line numbers ("בְּשׁוּרָה 2 כָּתוּב...").
export interface Passage {
	id: string;
	title: string;
	kind: PassageKind;
	source: ContentSource;
	// Paragraphs of lines; lines are numbered continuously across paragraphs.
	paragraphs: string[][];
	questions: Question[];
}

// One part of a mock test, e.g. a reading passage or a math task.
export interface TestSection {
	title: string;
	instructions?: string;
	passage?: Passage;
	questions: Question[];
}

export interface MockTest {
	id: string;
	title: string;
	source: ContentSource;
	sections: TestSection[];
}

// first: right on the first try; second: right after one mistake; failed: answer revealed.
export type Outcome = 'first' | 'second' | 'failed';

// Feeds a practice session one question at a time, so generators can adapt as it goes.
export interface QuestionSource {
	total: number;
	next(): Question;
	report?(question: Question, outcome: Outcome): void;
}
