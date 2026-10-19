import { computed, ref } from 'vue';

export interface SessionFamily {
	id: string;
	name: string;
	// The admin family edits the question bank and manages the other families.
	admin: boolean;
}

// undefined until known; stays undefined without a server (plain `npm run dev`, offline),
// where /api/session doesn't answer with JSON.
const authenticated = ref<boolean>();
const family = ref<SessionFamily>();

async function check() {
	try {
		const response = await fetch('/api/session', { cache: 'no-store' });
		const data = (await response.json()) as { authenticated?: unknown; family?: SessionFamily };
		authenticated.value = data.authenticated === true;
		family.value = authenticated.value ? data.family : undefined;
	} catch {
		// No server behind the app.
	}
}

// Logging out must also drop the offline copy: otherwise the service worker keeps
// serving the cached app and the device stays effectively logged in.
async function logout() {
	await fetch('/api/logout', { method: 'POST' });
	const registrations = (await navigator.serviceWorker?.getRegistrations()) ?? [];
	await Promise.all(registrations.map((r) => r.unregister()));
	await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
	location.reload();
}

const isAdmin = computed(() => family.value?.admin === true);

export function useSession() {
	if (authenticated.value === undefined) void check();
	return { authenticated, family, isAdmin, check, logout };
}
