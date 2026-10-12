import { useContent } from '@/composables/useContent';
import { MATH_GENERATORS } from '@/generators';
import { pick } from '@/generators/random';
import type { Level, MathQuestionType, MockTest, Passage, PassageKind, Question, TestSection } from '@/types';
import { isTestMaterial } from './content';
import { noamTest } from './noam';
import { official2025 } from './official2025';
import { officialSample } from './officialSample';

export interface MockTestEntry {
	id: string;
	title: string;
	description: string;
	build(): MockTest;
}

const READING_INSTRUCTIONS = 'קִרְאוּ אֶת הַקֶּטַע וְעִנּוּ עַל הַשְּׁאֵלוֹת שֶׁאַחֲרָיו.';

function readingSection(passage: Passage): TestSection {
	return { title: passage.title, instructions: READING_INSTRUCTIONS, passage, questions: passage.questions };
}

// One question per listed level, so each task goes from easy to hard like the booklet.
function generate(type: MathQuestionType, levels: Level[]): Question[] {
	return levels.map((level) => MATH_GENERATORS[type](level, Math.random));
}

// A passage written for practice (built-in originals and ones the parent added) rather
// than a real test's own; hidden ones left out. Falls back to any passage of the kind if
// the parent hid them all, and to none if there is nothing at all.
function practiceSection(kind: PassageKind): TestSection[] {
	const ofKind = useContent().passages.value.filter((p) => p.kind === kind);
	const preferred = ofKind.filter((p) => !isTestMaterial(p.source));
	const pool = preferred.length ? preferred : ofKind;
	return pool.length ? [readingSection(pick(Math.random, pool))] : [];
}

// A fresh test in the structure of the 2025 booklet: two passages (informational, story)
// with 6 questions each, then math tasks א–ד with 3 + 5 + 3 + 3 items.
function buildGenerated(): MockTest {
	return {
		id: 'generated',
		title: 'מִבְחָן חָדָשׁ',
		source: 'original',
		sections: [
			...practiceSection('informational'),
			...practiceSection('story'),
			{ title: 'מְשִׂימָה א׳: תַּרְגִּילִים', questions: generate('exercise', [1, 2, 3]) },
			{
				title: 'מְשִׂימָה ב׳: הַמִּסְפָּר הֶחָסֵר',
				questions: [...generate('missing-number', [1, 2, 3]), ...generate('inequality', [2, 3])],
			},
			{ title: 'מְשִׂימָה ג׳: בְּעָיוֹת מִלּוּלִיּוֹת', questions: generate('word-problem', [1, 2, 3]) },
			{ title: 'מְשִׂימָה ד׳: חִידוֹת בְּצִיּוּרִים', questions: generate('picture-riddle', [1, 2, 3]) },
		],
	};
}

export const MOCK_TESTS: MockTestEntry[] = [
	{
		id: 'generated',
		title: 'מִבְחָן חָדָשׁ',
		description: 'בְּכָל פַּעַם מִבְחָן אַחֵר, בַּמִּבְנֶה שֶׁל מִבְחַן 2025',
		build: buildGenerated,
	},
	{
		id: official2025.id,
		title: official2025.title,
		description: 'הַמִּבְחָן הָאֲמִתִּי מִשְּׁנַת 2025',
		build: () => useContent().applyToTest(official2025),
	},
	{
		id: officialSample.id,
		title: officialSample.title,
		description: 'מִבְחָן קָצָר מֵחוֹבֶרֶת הַדֻּגְמָאוֹת שֶׁל מִשְׂרַד הַחִנּוּךְ',
		build: () => useContent().applyToTest(officialSample),
	},
	{
		id: noamTest.id,
		title: noamTest.title,
		description: 'מִבְחָן לְדֻגְמָה שֶׁל מָכוֹן לְהָכָנָה',
		build: () => useContent().applyToTest(noamTest),
	},
];

export function findMockTest(id: string): MockTestEntry | undefined {
	return MOCK_TESTS.find((t) => t.id === id);
}
