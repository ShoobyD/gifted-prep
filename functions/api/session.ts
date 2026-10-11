import { isAuthenticated } from '../_lib/session';
import { jsonResponse, type Env } from '../_lib/types';

// Lets the app know whether it runs behind the login (server) or not (plain dev / offline).
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
	return jsonResponse({ authenticated: await isAuthenticated(request, env.SESSION_SECRET) });
};
