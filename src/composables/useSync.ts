import { reactive, ref, toRaw, watch } from 'vue';
import { parseProgress, type ProgressState } from '@/progress/state';
import { metaKey } from '@/progress/storage';
import { progressApiFor } from '@/sync/progressApi';
import { createSyncEngine, type SyncMeta, type SyncStatus } from '@/sync/syncEngine';
import { useChildren } from './useChildren';
import { useDevice } from './useDevice';
import { useProgress } from './useProgress';
import { useSession } from './useSession';

// Waits for a pause in answering before sending, instead of a request per tap.
const PUSH_DELAY_MS = 4000;
// While changes are pending and the server can't be reached.
const RETRY_MS = 60_000;

const emptyMeta = (): SyncMeta => ({ serverVersion: 0, dirty: false, lastSyncedAt: null });

function loadMeta(childId: string | undefined): SyncMeta {
	try {
		const saved = JSON.parse(localStorage.getItem(metaKey(childId)) ?? 'null') as Partial<SyncMeta> | null;
		return { ...emptyMeta(), ...saved };
	} catch {
		return emptyMeta();
	}
}

// The sync state of the current child (each child has its own, next to its progress).
const meta = reactive<SyncMeta>(loadMeta(useProgress().childId.value));
const status = ref<SyncStatus>('idle');
let initialized = false;

function saveMeta() {
	try {
		localStorage.setItem(metaKey(useProgress().childId.value), JSON.stringify(meta));
	} catch {
		// Storage unavailable: pending changes are still tracked for this visit.
	}
}

// An engine for one child: its server copy, and what this device last agreed with it.
function engineFor(childId: string | undefined) {
	return createSyncEngine({
		api: progressApiFor(childId),
		// A plain copy: the engine compares and sends it, and must not hold the reactive proxy.
		read: () => JSON.parse(JSON.stringify(toRaw(useProgress().state))) as ProgressState,
		write: (progress) => {
			// Fills in fields an older copy may lack, the same way an import does.
			const parsed = parseProgress(JSON.stringify(progress));
			if (parsed) useProgress().replace(parsed);
		},
		meta,
		saveMeta,
		onStatus: (s) => (status.value = s),
	});
}

let engine = engineFor(useProgress().childId.value);
let pushTimer: ReturnType<typeof setTimeout> | undefined;
// Set while switching children: syncing waits until the new child is in place.
let switching: Promise<void> | undefined;

// Talks to the server only behind its login (not in plain dev, offline, or logged out),
// and only from the child's device: a parent device never writes.
const canSync = () => useSession().authenticated.value === true && useDevice().isChild.value;

async function sync() {
	await switching;
	if (canSync()) await engine.sync();
}

function init() {
	if (initialized) return;
	initialized = true;
	const session = useSession();
	const device = useDevice();
	const progress = useProgress();

	// Another child takes the device (or the device learns its child): first finish what
	// the current child has pending, so nothing ends up with the wrong child; then move to
	// the new child's progress and sync state.
	async function switchTo(childId: string) {
		if (childId === progress.childId.value) return;
		clearTimeout(pushTimer);
		if (canSync()) await engine.sync();
		saveMeta();
		progress.switchTo(childId);
		Object.assign(meta, loadMeta(childId));
		engine = engineFor(childId);
	}

	watch(() => useChildren().activeChild.value?.id, (childId) => {
		if (!childId) return;
		switching = (switching ?? Promise.resolve()).then(() => switchTo(childId)).finally(() => {
			switching = undefined;
			void sync();
		});
	}, { immediate: true });

	// Changes are tracked even without a server (e.g. the app opened offline), so they
	// are marked pending and sent once the server is reachable.
	watch(progress.state, () => {
		if (switching) return;
		engine.markChanged();
		if (!meta.dirty) return;
		clearTimeout(pushTimer);
		pushTimer = setTimeout(sync, PUSH_DELAY_MS);
	}, { deep: true });

	// First confirmation of the login (on start, or after coming back online),
	// or the device was just chosen as the child's.
	watch([session.authenticated, device.role], () => void sync(), { immediate: true });

	window.addEventListener('online', () => {
		if (session.authenticated.value) void sync();
		else void session.check();
	});
	// Coming back to the app: pick up anything newer and send anything pending.
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') void sync();
	});
	setInterval(() => {
		if (meta.dirty) void sync();
	}, RETRY_MS);
}

export function useSync() {
	init();
	return { meta, status, syncNow: sync };
}
