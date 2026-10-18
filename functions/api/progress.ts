import { resolveChild } from '../_lib/children';
import { versionedHandlers } from '../_lib/versioned';

// A child's progress (the app's ProgressState): /api/progress?child=<id>. Without a child,
// the family's first child: what an app from before families had children asks for.
export const { onRequestGet, onRequestPut } = versionedHandlers({
	table: 'progress',
	field: 'progress',
	// Must match PROGRESS_VERSION in src/progress/state.ts.
	formatVersion: 1,
	// A year of heavy use stays far below this; anything bigger is not ours.
	maxBytes: 512 * 1024,
	async rowOf({ request, env, data }) {
		const child = await resolveChild(env, data.family.id, new URL(request.url).searchParams.get('child'));
		return child instanceof Response ? child : child.id;
	},
});
