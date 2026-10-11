import { clearedSessionCookie } from '../_lib/session';
import { jsonResponse, type Env } from '../_lib/types';

export const onRequestPost: PagesFunction<Env> = async () => {
	const response = jsonResponse({ ok: true });
	response.headers.set('Set-Cookie', clearedSessionCookie());
	return response;
};
