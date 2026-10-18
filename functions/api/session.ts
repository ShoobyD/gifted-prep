import { familyOfRequest } from '../_lib/families';
import { jsonResponse, type Env } from '../_lib/types';

// Lets the app know whether it runs behind the login (server) or not (plain dev / offline),
// and as which family.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
	const family = await familyOfRequest(request, env);
	return jsonResponse(family
		? { authenticated: true, family: { id: family.id, name: family.name, admin: family.isAdmin } }
		: { authenticated: false });
};
