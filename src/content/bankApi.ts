import { parseSnapshot, type BankSnapshot } from './bankContent';

const URL = '/api/bank';
// As with progress: a hung request must not block later ones.
const TIMEOUT_MS = 15_000;

// The client side of functions/api/bank. Throws on network errors, timeouts, unexpected
// statuses (e.g. 401 when logged out) and a reply that isn't a bank.
export const bankApi = {
	// The whole bank, or undefined when the given revision is still the current one.
	async get(knownRevision?: number): Promise<BankSnapshot | undefined> {
		const query = knownRevision === undefined ? '' : `?rev=${knownRevision}`;
		const response = await fetch(`${URL}${query}`, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
		if (!response.ok) throw new Error(`GET ${URL}: ${response.status}`);
		const body = (await response.json()) as { unchanged?: boolean };
		if (body.unchanged) return undefined;
		const snapshot = parseSnapshot(body);
		if (!snapshot) throw new Error(`GET ${URL}: not a bank`);
		return snapshot;
	},
};
