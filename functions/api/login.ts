import { createSessionToken, secretsMatch, sessionCookie } from '../_lib/session';
import { errorResponse, jsonResponse, type Env } from '../_lib/types';

// A pause after a wrong password, so systematic guessing takes forever.
const WRONG_PASSWORD_DELAY_MS = 1000;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
	// Fail closed when the secrets aren't configured.
	if (!env.FAMILY_PASSWORD || !env.SESSION_SECRET) return errorResponse('האתר עוד לא הוגדר', 500);

	let password: string;
	try {
		const body = (await request.json()) as { password?: unknown };
		password = typeof body?.password === 'string' ? body.password : '';
	} catch {
		return errorResponse('בקשה לא תקינה', 400);
	}

	if (!password || !(await secretsMatch(password, env.FAMILY_PASSWORD, env.SESSION_SECRET))) {
		await new Promise((resolve) => setTimeout(resolve, WRONG_PASSWORD_DELAY_MS));
		return errorResponse('הסיסמה לא נכונה', 401);
	}

	const response = jsonResponse({ ok: true });
	response.headers.set('Set-Cookie', sessionCookie(await createSessionToken(env.SESSION_SECRET, Date.now())));
	return response;
};
