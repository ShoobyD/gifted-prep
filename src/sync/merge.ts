import type { MistakeEntry, ProgressState, SessionRecord, TypeStats } from '@/progress/state';
import type { QuestionType } from '@/types';

// Combines two copies that both changed since they last agreed (e.g. the tablet worked
// offline while another device wrote). Nothing the child earned may be lost, so every
// field takes the union or the maximum; local wins only for settings.

const MAX_SESSIONS = 300;
const MAX_MISTAKES = 60;

const sessionKey = (s: SessionRecord) => `${s.at}|${s.set}`;

function unionSessions(a: SessionRecord[], b: SessionRecord[]): SessionRecord[] {
	const byKey = new Map([...a, ...b].map((s) => [sessionKey(s), s]));
	return [...byKey.values()].sort((x, y) => x.at.localeCompare(y.at)).slice(-MAX_SESSIONS);
}

function maxStats(a: TypeStats | undefined, b: TypeStats | undefined): TypeStats | undefined {
	if (!a || !b) return a ?? b;
	return { first: Math.max(a.first, b.first), second: Math.max(a.second, b.second), failed: Math.max(a.failed, b.failed) };
}

// Per question, the most recent entry; oldest first, as the review list expects.
function unionMistakes(a: MistakeEntry[], b: MistakeEntry[]): MistakeEntry[] {
	const byKey = new Map<string, MistakeEntry>();
	for (const entry of [...a, ...b]) {
		const existing = byKey.get(entry.key);
		if (!existing || existing.at < entry.at) byKey.set(entry.key, entry);
	}
	return [...byKey.values()].sort((x, y) => x.at.localeCompare(y.at)).slice(-MAX_MISTAKES);
}

function maxRecord<K extends string>(a: Partial<Record<K, number>>, b: Partial<Record<K, number>>): Partial<Record<K, number>> {
	const result: Partial<Record<K, number>> = { ...a };
	for (const [key, value] of Object.entries(b) as [K, number][]) result[key] = Math.max(result[key] ?? 0, value);
	return result;
}

export function mergeProgress(local: ProgressState, remote: ProgressState): ProgressState {
	const types = new Set([...Object.keys(local.typeStats), ...Object.keys(remote.typeStats)]) as Set<QuestionType>;
	const typeStats: ProgressState['typeStats'] = {};
	for (const type of types) {
		const merged = maxStats(local.typeStats[type], remote.typeStats[type]);
		if (merged) typeStats[type] = merged;
	}

	return {
		...local,
		stars: Math.max(local.stars, remote.stars),
		stickers: [...new Set([...local.stickers, ...remote.stickers])],
		practiceDays: [...new Set([...local.practiceDays, ...remote.practiceDays])].sort(),
		typeStats,
		levels: maxRecord(local.levels, remote.levels) as ProgressState['levels'],
		passages: maxRecord(local.passages, remote.passages) as ProgressState['passages'],
		sessions: unionSessions(local.sessions, remote.sessions),
		mistakes: unionMistakes(local.mistakes, remote.mistakes),
		mistakesFixed: Math.max(local.mistakesFixed, remote.mistakesFixed),
		settings: local.settings,
	};
}
