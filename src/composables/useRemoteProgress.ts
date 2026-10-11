import { ref, shallowRef } from 'vue';
import { parseProgress, type ProgressState } from '@/progress/state';
import { progressApi } from '@/sync/progressApi';

// The server copy of the child's progress, for parent devices. Kept only in memory:
// a parent device never writes, and never mixes it into its own local progress.
const progress = shallowRef<ProgressState | null>(null);
const updatedAt = ref<number | null>(null);
const status = ref<'idle' | 'loading' | 'failed'>('idle');

async function refresh() {
	status.value = 'loading';
	try {
		const copy = await progressApi.get();
		progress.value = copy.progress && (parseProgress(JSON.stringify(copy.progress)) ?? null);
		updatedAt.value = copy.updatedAt;
		status.value = 'idle';
	} catch {
		status.value = 'failed';
	}
}

export function useRemoteProgress() {
	return { progress, updatedAt, status, refresh };
}
