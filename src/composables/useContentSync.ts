import { ref, watch } from 'vue';
import { bankApi } from '@/content/bankApi';
import { parseSnapshot, toBankContent, type BankSnapshot } from '@/content/bankContent';
import { contentApi, type ContentCopy } from '@/content/contentApi';
import { emptyOverrides, parseOverrides } from '@/content/overrides';
import { useContent } from './useContent';
import { useSession } from './useSession';

// Brings the question bank, and the parent's changes to it, to every device. The last copy
// of each is kept locally, so they apply offline and from the first moment the app opens.
// Until the bank has loaded once, the content built into the app is used.

const CACHE_KEY = 'gifted-prep:content';
const BANK_CACHE_KEY = 'gifted-prep:bank';

interface CachedContent {
	overrides: unknown;
	version: number;
	updatedAt: number | null;
}

// The server version the local copy matches (0: never fetched). Writes in the question bank
// are based on it.
const version = ref(0);
const updatedAt = ref<number | null>(null);
// The bank revision this device has (0: still the built-in content).
const bankRevision = ref(0);
const status = ref<'idle' | 'loading' | 'failed'>('idle');
let initialized = false;

function apply(copy: CachedContent): boolean {
	// Nothing saved on the server yet means no changes.
	const overrides = copy.overrides === null ? emptyOverrides() : parseOverrides(copy.overrides);
	if (!overrides) return false;
	useContent().overrides.value = overrides;
	version.value = copy.version;
	updatedAt.value = copy.updatedAt;
	return true;
}

// Revision 0 is a bank nobody has loaded content into yet: the built-in content stays.
function applyBank(snapshot: BankSnapshot): boolean {
	if (snapshot.revision < 1) return false;
	useContent().bank.value = toBankContent(snapshot.items);
	bankRevision.value = snapshot.revision;
	return true;
}

function readCache(key: string): unknown {
	try {
		return JSON.parse(localStorage.getItem(key) ?? 'null');
	} catch {
		return null;
	}
}

function loadCache() {
	// No usable cache: the built-in content is used until the server answers.
	const snapshot = parseSnapshot(readCache(BANK_CACHE_KEY));
	if (snapshot) applyBank(snapshot);
	const cached = readCache(CACHE_KEY) as CachedContent | null;
	if (cached) apply(cached);
}

function saveCache(key: string, copy: unknown) {
	try {
		localStorage.setItem(key, JSON.stringify(copy));
	} catch {
		// Not cached; fetched again next time.
	}
}

// Takes a copy that came from the server (a fetch, or a save in the question bank).
function accept(copy: ContentCopy) {
	if (apply(copy)) saveCache(CACHE_KEY, copy);
}

async function refreshBank() {
	// Only asks for the whole bank when it changed since this device's copy.
	const snapshot = await bankApi.get(bankRevision.value || undefined);
	if (snapshot && applyBank(snapshot)) saveCache(BANK_CACHE_KEY, snapshot);
}

async function refresh() {
	status.value = 'loading';
	try {
		const [, copy] = await Promise.all([refreshBank(), contentApi.get()]);
		accept(copy);
		status.value = 'idle';
	} catch {
		status.value = 'failed';
	}
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
	return { version, updatedAt, bankRevision, status, refresh, accept };
}
