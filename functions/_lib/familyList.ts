import type { Env } from './types';

interface Row {
	id: string;
	name: string;
	is_admin: number;
	has_password: number;
	created_at: number;
	child_id: string | null;
	child_name: string | null;
	child_icon: string | null;
}

export interface FamilyListEntry {
	id: string;
	name: string;
	admin: boolean;
	// Whether the family has a password of its own (the admin may still use FAMILY_PASSWORD).
	hasPassword: boolean;
	createdAt: number;
	children: { id: string; name: string; icon: string }[];
}

// Every family with its children, for the admin screen: the admin family first. Passwords
// never leave the server.
export async function listFamilies(env: Env): Promise<FamilyListEntry[]> {
	const { results } = await env.DB.prepare(
		`SELECT f.id, f.name, f.is_admin, f.password_hash IS NOT NULL AS has_password, f.created_at,
			c.id AS child_id, c.name AS child_name, c.icon AS child_icon
		FROM families f LEFT JOIN children c ON c.family_id = f.id
		ORDER BY f.is_admin DESC, f.created_at, c.position, c.created_at`,
	).all<Row>();
	const families = new Map<string, FamilyListEntry>();
	for (const row of results) {
		let family = families.get(row.id);
		if (!family) {
			family = {
				id: row.id,
				name: row.name,
				admin: row.is_admin === 1,
				hasPassword: row.has_password === 1,
				createdAt: row.created_at,
				children: [],
			};
			families.set(row.id, family);
		}
		if (row.child_id) family.children.push({ id: row.child_id, name: row.child_name ?? '', icon: row.child_icon ?? '' });
	}
	return [...families.values()];
}

// A unique index refused a write: which one.
export function uniqueViolation(cause: unknown): 'name taken' | 'password taken' | null {
	const message = String(cause);
	if (!message.includes('UNIQUE')) return null;
	return message.includes('name') ? 'name taken' : 'password taken';
}
