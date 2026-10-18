import { readJsonObject } from '../../../_lib/body';
import { cleanIcon, cleanName, newId } from '../../../_lib/children';
import { listFamilies, uniqueViolation } from '../../../_lib/familyList';
import { newPasswordKey, requireAdmin } from '../../../_lib/families';
import { errorResponse, jsonResponse, type Env, type RequestData } from '../../../_lib/types';

// The admin's list of families.
export const onRequestGet: PagesFunction<Env, string, RequestData> = async ({ env, data }) =>
	requireAdmin(data) ?? jsonResponse({ families: await listFamilies(env) });

// Creates a family: { name, password, child?: { name, icon? } }. The family adds its other
// children itself.
export const onRequestPost: PagesFunction<Env, string, RequestData> = async ({ request, env, data }) => {
	const denied = requireAdmin(data);
	if (denied) return denied;
	const body = await readJsonObject(request);
	if (body instanceof Response) return body;

	const name = cleanName(body.name);
	if (name === null) return errorResponse('a name of up to 40 characters is needed', 400);
	const child = body.child as { name?: unknown; icon?: unknown } | undefined;
	const childName = child === undefined ? undefined : cleanName(child?.name);
	const childIcon = child === undefined ? '' : cleanIcon(child?.icon);
	if (childName === null || childIcon === null) return errorResponse('invalid child', 400);
	const key = await newPasswordKey(env, body.password);
	if (key instanceof Response) return key;

	const familyId = newId('f');
	const now = Date.now();
	try {
		await env.DB.batch([
			env.DB.prepare('INSERT INTO families (id, name, password_hash, is_admin, created_at) VALUES (?, ?, ?, 0, ?)')
				.bind(familyId, name, key, now),
			...(childName
				? [env.DB.prepare('INSERT INTO children (id, family_id, name, icon, position, created_at) VALUES (?, ?, ?, ?, 0, ?)')
					.bind(newId('c'), familyId, childName, childIcon, now)]
				: []),
		]);
	} catch (cause) {
		// The unique indexes are the final word (e.g. two requests racing for one name).
		const taken = uniqueViolation(cause);
		if (taken) return errorResponse(taken, 409);
		throw cause;
	}
	return jsonResponse({ created: familyId, families: await listFamilies(env) }, 201);
};
