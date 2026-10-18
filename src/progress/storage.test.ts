import { describe, expect, it } from 'vitest';
import { adoptLegacyProgress, LEGACY_META_KEY, LEGACY_PROGRESS_KEY, metaKey, progressKey, type KeyValueStore } from './storage';

function memoryStore(initial: Record<string, string> = {}): KeyValueStore & { data: Map<string, string> } {
	const data = new Map(Object.entries(initial));
	return {
		data,
		getItem: (key) => data.get(key) ?? null,
		setItem: (key, value) => void data.set(key, value),
		removeItem: (key) => void data.delete(key),
	};
}

describe('progress keys', () => {
	it('are per child, with the old keys for an unknown child', () => {
		expect(progressKey('c-1')).toBe('gifted-prep:progress:c-1');
		expect(metaKey('c-1')).toBe('gifted-prep:sync:c-1');
		expect(progressKey()).toBe(LEGACY_PROGRESS_KEY);
		expect(metaKey(undefined)).toBe(LEGACY_META_KEY);
	});
});

describe('adoptLegacyProgress', () => {
	it('moves the device\'s old progress and sync state to the child', () => {
		const store = memoryStore({ [LEGACY_PROGRESS_KEY]: 'progress', [LEGACY_META_KEY]: 'meta' });
		expect(adoptLegacyProgress(store, 'c-1')).toBe(true);
		expect([...store.data]).toEqual([[progressKey('c-1'), 'progress'], [metaKey('c-1'), 'meta']]);
	});

	it('moves progress that never synced (no sync state)', () => {
		const store = memoryStore({ [LEGACY_PROGRESS_KEY]: 'progress' });
		expect(adoptLegacyProgress(store, 'c-1')).toBe(true);
		expect([...store.data]).toEqual([[progressKey('c-1'), 'progress']]);
	});

	it('never overwrites a child that has progress of its own', () => {
		const store = memoryStore({ [LEGACY_PROGRESS_KEY]: 'old', [progressKey('c-1')]: 'own' });
		expect(adoptLegacyProgress(store, 'c-1')).toBe(false);
		expect(store.getItem(progressKey('c-1'))).toBe('own');
		expect(store.getItem(LEGACY_PROGRESS_KEY)).toBe('old');
	});

	it('does nothing without old progress, also when run again', () => {
		const store = memoryStore({ [LEGACY_PROGRESS_KEY]: 'progress' });
		adoptLegacyProgress(store, 'c-1');
		expect(adoptLegacyProgress(store, 'c-1')).toBe(false);
		expect(adoptLegacyProgress(store, 'c-2')).toBe(false);
		expect(store.getItem(progressKey('c-2'))).toBeNull();
	});
});
