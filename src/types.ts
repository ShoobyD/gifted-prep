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
	// Where the question was taken from. Reading questions inherit their passage's source.
	source?: ContentSource;
	// Free-text detail on the source, e.g. a booklet page or a link.
	sourceNote?: string;
	// Left out of practice. Used for questions inside a passage; a standalone question is
	// hidden as a whole bank item.
	hidden?: boolean;
}

export const BLANK = '☐';

// Where content comes from: written for this app, the ministry's papers, or prep-site samples.
// 'other' covers content added later from anywhere else; sourceNote says where.
export type ContentSource = 'original' | 'official-2025' | 'official-sample' | 'noam' | 'gaonchik' | 'other';

export type PassageKind = 'informational' | 'story';

// A reading passage with its questions. Lines are kept as in the source because
// questions refer to line numbers ("בְּשׁוּרָה 2 כָּתוּב...").
export interface Passage {
	id: string;
	title: string;
	kind: PassageKind;
	source: ContentSource;
	sourceNote?: string;
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

// The kinds of items in the question bank (the server's bank_items table).
export type BankItemKind = 'passage' | 'question' | 'test';

// A test as stored in the bank: its sections point at bank items instead of holding copies,
// so editing a passage or question changes it in the test too.
export interface BankTestSection {
	// Omitted for a reading section named after its passage (it follows a rename).
	title?: string;
	instructions?: string;
	// A reading section: the passage with all its questions.
	passageId?: string;
	// A math section: questions, in order.
	questionIds?: string[];
}

export interface BankTest {
	id: string;
	title: string;
	// One line on the test's card, e.g. "הַמִּבְחָן הָאֲמִתִּי מִשְּׁנַת 2025".
	description?: string;
	source: ContentSource;
	sections: BankTestSection[];
}

// first: right on the first try; second: right after one mistake; failed: answer revealed.
export type Outcome = 'first' | 'second' | 'failed';

// Feeds a practice session one question at a time, so generators can adapt as it goes.
export interface QuestionSource {
	total: number;
	next(): Question;
	report?(question: Question, outcome: Outcome): void;
}
