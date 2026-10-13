// A small, valid question bank for tests: the real one lives only in the database.
import { toBankContent, type BankRecord } from '@/content/bankContent';
import type { BankItem } from '@/content/checkBank';
import { BLANK, type BankTest, type ContentSource, type Passage, type PassageKind, type Question } from '@/types';

function readingQuestion(id: string, n: number): Question {
	return {
		id,
		type: 'reading-fact',
		body: `שְׁאֵלָה ${n}: מָה כָּתוּב בְּשׁוּרָה 1?`,
		explanation: 'כָּךְ כָּתוּב בְּשׁוּרָה 1.',
		answer: { kind: 'choice', options: ['אֶחָד', 'שְׁנַיִם', 'שָׁלוֹשׁ', 'אַרְבַּע'], correctIndex: n % 4 },
	};
}

function passage(id: string, kind: PassageKind, source: ContentSource, questions: number): Passage {
	return {
		id,
		title: `קֶטַע ${id}`,
		kind,
		source,
		paragraphs: [['שׁוּרָה רִאשׁוֹנָה.', 'שׁוּרָה שְׁנִיָּה.']],
		questions: Array.from({ length: questions }, (_, i) => readingQuestion(`${id}-q${i + 1}`, i + 1)),
	};
}

export const FIXTURE_PASSAGES: Passage[] = [
	passage('test-p1', 'informational', 'official-2025', 2),
	passage('inf-1', 'informational', 'original', 6),
	passage('story-1', 'story', 'original', 6),
];

export const FIXTURE_MATH: Question[] = [
	{
		id: 'test-m1',
		type: 'exercise',
		source: 'official-2025',
		math: `52 + 28 = ${BLANK}`,
		explanation: 'עֲשָׂרוֹת וַאֲחָדוֹת.',
		answer: { kind: 'number', rule: { op: 'eq', value: 80 }, solution: 80 },
	},
	{
		id: 'test-m2',
		type: 'word-problem',
		source: 'official-2025',
		body: 'לְדָנָה 3 תַּפּוּחִים וְקִבְּלָה עוֹד 2. כַּמָּה יֵשׁ לָהּ?',
		explanation: '$3 + 2 = 5$.',
		answer: { kind: 'choice', options: ['4', '5', '6'], correctIndex: 1 },
	},
];

export const FIXTURE_TEST: BankTest = {
	id: 'test-official',
	title: 'מִבְחָן לְדֻגְמָה',
	description: 'מִבְחָן קָטָן',
	source: 'official-2025',
	sections: [
		{ instructions: 'קִרְאוּ וַעֲנוּ.', passageId: 'test-p1' },
		{ title: 'חֶשְׁבּוֹן', questionIds: ['test-m1', 'test-m2'] },
	],
};

export function fixtureItems(): BankItem[] {
	return [
		...FIXTURE_PASSAGES.map((data): BankItem => ({ id: data.id, kind: 'passage', data })),
		...FIXTURE_MATH.map((data): BankItem => ({ id: data.id, kind: 'question', data })),
		{ id: FIXTURE_TEST.id, kind: 'test', data: FIXTURE_TEST },
	];
}

export function fixtureRecords(): BankRecord[] {
	return fixtureItems().map((item) => ({ ...item, hidden: false, version: 1, updatedAt: 1 }));
}

export const fixtureBank = () => toBankContent(fixtureRecords());
