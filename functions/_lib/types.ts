// Shared server code. Files under functions/ whose name starts with "_" are not routes.

// Bindings Cloudflare injects into functions, per wrangler.toml.
export interface Env {
	DB: D1Database;
	// The family password. An encrypted variable in the dashboard; .dev.vars locally.
	FAMILY_PASSWORD?: string;
	// Key for signing the session cookie. Also an encrypted variable.
	SESSION_SECRET?: string;
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
