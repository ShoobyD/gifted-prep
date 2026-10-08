import type { ContentSource, Passage, Question } from '@/types';
import { gaonchikMath, gaonchikPassages } from './gaonchik';
import { noamPassages, noamTest } from './noam';
import { official2025, official2025Passages } from './official2025';
import { officialSample, officialSamplePassages } from './officialSample';
import { informationalPassages } from './reading/informational';
import { storyPassages } from './reading/stories';

export const SOURCE_LABELS: Record<ContentSource, string> = {
	'official-2025': 'מִבְחָן 2025',
	'official-sample': 'דֻּגְמָה רִשְׁמִית',
	'noam': 'מָכוֹן נֹעַם',
	'gaonchik': 'אֲתָרֵי הֲכָנָה',
	'original': 'מְקוֹרִי',
};

// Real test material first, then prep-site samples, then originals.
export const ALL_PASSAGES: Passage[] = [
	...official2025Passages,
	...officialSamplePassages,
	...noamPassages,
	...gaonchikPassages,
	...informationalPassages,
	...storyPassages,
];

export function findPassage(id: string): Passage | undefined {
	return ALL_PASSAGES.find((p) => p.id === id);
}

const mathOf = (test: { sections: { passage?: Passage; questions: Question[] }[] }) =>
	test.sections.filter((s) => !s.passage).flatMap((s) => s.questions);

// Math items from real and sample tests, practiced as a pool.
export const REAL_MATH_QUESTIONS: Question[] = [
	...mathOf(official2025),
	...mathOf(officialSample),
	...mathOf(noamTest),
	...gaonchikMath,
];
