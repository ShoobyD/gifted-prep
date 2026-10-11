import { reactive, ref, toRaw, watch } from 'vue';
import { parseProgress, type ProgressState } from '@/progress/state';
import { progressApi } from '@/sync/progressApi';
import { createSyncEngine, type SyncMeta, type SyncStatus } from '@/sync/syncEngine';
import { useDevice } from './useDevice';
import { useProgress } from './useProgress';
import { useSession } from './useSession';

const META_KEY = 'gifted-prep:sync';
// Waits for a pause in answering before sending, instead of a request per tap.
const PUSH_DELAY_MS = 4000;
// While changes are pending and the server can't be reached.
const RETRY_MS = 60_000;

function loadMeta(): SyncMeta {
	try {
		const saved = JSON.parse(localStorage.getItem(META_KEY) ?? 'null') as Partial<SyncMeta> | null;
		return { serverVersion: 0, dirty: false, lastSyncedAt: null, ...saved };
	} catch {
		return { serverVersion: 0, dirty: false, lastSyncedAt: null };
	}
}

const meta = reactive<SyncMeta>(loadMeta());
const status = ref<SyncStatus>('idle');
let initialized = false;

function saveMeta() {
	try {
		localStorage.setItem(META_KEY, JSON.stringify(meta));
	} catch {
		// Storage unavailable: pending changes are still tracked for this visit.
	}
}

const engine = createSyncEngine({
	api: progressApi,
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

let pushTimer: ReturnType<typeof setTimeout> | undefined;

function init() {
	if (initialized) return;
	initialized = true;
	const session = useSession();
	const device = useDevice();
	// Talks to the server only behind its login (not in plain dev, offline, or logged out),
	// and only from the child's device: a parent device never writes.
	const sync = () => {
		if (session.authenticated.value && device.isChild.value) void engine.sync();
	};

	// Changes are tracked even without a server (e.g. the app opened offline), so they
	// are marked pending and sent once the server is reachable.
	watch(useProgress().state, () => {
		engine.markChanged();
		if (!meta.dirty) return;
		clearTimeout(pushTimer);
		pushTimer = setTimeout(sync, PUSH_DELAY_MS);
	}, { deep: true });

	// First confirmation of the login (on start, or after coming back online),
	// or the device was just chosen as the child's.
	watch([session.authenticated, device.role], sync, { immediate: true });

	window.addEventListener('online', () => {
		if (session.authenticated.value) sync();
		else void session.check();
	});
	// Coming back to the app: pick up anything newer and send anything pending.
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') sync();
	});
	setInterval(() => {
		if (meta.dirty) sync();
	}, RETRY_MS);
}

export function useSync() {
	init();
	return { meta, status, syncNow: () => engine.sync() };
}
