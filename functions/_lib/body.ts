import { errorResponse } from './types';

// A small JSON object body, or a Response refusing it.
export async function readJsonObject(request: Request, maxBytes = 4096): Promise<Record<string, unknown> | Response> {
	const text = await request.text();
	if (text.length > maxBytes) return errorResponse('body too large', 413);
	try {
		const body = JSON.parse(text) as unknown;
		if (!body || typeof body !== 'object' || Array.isArray(body)) return errorResponse('invalid body', 400);
		return body as Record<string, unknown>;
	} catch {
		return errorResponse('invalid JSON', 400);
	}
}
