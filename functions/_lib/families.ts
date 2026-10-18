import { readSession, secretsMatch } from './session';
import type { Env } from './types';

// Families log in with a password only: each family's password is its own, so the
// password alone tells which family it is (the admin makes sure two families never share one).

export interface Family {
	id: string;
	name: string;
	isAdmin: boolean;
}

interface FamilyRow {
	id: string;
	name: string;
	is_admin: number;
}

const toFamily = (row: FamilyRow | null): Family | null =>
	row && { id: row.id, name: row.name, isAdmin: row.is_admin === 1 };

const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer): string {
	let binary = '';
	for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// What the database stores instead of a password: a hash keyed with the server's secret.
// It can be looked up directly (one cheap query, no matter how many families), and without
// the secret, which never leaves the server, a copy of the database reveals nothing.
// Changing SESSION_SECRET therefore invalidates every family password, not only the logins.
export async function passwordKey(password: string, secret: string): Promise<string> {
	const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	return toBase64Url(await crypto.subtle.sign('HMAC', key, encoder.encode(`family-password:${password}`)));
}

export async function readFamily(env: Env, id: string): Promise<Family | null> {
	return toFamily(await env.DB.prepare('SELECT id, name, is_admin FROM families WHERE id = ?').bind(id).first<FamilyRow>());
}

// The family a login cookie from before families existed belongs to.
export async function adminFamily(env: Env): Promise<Family | null> {
	return toFamily(await env.DB.prepare('SELECT id, name, is_admin FROM families WHERE is_admin = 1 ORDER BY created_at LIMIT 1')
		.first<FamilyRow>());
}

// The family a request is logged in as, or null: no valid cookie, or the family was deleted.
export async function familyOfRequest(request: Request, env: Env): Promise<Family | null> {
	const session = await readSession(request, env.SESSION_SECRET);
	if (!session) return null;
	return session.familyId ? readFamily(env, session.familyId) : adminFamily(env);
}

// The family a password belongs to, or null. FAMILY_PASSWORD still opens the admin family
// until that family sets a password of its own.
export async function findFamilyByPassword(env: Env, password: string): Promise<Family | null> {
	const secret = env.SESSION_SECRET as string;
	if (env.FAMILY_PASSWORD && (await secretsMatch(password, env.FAMILY_PASSWORD, secret))) {
		const legacy = await env.DB.prepare(
			'SELECT id, name, is_admin FROM families WHERE is_admin = 1 AND password_hash IS NULL ORDER BY created_at LIMIT 1',
		).first<FamilyRow>();
		if (legacy) return toFamily(legacy);
	}
	const row = await env.DB.prepare('SELECT id, name, is_admin FROM families WHERE password_hash = ?')
		.bind(await passwordKey(password, secret))
		.first<FamilyRow>();
	return toFamily(row);
}
