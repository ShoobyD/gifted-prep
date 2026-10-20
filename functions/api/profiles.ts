import { listProfiles } from '../_lib/profiles';
import { jsonResponse, type Env, type RequestData } from '../_lib/types';

// The children's achievements, for every logged-in family to see each other's ("friends").
export const onRequestGet: PagesFunction<Env, string, RequestData> = async ({ env }) =>
	jsonResponse(await listProfiles(env, new Date()));
