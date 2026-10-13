import {
	bumpRevision,
	isValidId,
	isValidItem,
	ITEM_KINDS,
	MAX_ITEM_BYTES,
	readItem,
	readRevision,
	recordHistory,
	rowToDto,
	type ItemKind,
} from '../../_lib/bank';
import { errorResponse, jsonResponse, type Env } from '../../_lib/types';

type Context = EventContext<Env, 'id', Record<string, unknown>>;

const idOf = (context: Context) => String(context.params.id);

async function readBody(request: Request, maxBytes: number): Promise<Record<string, unknown> | Response> {
	const text = await request.text();
	if (text.length > maxBytes) return errorResponse('item too large', 413);
	try {
		const body = JSON.parse(text) as unknown;
		if (!body || typeof body !== 'object' || Array.isArray(body)) return errorResponse('invalid body', 400);
		return body as Record<string, unknown>;
	} catch {
		return errorResponse('invalid JSON', 400);
	}
}

const isVersion = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0;

async function itemResponse(env: Env, id: string, status = 200) {
	const row = await readItem(env, id);
	return jsonResponse({ item: row && rowToDto(row), revision: await readRevision(env) }, status);
}

// Creates (baseVersion 0) or updates an item. An update must name the version it edited;
// if someone saved meanwhile, 409 with the current item. Every saved version is kept in
// the history.
export const onRequestPut: PagesFunction<Env, 'id'> = async (context) => {
	const { request, env } = context;
	const id = idOf(context);
	if (!isValidId(id)) return errorResponse('invalid id', 400);

	const body = await readBody(request, MAX_ITEM_BYTES);
	if (body instanceof Response) return body;
	const kind = body.kind as ItemKind;
	if (!ITEM_KINDS.includes(kind)) return errorResponse('invalid kind', 400);
	if (!isValidItem(kind, id, body.data)) return errorResponse(`not a ${kind} item`, 400);
	if (!isVersion(body.baseVersion)) return errorResponse('baseVersion must be a non-negative integer', 400);

	const baseVersion = body.baseVersion;
	const data = JSON.stringify(body.data);
	const now = Date.now();

	const write = baseVersion === 0
		// New items go to the end of the list.
		? env.DB.prepare(
			`INSERT OR IGNORE INTO bank_items (id, kind, data, hidden, version, updated_at, position)
			VALUES (?, ?, ?, 0, 1, ?, (SELECT COALESCE(MAX(position), 0) + 1 FROM bank_items))`,
		).bind(id, kind, data, now)
		// The kind of an existing item never changes.
		: env.DB.prepare(
			'UPDATE bank_items SET data = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ? AND kind = ?',
		).bind(data, now, id, baseVersion, kind);

	const [result] = await env.DB.batch([write, recordHistory(env, id, baseVersion + 1, now), bumpRevision(env)]);
	if (!result?.meta.changes) {
		const current = await readItem(env, id);
		if (!current && baseVersion > 0) return errorResponse('not found', 404);
		return itemResponse(env, id, 409);
	}
	return itemResponse(env, id);
};

// Hides or shows an item. Not a content change: no version check, nothing in the history.
export const onRequestPatch: PagesFunction<Env, 'id'> = async (context) => {
	const { request, env } = context;
	const id = idOf(context);
	const body = await readBody(request, 1024);
	if (body instanceof Response) return body;
	if (typeof body.hidden !== 'boolean') return errorResponse('hidden must be true or false', 400);

	const [result] = await env.DB.batch([
		env.DB.prepare('UPDATE bank_items SET hidden = ? WHERE id = ?').bind(body.hidden ? 1 : 0, id),
		bumpRevision(env),
	]);
	if (!result?.meta.changes) return errorResponse('not found', 404);
	return itemResponse(env, id);
};

// Deletes an item, if it is still the version the caller saw (?baseVersion=N). Its history
// stays, so a deleted item can still be recovered from the database.
export const onRequestDelete: PagesFunction<Env, 'id'> = async (context) => {
	const { request, env } = context;
	const id = idOf(context);
	const baseVersion = Number(new URL(request.url).searchParams.get('baseVersion'));
	if (!Number.isInteger(baseVersion) || baseVersion < 1) return errorResponse('baseVersion must be a positive integer', 400);

	const [result] = await env.DB.batch([
		env.DB.prepare('DELETE FROM bank_items WHERE id = ? AND version = ?').bind(id, baseVersion),
		bumpRevision(env),
	]);
	if (!result?.meta.changes) {
		return (await readItem(env, id)) ? itemResponse(env, id, 409) : errorResponse('not found', 404);
	}
	return jsonResponse({ deleted: id, revision: await readRevision(env) });
};
