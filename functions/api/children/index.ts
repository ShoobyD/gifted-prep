import { readJsonObject } from '../../_lib/body';
import { cleanIcon, cleanName, listChildren, MAX_CHILDREN, newId, toChildDto } from '../../_lib/children';
import { errorResponse, jsonResponse, type Env, type RequestData } from '../../_lib/types';

// The logged-in family's children, in order.
export const onRequestGet: PagesFunction<Env, string, RequestData> = async ({ env, data }) =>
	jsonResponse({ children: (await listChildren(env, data.family.id)).map(toChildDto) });

// Adds a child at the end of the family's list: { name, icon? }.
export const onRequestPost: PagesFunction<Env, string, RequestData> = async ({ request, env, data }) => {
	const body = await readJsonObject(request);
	if (body instanceof Response) return body;
	const name = cleanName(body.name);
	const icon = cleanIcon(body.icon);
	if (name === null) return errorResponse('a name of up to 40 characters is needed', 400);
	if (icon === null) return errorResponse('invalid icon', 400);

	const familyId = data.family.id;
	const id = newId('c');
	// The limit and the position are checked in the same statement that inserts.
	const result = await env.DB.prepare(
		`INSERT INTO children (id, family_id, name, icon, position, created_at)
		SELECT ?, ?, ?, ?, COALESCE(MAX(position), -1) + 1, ? FROM children WHERE family_id = ?
		HAVING COUNT(*) < ?`,
	).bind(id, familyId, name, icon, Date.now(), familyId, MAX_CHILDREN).run();
	if (!result.meta.changes) return errorResponse(`a family can have up to ${MAX_CHILDREN} children`, 409);

	return jsonResponse({ child: { id, name, icon }, children: (await listChildren(env, familyId)).map(toChildDto) }, 201);
};
