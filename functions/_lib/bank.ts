import type { Env } from './types';

// The question bank in D1: one row per item (see schema.sql). Content rules (answers,
// line numbers, …) are checked by the app's editor and by the bank import; the server only
// guards the shape, so a broken item can never take the bank down.

export type ItemKind = 'passage' | 'question' | 'test';

export const ITEM_KINDS: ItemKind[] = ['passage', 'question', 'test'];

// A passage with all its questions is a few kilobytes; anything near this is not ours.
export const MAX_ITEM_BYTES = 256 * 1024;

export interface ItemRow {
	id: string;
	kind: ItemKind;
	data: string;
	hidden: number;
	version: number;
	updated_at: number;
}

export interface ItemDto {
	id: string;
	kind: ItemKind;
	data: unknown;
	hidden: boolean;
	version: number;
	updatedAt: number;
}

export function rowToDto(row: ItemRow): ItemDto {
	return {
		id: row.id,
		kind: row.kind,
		data: JSON.parse(row.data) as unknown,
		hidden: row.hidden === 1,
		version: row.version,
		updatedAt: row.updated_at,
	};
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	!!value && typeof value === 'object' && !Array.isArray(value);

// The minimal shape of each kind, and the item filed under its own id.
export function isValidItem(kind: ItemKind, id: string, data: unknown): boolean {
	if (!isRecord(data) || data.id !== id) return false;
	switch (kind) {
		case 'passage':
			return typeof data.title === 'string' && Array.isArray(data.paragraphs) && Array.isArray(data.questions);
		case 'question':
			return typeof data.type === 'string' && isRecord(data.answer);
		case 'test':
			return typeof data.title === 'string' && Array.isArray(data.sections);
	}
}

// Ids are used in URLs and keys: keep them plain.
export function isValidId(id: string): boolean {
	return /^[a-z0-9][a-z0-9-]{0,99}$/i.test(id);
}

export async function readItem(env: Env, id: string): Promise<ItemRow | null> {
	return env.DB.prepare('SELECT id, kind, data, hidden, version, updated_at FROM bank_items WHERE id = ?')
		.bind(id)
		.first<ItemRow>();
}

export async function readRevision(env: Env): Promise<number> {
	const row = await env.DB.prepare("SELECT value FROM bank_meta WHERE key = 'revision'").first<{ value: number }>();
	return row?.value ?? 0;
}

// Part of every write batch. A write that turns out to be a conflict still bumps it; that
// only makes devices fetch once more, which is harmless.
export function bumpRevision(env: Env): D1PreparedStatement {
	return env.DB.prepare(
		"INSERT INTO bank_meta (key, value) VALUES ('revision', 1) ON CONFLICT(key) DO UPDATE SET value = value + 1",
	);
}

// Records the item's current version in the history, if it is the version just written
// (matched by version and timestamp, so a racing writer's row is never recorded as ours).
export function recordHistory(env: Env, id: string, version: number, at: number): D1PreparedStatement {
	return env.DB.prepare(
		`INSERT OR IGNORE INTO bank_history (id, version, kind, data, saved_at)
		SELECT id, version, kind, data, updated_at FROM bank_items WHERE id = ? AND version = ? AND updated_at = ?`,
	).bind(id, version, at);
}
