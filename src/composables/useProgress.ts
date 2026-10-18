import { computed, reactive, ref, watch } from 'vue';
import { newStickers, type Sticker } from '@/progress/stickers';
import { adoptLegacyProgress, progressKey } from '@/progress/storage';
import {
	applyAnswer,
	applyMistake,
	applySession,
	dayStreak,
	defaultProgress,
	importedProgress,
	parseProgress,
	resetProgress,
	type ProgressState,
	type SessionRecord,
} from '@/progress/state';
import type { Outcome, Question, QuestionType } from '@/types';
import { useChildren } from './useChildren';

function load(key: string): ProgressState {
	try {
		const saved = localStorage.getItem(key);
		return (saved && parseProgress(saved)) || defaultProgress();
	} catch {
		// Storage can be unavailable (private mode, blocked site data): run in memory.
		return defaultProgress();
	}
}

function adoptLegacy(id: string) {
	try {
		adoptLegacyProgress(localStorage, id);
	} catch {
		// Storage unavailable: nothing kept to move.
	}
}

// The child whose progress this is; undefined until the device knows its child (the
// progress then lives under the device's old key, and moves to the child once known).
const childId = ref(useChildren().activeChild.value?.id);
if (childId.value) adoptLegacy(childId.value);

// One shared, persisted state for the whole app: the current child's.
const state = reactive<ProgressState>(load(progressKey(childId.value)));

function save() {
	try {
		localStorage.setItem(progressKey(childId.value), JSON.stringify(state));
	} catch {
		// Not persisted; progress still works for this visit.
	}
}

watch(state, save, { deep: true });

// Keeps the levels object identity, since useLevels hands out a readonly view of it.
function replace(next: ProgressState) {
	const { levels, ...rest } = next;
	Object.assign(state, rest);
	Object.assign(state.levels, levels);
}

// Makes another child's progress the current one. The device's old progress, if it never
// had a child, becomes this child's. Callers make sure no sync is running (see useSync).
function switchTo(id: string) {
	if (id === childId.value) return;
	save();
	adoptLegacy(id);
	childId.value = id;
	replace(load(progressKey(id)));
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
		replace(importedProgress(state, parsed));
		return true;
	}

	function reset() {
		replace(resetProgress(state));
	}

	return { state, childId, streak, recordAnswer, recordMistake, finishSession, exportJson, importJson, reset, replace, switchTo };
}
