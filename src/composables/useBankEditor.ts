import { ref } from 'vue';
import { bankApi, type WriteResult } from '@/content/bankApi';
import type { BankItemData } from '@/content/seed';
import type { Passage, Question } from '@/types';
import { useContent } from './useContent';
import { useContentSync } from './useContentSync';

// Writes to the question bank from a parent device. Every write names the version it was
// based on; if another device saved the item in between, nothing is overwritten.

const MAX_ATTEMPTS = 3;

const MESSAGES = {
	offline: 'אין חיבור לשרת, והשינוי לא נשמר.',
	conflict: 'מכשיר אחר שמר את הפריט הזה בינתיים, ולכן השינוי לא נשמר. שמירה נוספת תחליף את מה שנשמר שם בשינוי שלך; סגירה בלי שמירה תשאיר אותו.',
	changed: 'מכשיר אחר שמר את הפריט הזה בינתיים, ולכן הוא לא נמחק.',
	missing: 'הפריט נמחק בינתיים ממכשיר אחר.',
	busy: 'השמירה לא הצליחה כי מכשיר אחר שומר באותו זמן. נסו שוב.',
};

const saving = ref(false);
const error = ref('');

async function run(task: () => Promise<boolean>): Promise<boolean> {
	saving.value = true;
	error.value = '';
	try {
		return await task();
	} catch {
		error.value = MESSAGES.offline;
		return false;
	} finally {
		saving.value = false;
	}
}

// Brings the reply into this device's copy. After a conflict or a missing item the bank is
// fetched again, so the parent sees what is there now.
async function settle(result: WriteResult, id: string): Promise<'ok' | 'conflict' | 'missing'> {
	const sync = useContentSync();
	if (result.status === 'saved') {
		await sync.acceptWrite(result.revision, { item: result.item });
		return 'ok';
	}
	if (result.status === 'deleted') {
		await sync.acceptWrite(result.revision, { deleted: id });
		return 'ok';
	}
	await sync.refresh();
	return result.status;
}

function fail(outcome: keyof typeof MESSAGES): false {
	error.value = MESSAGES[outcome];
	return false;
}

// Saves what the parent edited, as long as nobody saved the item since it was opened at
// baseVersion (0 for a new item).
function save(kind: 'passage' | 'question', data: Passage | Question, baseVersion: number): Promise<boolean> {
	return run(async () => {
		const outcome = await settle(await bankApi.put(kind, data, baseVersion), data.id);
		return outcome === 'ok' || fail(outcome);
	});
}

function current(kind: 'passage' | 'question', id: string): Passage | Question | undefined {
	const content = useContent();
	return kind === 'passage'
		? content.everyPassage.value.find((p) => p.id === id)
		: content.everyMathQuestion.value.find((q) => q.id === id);
}

// A small change to the newest version of an item (e.g. hiding one question of a passage).
// If another device saved in between, the change is made again on top of its version.
function change<T extends Passage | Question>(kind: 'passage' | 'question', id: string, edit: (item: T) => T): Promise<boolean> {
	return run(async () => {
		for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
			const item = current(kind, id) as T | undefined;
			if (!item) return fail('missing');
			const next: BankItemData = edit(JSON.parse(JSON.stringify(item)) as T);
			const outcome = await settle(await bankApi.put(kind, next, useContent().versionOf(id)), id);
			if (outcome === 'ok') return true;
			if (outcome === 'missing') return fail(outcome);
		}
		error.value = MESSAGES.busy;
		return false;
	});
}

// Hiding is not a content change: no version check, and nothing in the history.
function setHidden(id: string, hidden: boolean): Promise<boolean> {
	return run(async () => {
		const outcome = await settle(await bankApi.setHidden(id, hidden), id);
		return outcome === 'ok' || fail(outcome);
	});
}

function remove(id: string): Promise<boolean> {
	return run(async () => {
		const outcome = await settle(await bankApi.remove(id, useContent().versionOf(id)), id);
		return outcome === 'ok' || fail(outcome === 'conflict' ? 'changed' : outcome);
	});
}

export function useBankEditor() {
	return { saving, error, save, change, setHidden, remove, history: bankApi.history };
}
