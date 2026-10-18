import { readJsonObject } from '../../../_lib/body';
import { cleanName } from '../../../_lib/children';
import { listFamilies, uniqueViolation } from '../../../_lib/familyList';
import { newPasswordKey, readFamily, requireAdmin } from '../../../_lib/families';
import { errorResponse, jsonResponse, type Env, type RequestData } from '../../../_lib/types';

// Renames a family or sets its password: { name?, password? }. Setting the admin family's
// own password retires FAMILY_PASSWORD for it.
export const onRequestPatch: PagesFunction<Env, 'id', RequestData> = async ({ request, env, data, params }) => {
	const denied = requireAdmin(data);
	if (denied) return denied;
	const family = await readFamily(env, String(params.id));
	if (!family) return errorResponse('no such family', 404);
	const body = await readJsonObject(request);
	if (body instanceof Response) return body;

	const name = body.name === undefined ? family.name : cleanName(body.name);
	if (name === null) return errorResponse('a name of up to 40 characters is needed', 400);
	const key = body.password === undefined ? undefined : await newPasswordKey(env, body.password, family.id);
	if (key instanceof Response) return key;

	try {
		await (key === undefined
			? env.DB.prepare('UPDATE families SET name = ? WHERE id = ?').bind(name, family.id)
			: env.DB.prepare('UPDATE families SET name = ?, password_hash = ? WHERE id = ?').bind(name, key, family.id)
		).run();
	} catch (cause) {
		const taken = uniqueViolation(cause);
		if (taken) return errorResponse(taken, 409);
		throw cause;
	}
	return jsonResponse({ families: await listFamilies(env) });
};

// Deletes a family with its children and their progress; its devices are logged out on
// their next request. Never the admin's own family.
export const onRequestDelete: PagesFunction<Env, 'id', RequestData> = async ({ env, data, params }) => {
	const denied = requireAdmin(data);
	if (denied) return denied;
	const family = await readFamily(env, String(params.id));
	if (!family) return errorResponse('no such family', 404);
	if (family.isAdmin) return errorResponse('the admin family cannot be deleted', 409);

	await env.DB.batch([
		env.DB.prepare('DELETE FROM progress WHERE id IN (SELECT id FROM children WHERE family_id = ?)').bind(family.id),
		env.DB.prepare('DELETE FROM children WHERE family_id = ?').bind(family.id),
		env.DB.prepare('DELETE FROM families WHERE id = ?').bind(family.id),
	]);
	return jsonResponse({ deleted: family.id, families: await listFamilies(env) });
};
