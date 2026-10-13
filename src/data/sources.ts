import type { ContentSource } from '@/types';

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
