import { ref, watch } from 'vue';
import { contentApi, type ContentCopy } from '@/content/contentApi';
import { emptyOverrides, parseOverrides } from '@/content/overrides';
import { useContent } from './useContent';
import { useSession } from './useSession';

// Brings the parent's question-bank changes to every device. The last copy is kept
// locally, so the changes apply offline and from the first moment the app opens.

const CACHE_KEY = 'gifted-prep:content';

interface CachedContent {
	overrides: unknown;
	version: number;
	updatedAt: number | null;
}

// The server version the local copy matches (0: never fetched). Writes in the question bank
// are based on it.
const version = ref(0);
const updatedAt = ref<number | null>(null);
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

function loadCache() {
	try {
		const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as CachedContent | null;
		if (cached) apply(cached);
	} catch {
		// No usable cache: the built-in content is used until the server answers.
	}
}

function saveCache(copy: CachedContent) {
	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify(copy));
	} catch {
		// Not cached; fetched again next time.
	}
}

// Takes a copy that came from the server (a fetch, or a save in the question bank).
function accept(copy: ContentCopy) {
	if (apply(copy)) saveCache(copy);
}

async function refresh() {
	status.value = 'loading';
	try {
		accept(await contentApi.get());
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
	return { version, updatedAt, status, refresh, accept };
}
