import { readonly } from 'vue';
import type { Level, MathQuestionType, Outcome } from '@/types';
import { useProgress } from './useProgress';

const LEVEL_UP_STREAK = 3;
const LEVEL_DOWN_STREAK = 2;
const MAX_LEVEL: Level = 3;

// Levels are persisted with the progress; streaks only matter within a visit.
const streaks = new Map<MathQuestionType, { right: number; wrong: number }>();

// 3 first-try answers in a row → level up; 2 failures in a row → level down.
// A correct second try keeps the level and resets both streaks.
export function recordOutcome(type: MathQuestionType, outcome: Outcome) {
	const { levels } = useProgress().state;
	const streak = streaks.get(type) ?? { right: 0, wrong: 0 };
	if (outcome === 'first') {
		streak.right++;
		streak.wrong = 0;
	} else if (outcome === 'failed') {
		streak.wrong++;
		streak.right = 0;
	} else {
		streak.right = 0;
		streak.wrong = 0;
	}

	if (streak.right >= LEVEL_UP_STREAK) {
		levels[type] = Math.min(levels[type] + 1, MAX_LEVEL) as Level;
		streak.right = 0;
	} else if (streak.wrong >= LEVEL_DOWN_STREAK) {
		levels[type] = Math.max(levels[type] - 1, 1) as Level;
		streak.wrong = 0;
	}
	streaks.set(type, streak);
}

export function useLevels() {
	return { levels: readonly(useProgress().state.levels), recordOutcome };
}
