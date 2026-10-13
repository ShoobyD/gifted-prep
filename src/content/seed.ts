// The built-in content as question bank items: what scripts/seed-bank.mjs loads into the
// database. checkBankItems guards the whole set, so nothing broken reaches the bank.
import { BASE_MATH_QUESTIONS, BASE_PASSAGES } from '@/data/content';
import { noamTest } from '@/data/noam';
import { official2025 } from '@/data/official2025';
import { officialSample } from '@/data/officialSample';
import type { BankItemKind, BankTest, BankTestSection, MockTest, Passage, Question } from '@/types';
import { validatePassage, validateQuestion } from './validate';

export type BankItemData = Passage | Question | BankTest;

export interface BankItem {
	id: string;
	kind: BankItemKind;
	data: BankItemData;
}

// Same limits as the server (functions/_lib/bank.ts).
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,99}$/i;
const MAX_ITEM_BYTES = 256 * 1024;

function toSection({ title, instructions, passage, questions }: MockTest['sections'][number]): BankTestSection {
	const extra = instructions ? { instructions } : {};
	if (passage) return { ...(title !== passage.title && { title }), ...extra, passageId: passage.id };
	return { title, ...extra, questionIds: questions.map((q) => q.id) };
}

export function toBankTest(test: MockTest, description?: string): BankTest {
	return {
		id: test.id,
		title: test.title,
		...(description && { description }),
		source: test.source,
		sections: test.sections.map(toSection),
	};
}

const BUILT_IN_TESTS: [MockTest, string][] = [
	[official2025, 'הַמִּבְחָן הָאֲמִתִּי מִשְּׁנַת 2025'],
	[officialSample, 'מִבְחָן קָצָר מֵחוֹבֶרֶת הַדֻּגְמָאוֹת שֶׁל מִשְׂרַד הַחִנּוּךְ'],
	[noamTest, 'מִבְחָן לְדֻגְמָה שֶׁל מָכוֹן לְהָכָנָה'],
];

// Passages, then math questions, then tests: the order the bank lists them in.
export function seedItems(): BankItem[] {
	return [
		...BASE_PASSAGES.map((data): BankItem => ({ id: data.id, kind: 'passage', data })),
		...BASE_MATH_QUESTIONS.map((data): BankItem => ({ id: data.id, kind: 'question', data })),
		...BUILT_IN_TESTS.map(([test, description]): BankItem => ({
			id: test.id,
			kind: 'test',
			data: toBankTest(test, description),
		})),
	];
}

function testProblems(test: BankTest, kinds: Map<string, BankItemKind>): string[] {
	const problems: string[] = [];
	if (!test.title.trim()) problems.push('missing title');
	if (!test.sections.length) problems.push('no sections');
	test.sections.forEach((section, i) => {
		const where = `section ${i + 1}`;
		if (!!section.passageId === !!section.questionIds) {
			problems.push(`${where}: needs either a passage or questions`);
		} else if (section.passageId) {
			if (kinds.get(section.passageId) !== 'passage') problems.push(`${where}: no passage ${section.passageId}`);
		} else {
			if (!section.title?.trim()) problems.push(`${where}: missing title`);
			if (!section.questionIds?.length) problems.push(`${where}: no questions`);
			for (const id of section.questionIds ?? []) {
				if (kinds.get(id) !== 'question') problems.push(`${where}: no question ${id}`);
			}
		}
	});
	return problems;
}

// Everything that would make the bank unusable: bad or repeated ids (passage questions
// included, since progress is kept per question id), content the editor would reject, and
// tests pointing at missing items. Returns "id: problem" lines; empty means fine.
export function checkBankItems(items: BankItem[]): string[] {
	const problems: string[] = [];
	const kinds = new Map(items.map((item) => [item.id, item.kind]));

	const ids = items.flatMap((item) => [
		item.id,
		...(item.kind === 'passage' ? (item.data as Passage).questions.map((q) => q.id) : []),
	]);
	const seen = new Set<string>();
	for (const id of ids) {
		if (seen.has(id)) problems.push(`${id}: id used more than once`);
		seen.add(id);
	}

	for (const { id, kind, data } of items) {
		const add = (messages: string[]) => problems.push(...messages.map((m) => `${id}: ${m}`));
		if (!ID_PATTERN.test(id)) add(['invalid id']);
		if (data.id !== id) add([`filed under another id (${data.id})`]);
		if (JSON.stringify(data).length > MAX_ITEM_BYTES) add(['too large']);

		if (kind === 'passage') {
			add(validatePassage(data as Passage).map((i) => `${i.field}: ${i.message}`));
		} else if (kind === 'question') {
			const question = data as Question;
			add(validateQuestion(question, 'math').map((i) => `${i.field}: ${i.message}`));
			if (!question.source) add(['missing source']);
		} else {
			add(testProblems(data as BankTest, kinds));
		}
	}
	return problems;
}
