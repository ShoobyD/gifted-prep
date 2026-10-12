import type { ContentOverrides } from './overrides';

const URL = '/api/content';
// As with progress: a hung request must not block later ones.
const TIMEOUT_MS = 15_000;

// What the server holds: version 0 and overrides null when nothing was saved yet.
export interface ContentCopy {
	overrides: unknown;
	version: number;
	updatedAt: number | null;
}

export type SaveResult = { ok: true; copy: ContentCopy } | { ok: false; conflict: ContentCopy };

// The client side of functions/api/content.ts. Throws on network errors, timeouts and
// unexpected statuses (e.g. 401 when logged out).
export const contentApi = {
	async get(): Promise<ContentCopy> {
		const response = await fetch(URL, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
		if (!response.ok) throw new Error(`GET ${URL}: ${response.status}`);
		return (await response.json()) as ContentCopy;
	},
	async put(overrides: ContentOverrides, baseVersion: number): Promise<SaveResult> {
		const response = await fetch(URL, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ overrides, baseVersion }),
			signal: AbortSignal.timeout(TIMEOUT_MS),
		});
		if (response.status === 409) return { ok: false, conflict: (await response.json()) as ContentCopy };
		if (!response.ok) throw new Error(`PUT ${URL}: ${response.status}`);
		return { ok: true, copy: (await response.json()) as ContentCopy };
	},
};
