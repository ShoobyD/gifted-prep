import { findFamilyByPassword } from '../_lib/families';
import { createSessionToken, sessionCookie } from '../_lib/session';
import { errorResponse, jsonResponse, type Env } from '../_lib/types';

// A pause after a wrong password, so systematic guessing takes forever.
const WRONG_PASSWORD_DELAY_MS = 1000;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
	// Fail closed when the secret isn't configured.
	if (!env.SESSION_SECRET) return errorResponse('האתר עוד לא הוגדר', 500);

	let password: string;
	try {
		const body = (await request.json()) as { password?: unknown };
		password = typeof body?.password === 'string' ? body.password : '';
	} catch {
		return errorResponse('בקשה לא תקינה', 400);
	}

	// The password alone says which family it is.
	const family = password ? await findFamilyByPassword(env, password) : null;
	if (!family) {
		await new Promise((resolve) => setTimeout(resolve, WRONG_PASSWORD_DELAY_MS));
		return errorResponse('הסיסמה לא נכונה', 401);
	}

	const response = jsonResponse({ ok: true });
	response.headers.set('Set-Cookie', sessionCookie(await createSessionToken(env.SESSION_SECRET, Date.now(), family.id)));
	return response;
};
