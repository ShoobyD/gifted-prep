import { computed, reactive, watch } from 'vue';
import { newStickers, type Sticker } from '@/progress/stickers';
import {
	applyAnswer,
	applyMistake,
	applySession,
	dayStreak,
	defaultProgress,
	parseProgress,
	STORAGE_KEY,
	type ProgressState,
	type SessionRecord,
} from '@/progress/state';
import type { Outcome, Question, QuestionType } from '@/types';

function load(): ProgressState {
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		return (saved && parseProgress(saved)) || defaultProgress();
	} catch {
		// Storage can be unavailable (private mode, blocked site data): run in memory.
		return defaultProgress();
	}
}

// One shared, persisted state for the whole app.
const state = reactive<ProgressState>(load());

watch(
	state,
	() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		} catch {
			// Not persisted; progress still works for this visit.
		}
	},
	{ deep: true },
);

// Keeps the levels object identity, since useLevels hands out a readonly view of it.
function replace(next: ProgressState) {
	const { levels, ...rest } = next;
	Object.assign(state, rest);
	Object.assign(state.levels, levels);
}

export function useProgress() {
	const streak = computed(() => dayStreak(state.practiceDays, new Date()));

	function recordAnswer(type: QuestionType, outcome: Outcome) {
		applyAnswer(state, type, outcome);
	}

	function recordMistake(question: Question, outcome: Outcome, passageId?: string) {
		applyMistake(state, question, outcome, passageId, new Date().toISOString());
	}

	// Saves the session and returns any stickers it unlocked.
	function finishSession(record: SessionRecord, passageId?: string): Sticker[] {
		applySession(state, record, passageId);
		const earned = newStickers(state, record, new Date());
		state.stickers.push(...earned.map((s) => s.id));
		return earned;
	}

	function exportJson(): string {
		return JSON.stringify(state, null, '\t');
	}

	// Returns false when the file isn't a valid progress export.
	function importJson(json: string): boolean {
		const parsed = parseProgress(json);
		if (!parsed) return false;
		replace(parsed);
		return true;
	}

	function reset() {
		replace(defaultProgress());
	}

	return { state, streak, recordAnswer, recordMistake, finishSession, exportJson, importJson, reset };
}
