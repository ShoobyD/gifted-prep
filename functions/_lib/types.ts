// Shared server code. Files under functions/ whose name starts with "_" are not routes.
import type { Family } from './families';

// Bindings Cloudflare injects into functions, per wrangler.toml.
export interface Env {
	DB: D1Database;
	// The admin family's password until it sets one in the app. An encrypted variable in
	// the dashboard; .dev.vars locally.
	FAMILY_PASSWORD?: string;
	// Key for signing the session cookie and for hashing family passwords. Also an
	// encrypted variable. Changing it logs everyone out and voids every family password.
	SESSION_SECRET?: string;
}

// What the gate hands to API functions (context.data): the logged-in family.
export interface RequestData extends Record<string, unknown> {
	family: Family;
}

export function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			// Progress must always be fresh; never let a cache answer for the server.
			'Cache-Control': 'no-store',
		},
	});
}

export function errorResponse(message: string, status: number): Response {
	return jsonResponse({ error: message }, status);
}
