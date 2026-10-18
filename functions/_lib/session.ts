// Family login: a stateless signed cookie.
//
// The cookie holds an expiry date and the family's id, with an HMAC signature over both.
// It contains no secret and can't be forged without the key, which lives only on the
// server. It is HttpOnly, so scripts in the page can't read it. Cookies from before
// families existed have no family id; they belong to the admin family.

export const SESSION_COOKIE = 'session';

// A year: the child's tablet shouldn't ask for the password every month.
export const SESSION_TTL_SECONDS = 365 * 24 * 60 * 60;

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
	const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
	const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

function hmacKey(secret: string): Promise<CryptoKey> {
	return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

// Comparison that leaks nothing through timing: both values are signed and the
// signatures compared, so not even the length leaks.
export async function secretsMatch(given: string, expected: string, secret: string): Promise<boolean> {
	const key = await hmacKey(secret);
	const [a, b] = await Promise.all([
		crypto.subtle.sign('HMAC', key, encoder.encode(given)),
		crypto.subtle.sign('HMAC', key, encoder.encode(expected)),
	]);
	const left = new Uint8Array(a);
	const right = new Uint8Array(b);
	let diff = 0;
	for (let i = 0; i < left.length; i++) diff |= (left[i] as number) ^ (right[i] as number);
	return diff === 0;
}

// What a valid cookie says: which family logged in (undefined for an old cookie).
export interface SessionPayload {
	familyId?: string;
}

export async function createSessionToken(secret: string, now: number, familyId: string): Promise<string> {
	const payload = toBase64Url(encoder.encode(JSON.stringify({ exp: now + SESSION_TTL_SECONDS * 1000, fam: familyId })));
	const key = await hmacKey(secret);
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
	return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

async function readToken(token: string, secret: string, now: number): Promise<SessionPayload | null> {
	const [payload, signature] = token.split('.');
	if (!payload || !signature) return null;

	const key = await hmacKey(secret);
	let signatureOk: boolean;
	try {
		signatureOk = await crypto.subtle.verify('HMAC', key, fromBase64Url(signature), encoder.encode(payload));
	} catch {
		// Malformed base64.
		return null;
	}
	if (!signatureOk) return null;

	try {
		const parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as { exp?: unknown; fam?: unknown };
		if (typeof parsed.exp !== 'number' || now >= parsed.exp) return null;
		return { familyId: typeof parsed.fam === 'string' ? parsed.fam : undefined };
	} catch {
		return null;
	}
}

export function readCookie(request: Request, name: string): string | null {
	const header = request.headers.get('Cookie');
	if (!header) return null;
	for (const part of header.split(';')) {
		const separator = part.indexOf('=');
		if (separator === -1) continue;
		if (part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
	}
	return null;
}

// The signed cookie's content, or null when there is no valid one.
export async function readSession(request: Request, secret: string | undefined): Promise<SessionPayload | null> {
	if (!secret) return null;
	const token = readCookie(request, SESSION_COOKIE);
	if (!token) return null;
	return readToken(token, secret, Date.now());
}

export function sessionCookie(token: string): string {
	// Lax rather than Strict, so arriving from an external link doesn't look logged out.
	// Lax still blocks cross-site writes.
	return [`${SESSION_COOKIE}=${token}`, 'HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', `Max-Age=${SESSION_TTL_SECONDS}`].join('; ');
}

export function clearedSessionCookie(): string {
	return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}
