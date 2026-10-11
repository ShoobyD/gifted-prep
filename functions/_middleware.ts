import { loginPageResponse } from './_lib/login-page';
import { isAuthenticated } from './_lib/session';
import { errorResponse, type Env } from './_lib/types';

// Must stay open, or nobody could log in.
const OPEN_API_PATHS = new Set(['/api/login', '/api/logout', '/api/session']);

// Chrome fetches the manifest and its icons without cookies when installing the app,
// and crawlers need robots.txt. None of these hold any content.
const OPEN_FILES = new Set([
	'/manifest.webmanifest',
	'/pwa-192.png',
	'/pwa-512.png',
	'/apple-touch-icon.png',
	'/favicon-64.png',
	'/icon.svg',
	'/robots.txt',
]);

// The gate: runs before every request. The whole site holds copyrighted test material
// for private use, so everything else requires the family login.
export const onRequest: PagesFunction<Env> = async (context) => {
	const { request, env } = context;
	const path = new URL(request.url).pathname;

	if (OPEN_API_PATHS.has(path) || OPEN_FILES.has(path)) return context.next();
	if (await isAuthenticated(request, env.SESSION_SECRET)) return context.next();

	// A full page for people, a short error for API calls.
	return path.startsWith('/api/') ? errorResponse('login required', 401) : loginPageResponse();
};
