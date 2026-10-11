import { errorResponse, jsonResponse, type Env } from '../_lib/types';

// One child per deployment, so one row.
const ROW_ID = 'family';
// Must match PROGRESS_VERSION in src/progress/state.ts.
const PROGRESS_VERSION = 1;
// A year of heavy use stays far below this; anything bigger is not ours.
const MAX_BYTES = 512 * 1024;

interface ProgressRow {
	data: string;
	version: number;
	updated_at: number;
}

interface PutBody {
	progress: unknown;
	// The version the client's change is based on (0 when the server had nothing).
	baseVersion: unknown;
}

function isProgress(value: unknown): value is { version: number } {
	return !!value && typeof value === 'object' && !Array.isArray(value)
		&& (value as { version?: unknown }).version === PROGRESS_VERSION;
}

async function readRow(env: Env): Promise<ProgressRow | null> {
	return env.DB.prepare('SELECT data, version, updated_at FROM progress WHERE id = ?')
		.bind(ROW_ID)
		.first<ProgressRow>();
}

function toDto(row: ProgressRow | null) {
	return row
		? { progress: JSON.parse(row.data) as unknown, version: row.version, updatedAt: row.updated_at }
		: { progress: null, version: 0, updatedAt: null };
}

// The saved progress, or progress: null with version 0 when nothing was saved yet.
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
	return jsonResponse(toDto(await readRow(env)));
};

// Replaces the progress, if nobody wrote since baseVersion. Otherwise 409 with the
// current server copy, so the client can merge and retry.
export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
	const text = await request.text();
	if (text.length > MAX_BYTES) return errorResponse('progress too large', 413);

	let body: PutBody;
	try {
		body = JSON.parse(text) as PutBody;
	} catch {
		return errorResponse('invalid JSON', 400);
	}
	if (!isProgress(body?.progress)) return errorResponse('not a progress document', 400);
	if (!Number.isInteger(body.baseVersion) || (body.baseVersion as number) < 0) {
		return errorResponse('baseVersion must be a non-negative integer', 400);
	}

	const baseVersion = body.baseVersion as number;
	const data = JSON.stringify(body.progress);
	const now = Date.now();

	// Conditional write in one statement, so two devices can't both win a race:
	// insert when there is no row yet (base 0), or update only if the version still matches.
	const result = baseVersion === 0
		? await env.DB.prepare('INSERT OR IGNORE INTO progress (id, data, version, updated_at) VALUES (?, ?, 1, ?)')
			.bind(ROW_ID, data, now)
			.run()
		: await env.DB.prepare('UPDATE progress SET data = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ?')
			.bind(data, now, ROW_ID, baseVersion)
			.run();

	const row = await readRow(env);
	if (!result.meta.changes) return jsonResponse({ error: 'conflict', ...toDto(row) }, 409);
	return jsonResponse(toDto(row));
};
