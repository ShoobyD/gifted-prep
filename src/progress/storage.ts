// Where a device keeps each child's progress and sync state: one pair of keys per child.
// Before families had several children there was one pair for the whole device; it now
// belongs to the family's first child and moves to that child's keys once its id is known.

export const LEGACY_PROGRESS_KEY = 'gifted-prep:progress';
export const LEGACY_META_KEY = 'gifted-prep:sync';

// undefined: the device doesn't know its child yet (first start after the update, offline).
export const progressKey = (childId?: string) => (childId ? `${LEGACY_PROGRESS_KEY}:${childId}` : LEGACY_PROGRESS_KEY);
export const metaKey = (childId?: string) => (childId ? `${LEGACY_META_KEY}:${childId}` : LEGACY_META_KEY);

export interface KeyValueStore {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
}

// Gives the device's old progress (and its pending-sync state) to the child, if the child
// has none of its own yet. Returns whether anything moved; never overwrites a child's data.
export function adoptLegacyProgress(store: KeyValueStore, childId: string): boolean {
	const legacy = store.getItem(LEGACY_PROGRESS_KEY);
	if (legacy === null || store.getItem(progressKey(childId)) !== null) return false;
	store.setItem(progressKey(childId), legacy);
	const meta = store.getItem(LEGACY_META_KEY);
	if (meta !== null) store.setItem(metaKey(childId), meta);
	store.removeItem(LEGACY_PROGRESS_KEY);
	store.removeItem(LEGACY_META_KEY);
	return true;
}
