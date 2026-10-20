import { ref, shallowRef } from 'vue';
import { parseProfiles, profilesApi, type Profiles } from '@/family/profilesApi';

// The children's profiles, fetched when the friends screen opens. The last list is kept on
// the device, so the screen also shows something offline.

const CACHE_KEY = 'gifted-prep:profiles';

function loadCache(): Profiles | undefined {
	try {
		return parseProfiles(JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null'));
	} catch {
		return undefined;
	}
}

const data = shallowRef<Profiles | undefined>(loadCache());
const status = ref<'idle' | 'loading' | 'failed'>('idle');

async function refresh() {
	status.value = 'loading';
	try {
		data.value = await profilesApi.get();
		status.value = 'idle';
		try {
			localStorage.setItem(CACHE_KEY, JSON.stringify(data.value));
		} catch {
			// Not cached; fetched again next time.
		}
	} catch {
		status.value = 'failed';
	}
}

export function useProfiles() {
	return { data, status, refresh };
}
