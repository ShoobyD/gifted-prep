// The client side of functions/api/children. Throws on network errors, timeouts and
// unexpected statuses (e.g. 401 when logged out).

export interface Child {
	id: string;
	name: string;
	// An emoji; may be empty.
	icon: string;
}

const URL = '/api/children';
const TIMEOUT_MS = 15_000;

const isChild = (value: unknown): value is Child => {
	const child = value as Partial<Child> | null;
	return !!child && typeof child.id === 'string' && typeof child.name === 'string' && typeof child.icon === 'string';
};

// Accepts a list from the server or the local cache only if every entry is a child.
export function parseChildren(value: unknown): Child[] | undefined {
	return Array.isArray(value) && value.every(isChild) ? value.map(({ id, name, icon }) => ({ id, name, icon })) : undefined;
}

export const childrenApi = {
	async list(): Promise<Child[]> {
		const response = await fetch(URL, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
		if (!response.ok) throw new Error(`GET ${URL}: ${response.status}`);
		const children = parseChildren(((await response.json()) as { children?: unknown }).children);
		if (!children) throw new Error(`GET ${URL}: not a list of children`);
		return children;
	},
};
