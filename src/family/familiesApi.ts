import type { Child } from './childrenApi';

// The client side of functions/api/admin/families (the admin family only).

export interface FamilyEntry {
	id: string;
	name: string;
	admin: boolean;
	// Whether the family has a password of its own (the admin may still use the original one).
	hasPassword: boolean;
	createdAt: number;
	children: Child[];
}

const URL = '/api/admin/families';
const TIMEOUT_MS = 15_000;

// What the server says when it refuses, for messages the admin understands.
export class FamilyError extends Error {
	constructor(readonly status: number, readonly reason: string) {
		super(reason);
	}
}

// Every call answers with the whole list after it.
async function call(url: string, method: string, body?: unknown): Promise<FamilyEntry[]> {
	const response = await fetch(url, {
		method,
		cache: 'no-store',
		...(body !== undefined && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
		signal: AbortSignal.timeout(TIMEOUT_MS),
	});
	const data = (await response.json().catch(() => ({}))) as { families?: FamilyEntry[]; error?: string };
	if (!response.ok || !Array.isArray(data.families)) throw new FamilyError(response.status, data.error ?? '');
	return data.families;
}

const familyUrl = (id: string) => `${URL}/${encodeURIComponent(id)}`;

export const familiesApi = {
	list: () => call(URL, 'GET'),
	create: (family: { name: string; password: string; child?: { name: string; icon: string } }) => call(URL, 'POST', family),
	update: (id: string, change: { name?: string; password?: string }) => call(familyUrl(id), 'PATCH', change),
	// Deletes the family's children and their progress too.
	remove: (id: string) => call(familyUrl(id), 'DELETE'),
};

// An easy password to read out or type on a phone: no look-alike characters (0/O, 1/l).
export function generatePassword(length = 10): string {
	const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
	// Bytes past the last whole multiple of the alphabet are skipped, so no character is likelier.
	const limit = 256 - (256 % alphabet.length);
	let password = '';
	while (password.length < length) {
		for (const byte of crypto.getRandomValues(new Uint8Array(length))) {
			if (byte < limit && password.length < length) password += alphabet[byte % alphabet.length];
		}
	}
	return password;
}

// The server's reasons, in words for the admin.
export function familyErrorMessage(cause: unknown): string {
	if (!(cause instanceof FamilyError)) return 'אין חיבור לשרת, והשינוי לא נשמר.';
	if (cause.reason === 'password taken') return 'הסיסמה הזאת כבר שייכת למשפחה אחרת. בחרו סיסמה אחרת.';
	if (cause.reason === 'name taken') return 'כבר יש משפחה בשם הזה.';
	if (cause.reason.startsWith('a password needs')) return 'סיסמה צריכה 6 תווים לפחות.';
	if (cause.reason.startsWith('a name')) return 'צריך שם (עד 40 תווים).';
	if (cause.status === 403) return 'רק משפחת המנהל יכולה לנהל משפחות.';
	return 'השינוי לא נשמר.';
}
