import { computed, ref } from 'vue';
import { useSession } from './useSession';

// child: practices and backs its progress up to the server (the tablet).
// parent: shows the server copy, read-only (the parent's phone and computer).
export type DeviceRole = 'child' | 'parent';

const ROLE_KEY = 'gifted-prep:device';

function loadRole(): DeviceRole | undefined {
	try {
		const saved = localStorage.getItem(ROLE_KEY);
		return saved === 'child' || saved === 'parent' ? saved : undefined;
	} catch {
		return undefined;
	}
}

const role = ref<DeviceRole | undefined>(loadRole());

function setRole(next: DeviceRole | undefined) {
	role.value = next;
	try {
		if (next) localStorage.setItem(ROLE_KEY, next);
		else localStorage.removeItem(ROLE_KEY);
	} catch {
		// Not persisted; asked again next visit.
	}
}

export function useDevice() {
	const { authenticated } = useSession();
	// Without the server (plain dev, or offline before the login was confirmed) the app
	// behaves as the child's device, as it always did; the choice is asked behind the login.
	const needsChoice = computed(() => authenticated.value === true && !role.value);
	const isParent = computed(() => role.value === 'parent');
	const isChild = computed(() => role.value === 'child');
	return { role, needsChoice, isParent, isChild, setRole };
}
