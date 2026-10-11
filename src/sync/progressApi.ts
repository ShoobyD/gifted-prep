import type { ProgressState } from '@/progress/state';
import type { ProgressApi, ServerCopy } from './syncEngine';

const URL = '/api/progress';
// A request can hang (e.g. a connection dropped mid-way). Since sync runs one at a
// time, a hung request would block every later sync, so each call gets a deadline.
const TIMEOUT_MS = 15_000;

async function readCopy(response: Response): Promise<ServerCopy> {
	return (await response.json()) as ServerCopy;
}

// The client side of functions/api/progress.ts. Throws on network errors, timeouts and
// any unexpected status (e.g. 401 when the device was logged out), so the engine retries later.
export const progressApi: ProgressApi = {
	async get() {
		const response = await fetch(URL, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
		if (!response.ok) throw new Error(`GET ${URL}: ${response.status}`);
		return readCopy(response);
	},
	async put(progress: ProgressState, baseVersion: number) {
		const response = await fetch(URL, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ progress, baseVersion }),
			signal: AbortSignal.timeout(TIMEOUT_MS),
		});
		if (response.status === 409) return { ok: false, conflict: await readCopy(response) };
		if (!response.ok) throw new Error(`PUT ${URL}: ${response.status}`);
		return { ok: true, copy: await readCopy(response) };
	},
};
