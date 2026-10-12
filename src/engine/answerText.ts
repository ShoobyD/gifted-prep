import type { Question } from '@/types';

export const CHOICE_LABELS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];

// The correct answer as a line of text, e.g. "ב. 8 שְׁקָלִים" or "כָּל מִסְפָּר גָּדוֹל מִ-15".
export function correctAnswerText(question: Question): string {
	const { answer } = question;
	if (answer.kind === 'choice') return `${CHOICE_LABELS[answer.correctIndex]}. ${answer.options[answer.correctIndex]}`;
	if (answer.rule.op === 'gt') return `כָּל מִסְפָּר גָּדוֹל מִ-${answer.rule.value}, לְמָשָׁל ${answer.solution}`;
	if (answer.rule.op === 'lt') return `כָּל מִסְפָּר קָטָן מִ-${answer.rule.value}, לְמָשָׁל ${answer.solution}`;
	return String(answer.solution);
}
