// Family login: a stateless signed cookie.
//
// The cookie holds an expiry date and an HMAC signature over it. It contains no secret
// and can't be forged without the key, which lives only on the server. It is HttpOnly,
// so scripts in the page can't read it.

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

export async function createSessionToken(secret: string, now: number): Promise<string> {
	const payload = toBase64Url(encoder.encode(JSON.stringify({ exp: now + SESSION_TTL_SECONDS * 1000 })));
	const key = await hmacKey(secret);
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
	return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

async function isTokenValid(token: string, secret: string, now: number): Promise<boolean> {
	const [payload, signature] = token.split('.');
	if (!payload || !signature) return false;

	const key = await hmacKey(secret);
	let signatureOk: boolean;
	try {
		signatureOk = await crypto.subtle.verify('HMAC', key, fromBase64Url(signature), encoder.encode(payload));
	} catch {
		// Malformed base64.
		return false;
	}
	if (!signatureOk) return false;

	try {
		const parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as { exp?: unknown };
		return typeof parsed.exp === 'number' && now < parsed.exp;
	} catch {
		return false;
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

export async function isAuthenticated(request: Request, secret: string | undefined): Promise<boolean> {
	if (!secret) return false;
	const token = readCookie(request, SESSION_COOKIE);
	if (!token) return false;
	return isTokenValid(token, secret, Date.now());
}

export function sessionCookie(token: string): string {
	// Lax rather than Strict, so arriving from an external link doesn't look logged out.
	// Lax still blocks cross-site writes.
	return [`${SESSION_COOKIE}=${token}`, 'HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', `Max-Age=${SESSION_TTL_SECONDS}`].join('; ');
}

export function clearedSessionCookie(): string {
	return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}
