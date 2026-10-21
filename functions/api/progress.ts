import { resolveChild } from '../_lib/children';
import { versionedHandlers } from '../_lib/versioned';

const isNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value);
const isObject = (value: unknown) => !!value && typeof value === 'object' && !Array.isArray(value);

// The type each field must have when present. Missing fields are fine: an app saved before
// a field existed (e.g. a tablet still running a cached version) leaves it out, and the app
// fills it in on reading (normalizeProgress in src/progress/state.ts).
const FIELDS: Record<string, (value: unknown) => boolean> = {
	stars: isNumber,
	stickers: Array.isArray,
	practiceDays: Array.isArray,
	typeStats: isObject,
	levels: isObject,
	passages: isObject,
	sessions: Array.isArray,
	settings: isObject,
	mistakes: Array.isArray,
	mistakesFixed: isNumber,
	generation: isNumber,
	device: isObject,
};

function isProgress(value: Record<string, unknown>): boolean {
	return Object.entries(FIELDS).every(([field, isValid]) => value[field] === undefined || isValid(value[field]));
}

// A child's progress (the app's ProgressState): /api/progress?child=<id>. Without a child,
// the family's first child: what an app from before families had children asks for.
export const { onRequestGet, onRequestPut } = versionedHandlers({
	table: 'progress',
	field: 'progress',
	// Must match PROGRESS_VERSION in src/progress/state.ts.
	formatVersion: 1,
	// A year of heavy use stays far below this; anything bigger is not ours.
	maxBytes: 512 * 1024,
	isValid: isProgress,
	async rowOf({ request, env, data }) {
		const child = await resolveChild(env, data.family.id, new URL(request.url).searchParams.get('child'));
		return child instanceof Response ? child : child.id;
	},
});
