import { ref, shallowRef } from 'vue';
import { defaultProgress, parseProgress, type ProgressState } from '@/progress/state';
import { progressApiFor } from '@/sync/progressApi';
import type { ServerCopy } from '@/sync/syncEngine';

// The server copy of the child's progress, for parent devices. Kept only in memory: a
// parent device never mixes it into a local progress of its own.
const progress = shallowRef<ProgressState | null>(null);
const version = ref(0);
const updatedAt = ref<number | null>(null);
const status = ref<'idle' | 'loading' | 'failed'>('idle');
const saving = ref(false);
const error = ref('');

const MAX_ATTEMPTS = 3;

// The family's first child (choosing another comes with managing children).
const progressApi = progressApiFor(undefined);

function parse(copy: ServerCopy): ProgressState | null {
	return copy.progress && (parseProgress(JSON.stringify(copy.progress)) ?? null);
}

function accept(copy: ServerCopy) {
	progress.value = parse(copy);
	version.value = copy.version;
	updatedAt.value = copy.updatedAt;
}

async function refresh() {
	status.value = 'loading';
	try {
		accept(await progressApi.get());
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
			const result = await progressApi.put(change(base), baseVersion);
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

export function useRemoteProgress() {
	return { progress, version, updatedAt, status, saving, error, refresh, update };
}
