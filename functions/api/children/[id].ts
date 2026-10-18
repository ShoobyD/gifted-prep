import { readJsonObject } from '../../_lib/body';
import { childOfFamily, cleanIcon, cleanName, listChildren, toChildDto } from '../../_lib/children';
import { errorResponse, jsonResponse, type Env, type RequestData } from '../../_lib/types';

// One child of the logged-in family. Another family's child is "not found", never touched.

// Renames a child or changes its icon: { name?, icon? }.
export const onRequestPatch: PagesFunction<Env, 'id', RequestData> = async ({ request, env, data, params }) => {
	const child = await childOfFamily(env, data.family.id, String(params.id));
	if (!child) return errorResponse('no such child', 404);
	const body = await readJsonObject(request);
	if (body instanceof Response) return body;

	const name = body.name === undefined ? child.name : cleanName(body.name);
	const icon = body.icon === undefined ? child.icon : cleanIcon(body.icon);
	if (name === null) return errorResponse('a name of up to 40 characters is needed', 400);
	if (icon === null) return errorResponse('invalid icon', 400);

	await env.DB.prepare('UPDATE children SET name = ?, icon = ? WHERE id = ?').bind(name, icon, child.id).run();
	return jsonResponse({ child: { id: child.id, name, icon }, children: (await listChildren(env, data.family.id)).map(toChildDto) });
};

// Removes a child and its progress. The last child stays: progress needs someone to belong to.
export const onRequestDelete: PagesFunction<Env, 'id', RequestData> = async ({ env, data, params }) => {
	const familyId = data.family.id;
	const child = await childOfFamily(env, familyId, String(params.id));
	if (!child) return errorResponse('no such child', 404);
	if ((await listChildren(env, familyId)).length <= 1) return errorResponse('the last child cannot be removed', 409);

	await env.DB.batch([
		env.DB.prepare('DELETE FROM progress WHERE id = ?').bind(child.id),
		env.DB.prepare('DELETE FROM children WHERE id = ? AND family_id = ?').bind(child.id, familyId),
	]);
	return jsonResponse({ deleted: child.id, children: (await listChildren(env, familyId)).map(toChildDto) });
};
