import { computed, shallowRef, ref, watch } from 'vue';
import { bankApi } from '@/content/bankApi';
import { parseSnapshot, toBankContent, type BankRecord, type BankSnapshot } from '@/content/bankContent';
import { useContent } from './useContent';
import { useSession } from './useSession';

// Brings the question bank to every device. The last copy is kept locally, so it works
// offline and from the first moment the app opens. A device that never loaded it has no
// passages or real-test questions yet (generated math still works).

const CACHE_KEY = 'gifted-prep:bank';
// Where the parent's changes were kept before they moved into the bank.
const OLD_CACHE_KEY = 'gifted-prep:content';

const snapshot = shallowRef<BankSnapshot>();
// The bank revision this device has (0: never loaded).
const bankRevision = computed(() => snapshot.value?.revision ?? 0);
const status = ref<'idle' | 'loading' | 'failed'>('idle');
let initialized = false;

// Revision 0 is a bank nobody has loaded content into yet.
function store(next: BankSnapshot) {
	if (next.revision < 1) return;
	snapshot.value = next;
	useContent().bank.value = toBankContent(next.items);
	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify(next));
	} catch {
		// Not cached; fetched again next time.
	}
}

function loadCache() {
	try {
		localStorage.removeItem(OLD_CACHE_KEY);
		const cached = parseSnapshot(JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null'));
		if (cached) store(cached);
	} catch {
		// No usable cache: the bank stays empty until the server answers.
	}
}

async function refresh() {
	status.value = 'loading';
	try {
		// Only asks for the whole bank when it changed since this device's copy.
		const next = await bankApi.get(bankRevision.value || undefined);
		if (next) store(next);
		status.value = 'idle';
	} catch {
		status.value = 'failed';
	}
}

// Takes the server's reply to a write made on this device, without fetching the whole
// bank again, as long as nothing else changed in between (otherwise fetches it).
async function acceptWrite(revision: number, change: { item: BankRecord } | { deleted: string }) {
	const current = snapshot.value;
	if (!current || revision !== current.revision + 1) {
		await refresh();
		return;
	}
	const id = 'item' in change ? change.item.id : change.deleted;
	const index = current.items.findIndex((item) => item.id === id);
	const items = current.items.filter((item) => item.id !== id);
	// An edited item keeps its place; a new one goes last, as on the server.
	if ('item' in change) items.splice(index === -1 ? items.length : index, 0, change.item);
	store({ revision, items });
}

function init() {
	if (initialized) return;
	initialized = true;
	loadCache();

	const session = useSession();
	const refreshIfOnline = () => {
		if (session.authenticated.value) void refresh();
	};
	watch(session.authenticated, refreshIfOnline, { immediate: true });
	window.addEventListener('online', refreshIfOnline);
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') refreshIfOnline();
	});
}

export function useContentSync() {
	init();
	return { bankRevision, status, refresh, acceptWrite };
}
