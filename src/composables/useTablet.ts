import { computed, ref } from 'vue';
import { useChildren } from './useChildren';
import { useDevice } from './useDevice';

// A child's tablet belongs to one child (fixed), or is shared by the family's children,
// who say who is practicing whenever they pick it up.
export type TabletMode = 'fixed' | 'shared';

const MODE_KEY = 'gifted-prep:tablet';
// Coming back to a shared tablet after this long is probably another child.
const ASK_AGAIN_AFTER_MS = 5 * 60_000;

function loadMode(): TabletMode {
	try {
		return localStorage.getItem(MODE_KEY) === 'shared' ? 'shared' : 'fixed';
	} catch {
		return 'fixed';
	}
}

const mode = ref<TabletMode>(loadMode());
// A shared tablet asks when the app opens.
const asking = ref(mode.value === 'shared');
let hiddenAt: number | undefined;
let initialized = false;

function init() {
	if (initialized) return;
	initialized = true;
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') {
			hiddenAt = Date.now();
		} else if (mode.value === 'shared' && hiddenAt !== undefined && Date.now() - hiddenAt >= ASK_AGAIN_AFTER_MS) {
			asking.value = true;
		}
	});
}

// Fixed to one child, or shared (which asks who is practicing right away). Set from the
// device choice and the tablet's hidden menu.
function setMode(next: TabletMode, childId?: string) {
	mode.value = next;
	try {
		localStorage.setItem(MODE_KEY, next);
	} catch {
		// Not kept; the tablet goes back to fixed next time.
	}
	if (childId) useChildren().select(childId);
	asking.value = next === 'shared';
}

// The child who is practicing now (on a shared tablet).
function choose(childId: string) {
	useChildren().select(childId);
	asking.value = false;
}

export function useTablet() {
	init();
	const device = useDevice();
	const { children } = useChildren();
	// Only a shared child's tablet with more than one child to choose from asks.
	const needsChoice = computed(() =>
		device.isChild.value && mode.value === 'shared' && asking.value && children.value.length > 1);
	const isShared = computed(() => mode.value === 'shared' && children.value.length > 1);
	return { mode, isShared, needsChoice, setMode, choose, ask: () => (asking.value = true) };
}
