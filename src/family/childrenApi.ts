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

// Every call answers with the family's whole list after it.
async function call(url: string, method: string, body?: unknown): Promise<Child[]> {
	const response = await fetch(url, {
		method,
		cache: 'no-store',
		...(body !== undefined && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
		signal: AbortSignal.timeout(TIMEOUT_MS),
	});
	if (!response.ok) throw new Error(`${method} ${url}: ${response.status}`);
	const children = parseChildren(((await response.json()) as { children?: unknown }).children);
	if (!children) throw new Error(`${method} ${url}: not a list of children`);
	return children;
}

const childUrl = (id: string) => `${URL}/${encodeURIComponent(id)}`;

export const childrenApi = {
	list: () => call(URL, 'GET'),
	add: (child: { name: string; icon: string }) => call(URL, 'POST', child),
	update: (id: string, change: { name?: string; icon?: string }) => call(childUrl(id), 'PATCH', change),
	// Deletes the child's progress too. The server refuses the family's last child.
	remove: (id: string) => call(childUrl(id), 'DELETE'),
};
