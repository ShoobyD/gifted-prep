import { errorResponse, jsonResponse, type Env, type RequestData } from './types';

// JSON documents, one per row, written with optimistic versioning: every write names the
// version it was based on, so two devices can't silently overwrite each other.

type Context = EventContext<Env, string, RequestData>;

export interface VersionedDocument {
	// A constant table name (never user input) with columns id, data, version, updated_at.
	table: string;
	// The JSON key the document travels under, e.g. "progress".
	field: string;
	// The document's own format version the server accepts.
	formatVersion: number;
	maxBytes: number;
	// Extra shape checks beyond { version: formatVersion }.
	isValid?(value: Record<string, unknown>): boolean;
	// The row a request reads and writes (e.g. the child's), or a Response refusing it.
	rowOf(context: Context): Promise<string | Response>;
}

interface Row {
	data: string;
	version: number;
	updated_at: number;
}

function isDocument(doc: VersionedDocument, value: unknown): value is Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const record = value as Record<string, unknown>;
	return record.version === doc.formatVersion && (doc.isValid?.(record) ?? true);
}

export function versionedHandlers(doc: VersionedDocument) {
	const readRow = (env: Env, id: string) =>
		env.DB.prepare(`SELECT data, version, updated_at FROM ${doc.table} WHERE id = ?`).bind(id).first<Row>();

	const toDto = (row: Row | null) =>
		row
			? { [doc.field]: JSON.parse(row.data) as unknown, version: row.version, updatedAt: row.updated_at }
			: { [doc.field]: null, version: 0, updatedAt: null };

	// The saved document, or null with version 0 when nothing was saved yet.
	const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
		const id = await doc.rowOf(context);
		return id instanceof Response ? id : jsonResponse(toDto(await readRow(context.env, id)));
	};

	// Replaces the document if nobody wrote since baseVersion; otherwise 409 with the
	// current server copy, so the client can merge and retry.
	const onRequestPut: PagesFunction<Env, string, RequestData> = async (context) => {
		const { request, env } = context;
		const id = await doc.rowOf(context);
		if (id instanceof Response) return id;
		const text = await request.text();
		if (text.length > doc.maxBytes) return errorResponse(`${doc.field} too large`, 413);

		let body: Record<string, unknown>;
		try {
			body = JSON.parse(text) as Record<string, unknown>;
		} catch {
			return errorResponse('invalid JSON', 400);
		}
		const value = body?.[doc.field];
		if (!isDocument(doc, value)) return errorResponse(`not a ${doc.field} document`, 400);
		if (!Number.isInteger(body.baseVersion) || (body.baseVersion as number) < 0) {
			return errorResponse('baseVersion must be a non-negative integer', 400);
		}

		const baseVersion = body.baseVersion as number;
		const data = JSON.stringify(value);
		const now = Date.now();

		// Conditional write in one statement, so two devices can't both win a race: insert
		// when there is no row yet (base 0), or update only if the version still matches.
		const result = baseVersion === 0
			? await env.DB.prepare(`INSERT OR IGNORE INTO ${doc.table} (id, data, version, updated_at) VALUES (?, ?, 1, ?)`)
				.bind(id, data, now)
				.run()
			: await env.DB.prepare(`UPDATE ${doc.table} SET data = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ?`)
				.bind(data, now, id, baseVersion)
				.run();

		const row = await readRow(env, id);
		if (!result.meta.changes) return jsonResponse({ error: 'conflict', ...toDto(row) }, 409);
		return jsonResponse(toDto(row));
	};

	return { onRequestGet, onRequestPut };
}
