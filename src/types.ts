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

// Free-text fields (body, options, explanation) may contain inline math between $...$,
// rendered left-to-right by RichText.
export interface Question {
	id: string;
	type: QuestionType;
	// Short instruction line, e.g. "הַשְׁלִימוּ אֶת הַמִּסְפָּר הֶחָסֵר:".
	prompt: string;
	// Main question text (word problem, reading question).
	body?: string;
	// Left-to-right expression; BLANK marks the box the child fills in.
	math?: string;
	image?: string;
	answer: Answer;
	explanation?: string;
	difficulty?: 1 | 2 | 3;
}

export const BLANK = '☐';
