import { computed, ref, watch } from 'vue';
import { childrenApi, parseChildren, type Child } from '@/family/childrenApi';
import { useSession } from './useSession';

// The logged-in family's children, kept on the device so it knows them offline too, and
// the child this device practices as.

const CHILDREN_KEY = 'gifted-prep:children';
const SELECTED_KEY = 'gifted-prep:child';

function read(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function write(key: string, value: string) {
	try {
		localStorage.setItem(key, value);
	} catch {
		// Not kept; fetched again next time.
	}
}

function loadChildren(): Child[] {
	try {
		return parseChildren(JSON.parse(read(CHILDREN_KEY) ?? 'null')) ?? [];
	} catch {
		return [];
	}
}

const children = ref<Child[]>(loadChildren());
const selectedId = ref<string | undefined>(read(SELECTED_KEY) ?? undefined);
const status = ref<'idle' | 'loading' | 'failed'>('idle');
let initialized = false;

// The chosen child, or the family's first; undefined until the list is known.
const activeChild = computed(() => children.value.find((c) => c.id === selectedId.value) ?? children.value[0]);

async function refresh() {
	status.value = 'loading';
	try {
		children.value = await childrenApi.list();
		write(CHILDREN_KEY, JSON.stringify(children.value));
		status.value = 'idle';
	} catch {
		status.value = 'failed';
	}
}

function select(id: string) {
	selectedId.value = id;
	write(SELECTED_KEY, id);
}

function init() {
	if (initialized) return;
	initialized = true;
	const session = useSession();
	watch(session.authenticated, (authenticated) => {
		if (authenticated) void refresh();
	}, { immediate: true });
}

export function useChildren() {
	init();
	return { children, activeChild, status, refresh, select };
}
