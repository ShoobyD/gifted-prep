import { ref, shallowRef, watch } from 'vue';
import { defaultProgress, parseProgress, type ProgressState } from '@/progress/state';
import { progressApiFor } from '@/sync/progressApi';
import type { ServerCopy } from '@/sync/syncEngine';
import { useChildren } from './useChildren';

// The server copy of the active child's progress, for parent devices. Kept only in memory:
// a parent device never mixes it into a local progress of its own.
const progress = shallowRef<ProgressState | null>(null);
const version = ref(0);
const updatedAt = ref<number | null>(null);
const status = ref<'idle' | 'loading' | 'failed'>('idle');
const saving = ref(false);
const error = ref('');

const MAX_ATTEMPTS = 3;

// The child the copy above belongs to.
let shownChild: string | undefined;
const api = () => progressApiFor(useChildren().activeChild.value?.id);

function parse(copy: ServerCopy): ProgressState | null {
	return copy.progress && (parseProgress(JSON.stringify(copy.progress)) ?? null);
}

function accept(copy: ServerCopy) {
	progress.value = parse(copy);
	version.value = copy.version;
	updatedAt.value = copy.updatedAt;
}

async function refresh() {
	const childId = useChildren().activeChild.value?.id;
	// Another child's numbers must never show under this one's name, even for a moment.
	if (childId !== shownChild) {
		progress.value = null;
		version.value = 0;
		updatedAt.value = null;
	}
	status.value = 'loading';
	try {
		const copy = await api().get();
		// The parent switched children while this was loading: that child's refresh wins.
		if (childId !== useChildren().activeChild.value?.id) return;
		shownChild = childId;
		accept(copy);
		status.value = 'idle';
	} catch {
		status.value = 'failed';
	}
}

// Changes the child's progress from a parent device (settings, reset, import). The change is
// an intent, applied to the newest copy: if the tablet saved meanwhile, it's applied again on
// top of the tablet's copy. The tablet then picks it up on its next sync.
async function update(change: (current: ProgressState) => ProgressState): Promise<boolean> {
	saving.value = true;
	error.value = '';
	try {
		let base = progress.value ?? defaultProgress();
		let baseVersion = version.value;
		for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
			const result = await api().put(change(base), baseVersion);
			if (result.ok) {
				accept(result.copy);
				return true;
			}
			accept(result.conflict);
			base = progress.value ?? defaultProgress();
			baseVersion = result.conflict.version;
		}
		error.value = 'השמירה לא הצליחה כי הטאבלט שומר באותו זמן. נסו שוב.';
		return false;
	} catch {
		error.value = 'אין חיבור לשרת, והשינוי לא נשמר.';
		return false;
	} finally {
		saving.value = false;
	}
}

let watching = false;

export function useRemoteProgress() {
	if (!watching) {
		watching = true;
		// Showing another child: that child's numbers.
		watch(() => useChildren().activeChild.value?.id, (id, previous) => {
			if (id !== previous) void refresh();
		});
	}
	return { progress, version, updatedAt, status, saving, error, refresh, update };
}
