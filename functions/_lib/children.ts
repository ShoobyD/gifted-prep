import { errorResponse, type Env } from './types';

// A family's children. Each child's progress is the progress row with the child's id.

export const MAX_CHILDREN = 10;
const MAX_NAME_LENGTH = 40;
// An emoji, possibly built of several code points (skin tone, joiners).
const MAX_ICON_LENGTH = 16;

export interface ChildRow {
	id: string;
	name: string;
	icon: string;
	position: number;
}

export interface ChildDto {
	id: string;
	name: string;
	icon: string;
}

export const toChildDto = (row: ChildRow): ChildDto => ({ id: row.id, name: row.name, icon: row.icon });

export async function listChildren(env: Env, familyId: string): Promise<ChildRow[]> {
	const { results } = await env.DB.prepare(
		'SELECT id, name, icon, position FROM children WHERE family_id = ? ORDER BY position, created_at',
	).bind(familyId).all<ChildRow>();
	return results;
}

// The child, if it belongs to the family; never another family's.
export async function childOfFamily(env: Env, familyId: string, childId: string): Promise<ChildRow | null> {
	return env.DB.prepare('SELECT id, name, icon, position FROM children WHERE id = ? AND family_id = ?')
		.bind(childId, familyId)
		.first<ChildRow>();
}

// The child a request means: the one it names, or the family's first child when it names
// none (an app from before families had children). A Response when there is no such child.
export async function resolveChild(env: Env, familyId: string, requested: string | null): Promise<ChildRow | Response> {
	const child = requested ? await childOfFamily(env, familyId, requested) : (await listChildren(env, familyId))[0] ?? null;
	return child ?? errorResponse(requested ? 'no such child' : 'the family has no children', 404);
}

export function cleanName(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const name = value.replace(/\s+/g, ' ').trim();
	return name && name.length <= MAX_NAME_LENGTH ? name : null;
}

export function cleanIcon(value: unknown): string | null {
	if (value === undefined) return '';
	if (typeof value !== 'string') return null;
	const icon = value.trim();
	return icon.length <= MAX_ICON_LENGTH ? icon : null;
}

export function newId(prefix: 'c' | 'f'): string {
	const bytes = crypto.getRandomValues(new Uint8Array(6));
	return `${prefix}-${[...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}
