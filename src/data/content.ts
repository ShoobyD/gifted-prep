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
	'other': 'אַחֵר',
};

// Material from tests and prep sites, as opposed to passages written for practice.
export function isTestMaterial(source: ContentSource): boolean {
	return source !== 'original' && source !== 'other';
}

// The built-in content, as shipped in the app. Screens read it through useContent(),
// which applies the parent's changes on top.

// Real test material first, then prep-site samples, then originals.
export const BASE_PASSAGES: Passage[] = [
	...official2025Passages,
	...officialSamplePassages,
	...noamPassages,
	...gaonchikPassages,
	...informationalPassages,
	...storyPassages,
];

const mathOf = (test: { sections: { passage?: Passage; questions: Question[] }[] }) =>
	test.sections.filter((s) => !s.passage).flatMap((s) => s.questions);

// Copies tagged with where they came from (an explicit source on a question wins).
const fromSource = (source: ContentSource, questions: Question[]): Question[] =>
	questions.map((q) => ({ ...q, source: q.source ?? source }));

// Math items from real and sample tests, practiced as a pool.
export const BASE_MATH_QUESTIONS: Question[] = [
	...fromSource('official-2025', mathOf(official2025)),
	...fromSource('official-sample', mathOf(officialSample)),
	...fromSource('noam', mathOf(noamTest)),
	...fromSource('gaonchik', gaonchikMath),
];
