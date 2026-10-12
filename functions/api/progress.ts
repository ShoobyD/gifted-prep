import { versionedHandlers } from '../_lib/versioned';

// The child's progress (the app's ProgressState).
export const { onRequestGet, onRequestPut } = versionedHandlers({
	table: 'progress',
	field: 'progress',
	// Must match PROGRESS_VERSION in src/progress/state.ts.
	formatVersion: 1,
	// A year of heavy use stays far below this; anything bigger is not ours.
	maxBytes: 512 * 1024,
});
