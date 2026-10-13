import type { BankItemKind } from '@/types';
import { parseSnapshot, type BankRecord, type BankSnapshot } from './bankContent';
import type { BankItemData } from './checkBank';

const URL = '/api/bank';
// As with progress: a hung request must not block later ones.
const TIMEOUT_MS = 15_000;

// What a write ends in. A conflict carries the item as it is now on the server (null if
// it was deleted meanwhile); every reply carries the bank revision after it.
export type WriteResult =
	| { status: 'saved'; item: BankRecord; revision: number }
	| { status: 'deleted'; revision: number }
	| { status: 'conflict'; item: BankRecord | null; revision: number }
	| { status: 'missing' };

export interface HistoryEntry {
	version: number;
	kind: BankItemKind;
	data: BankItemData;
	savedAt: number;
}

const itemUrl = (id: string) => `${URL}/${encodeURIComponent(id)}`;

async function call(url: string, method: string, body?: unknown): Promise<Response> {
	return fetch(url, {
		method,
		cache: 'no-store',
		...(body !== undefined && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
		signal: AbortSignal.timeout(TIMEOUT_MS),
	});
}

async function writeResult(response: Response, what: string): Promise<WriteResult> {
	if (response.status === 404) return { status: 'missing' };
	if (response.status !== 200 && response.status !== 409) throw new Error(`${what}: ${response.status}`);
	const body = (await response.json()) as { item?: BankRecord | null; deleted?: string; revision: number };
	if (response.status === 409) return { status: 'conflict', item: body.item ?? null, revision: body.revision };
	if (body.deleted) return { status: 'deleted', revision: body.revision };
	if (!body.item) throw new Error(`${what}: no item in the reply`);
	return { status: 'saved', item: body.item, revision: body.revision };
}

// The client side of functions/api/bank. Throws on network errors, timeouts, unexpected
// statuses (e.g. 401 when logged out) and a reply that isn't a bank.
export const bankApi = {
	// The whole bank, or undefined when the given revision is still the current one.
	async get(knownRevision?: number): Promise<BankSnapshot | undefined> {
		const query = knownRevision === undefined ? '' : `?rev=${knownRevision}`;
		const response = await call(`${URL}${query}`, 'GET');
		if (!response.ok) throw new Error(`GET ${URL}: ${response.status}`);
		const body = (await response.json()) as { unchanged?: boolean };
		if (body.unchanged) return undefined;
		const snapshot = parseSnapshot(body);
		if (!snapshot) throw new Error(`GET ${URL}: not a bank`);
		return snapshot;
	},

	// Creates (baseVersion 0) or updates an item.
	async put(kind: BankItemKind, data: BankItemData, baseVersion: number): Promise<WriteResult> {
		return writeResult(await call(itemUrl(data.id), 'PUT', { kind, data, baseVersion }), `PUT ${data.id}`);
	},

	async setHidden(id: string, hidden: boolean): Promise<WriteResult> {
		return writeResult(await call(itemUrl(id), 'PATCH', { hidden }), `PATCH ${id}`);
	},

	async remove(id: string, baseVersion: number): Promise<WriteResult> {
		return writeResult(await call(`${itemUrl(id)}?baseVersion=${baseVersion}`, 'DELETE'), `DELETE ${id}`);
	},

	// Every saved version of an item, newest first.
	async history(id: string): Promise<HistoryEntry[]> {
		const response = await call(`${itemUrl(id)}/history`, 'GET');
		if (!response.ok) throw new Error(`GET history ${id}: ${response.status}`);
		return ((await response.json()) as { versions: HistoryEntry[] }).versions;
	},
};
