import type { Level, MathQuestionType, Question } from '@/types';
import { exercise } from './exercise';
import { inequality } from './inequality';
import { missingNumber } from './missingNumber';
import { pictureRiddle } from './pictureRiddles';
import type { Rng } from './random';
import { symbolDigit } from './symbolDigits';
import { wordProblem } from './wordProblems';

export type Generator = (level: Level, rng: Rng) => Question;

export const MATH_GENERATORS: Record<MathQuestionType, Generator> = {
	'exercise': exercise,
	'missing-number': missingNumber,
	'inequality': inequality,
	'word-problem': wordProblem,
	'picture-riddle': pictureRiddle,
	'symbol-digit': symbolDigit,
};

export const MATH_TYPES = Object.keys(MATH_GENERATORS) as MathQuestionType[];

export function isMathType(type: string): type is MathQuestionType {
	return type in MATH_GENERATORS;
}
