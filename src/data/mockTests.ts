import { MATH_GENERATORS } from '@/generators';
import { pick } from '@/generators/random';
import type { Level, MathQuestionType, MockTest, Passage, Question, TestSection } from '@/types';
import { noamTest } from './noam';
import { official2025 } from './official2025';
import { officialSample } from './officialSample';
import { informationalPassages } from './reading/informational';
import { storyPassages } from './reading/stories';

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

// A fresh test in the structure of the 2025 booklet: two passages (informational, story)
// with 6 questions each, then math tasks א–ד with 3 + 5 + 3 + 3 items.
function buildGenerated(): MockTest {
	return {
		id: 'generated',
		title: 'מִבְחָן חָדָשׁ',
		source: 'original',
		sections: [
			readingSection(pick(Math.random, informationalPassages)),
			readingSection(pick(Math.random, storyPassages)),
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
		build: () => official2025,
	},
	{
		id: officialSample.id,
		title: officialSample.title,
		description: 'מִבְחָן קָצָר מֵחוֹבֶרֶת הַדֻּגְמָאוֹת שֶׁל מִשְׂרַד הַחִנּוּךְ',
		build: () => officialSample,
	},
	{
		id: noamTest.id,
		title: noamTest.title,
		description: 'מִבְחָן לְדֻגְמָה שֶׁל מָכוֹן לְהָכָנָה',
		build: () => noamTest,
	},
];

export function findMockTest(id: string): MockTestEntry | undefined {
	return MOCK_TESTS.find((t) => t.id === id);
}
