import { jsonResponse, type Env } from '../../../_lib/types';

interface HistoryRow {
	version: number;
	kind: string;
	data: string;
	saved_at: number;
}

// Every saved version of an item, newest first. Restoring one is an ordinary save of its data.
export const onRequestGet: PagesFunction<Env, 'id'> = async ({ params, env }) => {
	const { results } = await env.DB.prepare(
		'SELECT version, kind, data, saved_at FROM bank_history WHERE id = ? ORDER BY version DESC',
	).bind(String(params.id)).all<HistoryRow>();
	return jsonResponse({
		versions: results.map((row) => ({
			version: row.version,
			kind: row.kind,
			data: JSON.parse(row.data) as unknown,
			savedAt: row.saved_at,
		})),
	});
};
