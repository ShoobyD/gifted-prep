import { familyOfRequest } from './_lib/families';
import { loginPageResponse } from './_lib/login-page';
import { readSession } from './_lib/session';
import { errorResponse, type Env, type RequestData } from './_lib/types';

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
// for private use, so everything else requires a family login.
export const onRequest: PagesFunction<Env, string, RequestData> = async (context) => {
	const { request, env } = context;
	const path = new URL(request.url).pathname;

	if (OPEN_API_PATHS.has(path) || OPEN_FILES.has(path)) return context.next();

	// API calls also need the family itself (it may have been deleted since it logged in),
	// and pass it on to the function. The app's files only need a valid cookie.
	if (path.startsWith('/api/')) {
		const family = await familyOfRequest(request, env);
		if (!family) return errorResponse('login required', 401);
		context.data.family = family;
		return context.next();
	}
	return (await readSession(request, env.SESSION_SECRET)) ? context.next() : loginPageResponse();
};
