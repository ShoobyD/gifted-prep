import { versionedHandlers } from '../_lib/versioned';

const isRecord = (value: unknown) => !!value && typeof value === 'object' && !Array.isArray(value);

// The parent's changes to the question bank (the app's ContentOverrides): edited and added
// passages and questions, and the hidden ids. The built-in content itself ships in the app.
export const { onRequestGet, onRequestPut } = versionedHandlers({
	table: 'content',
	field: 'overrides',
	// Must match OVERRIDES_VERSION in src/content/overrides.ts.
	formatVersion: 1,
	// Room for many added passages; a passage with its questions is a few kilobytes.
	maxBytes: 1024 * 1024,
	isValid: (value) =>
		isRecord(value.passages) && isRecord(value.questions)
		&& Array.isArray(value.hidden) && value.hidden.every((id) => typeof id === 'string'),
});
