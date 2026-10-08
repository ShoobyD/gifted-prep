// Progress model and pure update logic; persistence lives in useProgress.
import type { Level, MathQuestionType, Outcome, QuestionType } from '@/types';

export const STORAGE_KEY = 'gifted-prep:progress';
export const PROGRESS_VERSION = 1;
const MAX_SESSIONS = 300;

export interface TypeStats {
	first: number;
	second: number;
	failed: number;
}

export interface SessionRecord {
	// ISO timestamp of the end of the session.
	at: string;
	set: string;
	correct: number;
	total: number;
	stars: number;
	seconds: number;
}

export interface ProgressState {
	version: number;
	stars: number;
	stickers: string[];
	// Local dates (YYYY-MM-DD) with at least one finished session, sorted.
	practiceDays: string[];
	typeStats: Partial<Record<QuestionType, TypeStats>>;
	levels: Record<MathQuestionType, Level>;
	// Best correct count per reading passage id.
	passages: Record<string, number>;
	sessions: SessionRecord[];
}

export function defaultProgress(): ProgressState {
	return {
		version: PROGRESS_VERSION,
		stars: 0,
		stickers: [],
		practiceDays: [],
		typeStats: {},
		levels: {
			'exercise': 1,
			'missing-number': 1,
			'inequality': 1,
			'word-problem': 1,
			'picture-riddle': 1,
			'symbol-digit': 1,
		},
		passages: {},
		sessions: [],
	};
}

// Tolerates missing fields from older or hand-edited data; rejects anything that isn't ours.
export function parseProgress(json: string): ProgressState | undefined {
	try {
		const data: unknown = JSON.parse(json);
		if (!data || typeof data !== 'object' || (data as ProgressState).version !== PROGRESS_VERSION) return undefined;
		const defaults = defaultProgress();
		const parsed = data as Partial<ProgressState>;
		return { ...defaults, ...parsed, levels: { ...defaults.levels, ...parsed.levels } };
	} catch {
		return undefined;
	}
}

export function starsFor(outcome: Outcome): number {
	return outcome === 'first' ? 2 : outcome === 'second' ? 1 : 0;
}

export function localDate(date: Date): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function applyAnswer(state: ProgressState, type: QuestionType, outcome: Outcome): void {
	const stats = state.typeStats[type] ?? { first: 0, second: 0, failed: 0 };
	stats[outcome]++;
	state.typeStats[type] = stats;
	state.stars += starsFor(outcome);
}

export function applySession(state: ProgressState, record: SessionRecord, passageId?: string): void {
	state.sessions.push(record);
	if (state.sessions.length > MAX_SESSIONS) state.sessions.splice(0, state.sessions.length - MAX_SESSIONS);

	const day = localDate(new Date(record.at));
	if (!state.practiceDays.includes(day)) state.practiceDays = [...state.practiceDays, day].sort();

	if (passageId) state.passages[passageId] = Math.max(state.passages[passageId] ?? 0, record.correct);
}

// Consecutive practice days ending today, or yesterday (the streak isn't lost until a day is missed).
export function dayStreak(practiceDays: string[], today: Date): number {
	const days = new Set(practiceDays);
	const cursor = new Date(today);
	if (!days.has(localDate(cursor))) cursor.setDate(cursor.getDate() - 1);
	let streak = 0;
	while (days.has(localDate(cursor))) {
		streak++;
		cursor.setDate(cursor.getDate() - 1);
	}
	return streak;
}

export function successRate(stats: TypeStats | undefined): number | undefined {
	if (!stats) return undefined;
	const total = stats.first + stats.second + stats.failed;
	return total ? (stats.first + stats.second) / total : undefined;
}

export function attempts(stats: TypeStats | undefined): number {
	return stats ? stats.first + stats.second + stats.failed : 0;
}
