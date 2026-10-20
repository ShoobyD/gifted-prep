// Progress model and pure update logic; persistence lives in useProgress (keys: storage.ts).
import type { Level, MathQuestionType, Outcome, Question, QuestionType } from '@/types';

export const PROGRESS_VERSION = 1;
const MAX_SESSIONS = 300;
const MAX_MISTAKES = 60;

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
	settings: Settings;
	// Questions to practice again, oldest first.
	mistakes: MistakeEntry[];
	// How many mistakes were later answered right on the first try.
	mistakesFixed: number;
	// Bumped by every reset or import. A newer generation replaces the progress on every
	// device instead of being merged with it, so a reset can't be undone by old data.
	generation: number;
	// What the child's tablet reported about itself, for the parent's settings screen.
	device?: DeviceReport;
}

export interface DeviceReport {
	// The Hebrew text-to-speech voice found on the tablet, or null if there is none.
	hebrewVoice: string | null;
	reportedAt: number;
}

// A full copy of the question, since generated questions can't be recreated from an id.
export interface MistakeEntry {
	key: string;
	question: Question;
	// Reading questions are shown next to their passage.
	passageId?: string;
	at: string;
}

export interface Settings {
	// Speaker buttons for math questions and explanations.
	speech: boolean;
	// When the settings last changed (any device), so merging keeps the newer ones.
	updatedAt?: number;
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
		settings: { speech: true },
		mistakes: [],
		mistakesFixed: 0,
		generation: 0,
	};
}

// Tolerates missing fields from older or hand-edited data; rejects anything that isn't ours.
export function parseProgress(json: string): ProgressState | undefined {
	try {
		return normalizeProgress(JSON.parse(json));
	} catch {
		return undefined;
	}
}

// The same for data already parsed, e.g. a copy the server sent.
export function normalizeProgress(data: unknown): ProgressState | undefined {
	if (!data || typeof data !== 'object' || (data as ProgressState).version !== PROGRESS_VERSION) return undefined;
	const defaults = defaultProgress();
	const parsed = data as Partial<ProgressState>;
	return {
		...defaults,
		...parsed,
		levels: { ...defaults.levels, ...parsed.levels },
		settings: { ...defaults.settings, ...parsed.settings },
	};
}

// A fresh start (reset), one generation after the current progress. Settings and the
// tablet's report aren't progress, so they stay.
export function resetProgress(current: ProgressState): ProgressState {
	return { ...defaultProgress(), generation: current.generation + 1, settings: current.settings, device: current.device };
}

// Imported progress replaces the current one, as a new generation.
export function importedProgress(current: ProgressState, imported: ProgressState): ProgressState {
	return { ...imported, generation: Math.max(current.generation, imported.generation) + 1 };
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

// Identifies a question by its content (generated ids restart on every app load);
// the passage tells apart identical reading questions on different texts.
export function mistakeKey(question: Question, passageId?: string): string {
	return [passageId ?? '', question.type, question.body ?? '', question.math ?? '', (question.lines ?? []).join(';')].join('|');
}

// A first-try answer clears the question from the list; any other outcome (re)adds it at the end.
export function applyMistake(
	state: ProgressState,
	question: Question,
	outcome: Outcome,
	passageId: string | undefined,
	at: string,
): void {
	const key = mistakeKey(question, passageId);
	const index = state.mistakes.findIndex((m) => m.key === key);
	if (index >= 0) state.mistakes.splice(index, 1);
	if (outcome === 'first') {
		if (index >= 0) state.mistakesFixed++;
		return;
	}
	state.mistakes.push({ key, question, passageId, at });
	if (state.mistakes.length > MAX_MISTAKES) state.mistakes.splice(0, state.mistakes.length - MAX_MISTAKES);
}
