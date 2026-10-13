import { readRevision, rowToDto, type ItemRow } from '../../_lib/bank';
import { jsonResponse, type Env } from '../../_lib/types';

// The whole bank (about 100 KB), or just "unchanged" when the caller already has the
// current revision (?rev=N) — devices ask this every time the app opens.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
	const revision = await readRevision(env);
	const known = new URL(request.url).searchParams.get('rev');
	if (known !== null && Number(known) === revision) return jsonResponse({ unchanged: true, revision });

	const { results } = await env.DB.prepare(
		'SELECT id, kind, data, hidden, version, updated_at FROM bank_items ORDER BY position, id',
	).all<ItemRow>();
	return jsonResponse({ revision, items: results.map(rowToDto) });
};
