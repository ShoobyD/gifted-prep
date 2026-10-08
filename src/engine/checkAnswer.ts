import type { ChoiceAnswer, NumberAnswer } from '@/types';

export function checkChoice(answer: ChoiceAnswer, index: number): boolean {
	return index === answer.correctIndex;
}

export function checkNumber(answer: NumberAnswer, value: number): boolean {
	const { rule } = answer;
	switch (rule.op) {
		case 'eq':
			return value === rule.value;
		case 'gt':
			return value > rule.value;
		case 'lt':
			return value < rule.value;
	}
}
