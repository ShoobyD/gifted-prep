import { ref } from 'vue';
import { contentApi } from '@/content/contentApi';
import { emptyOverrides, parseOverrides, type OverridesChange } from '@/content/overrides';
import { useContent } from './useContent';
import { useContentSync } from './useContentSync';

// Saves the parent's changes to the question bank. A change is an intent (e.g. "hide q7"),
// applied to the newest copy: if another device saved meanwhile, the server's copy is taken
// and the intent applied again on top, so nothing anyone saved is overwritten.

const MAX_ATTEMPTS = 3;

const saving = ref(false);
const error = ref('');

async function update(change: OverridesChange): Promise<boolean> {
	const sync = useContentSync();
	const content = useContent();
	saving.value = true;
	error.value = '';
	try {
		let base = content.overrides.value;
		let baseVersion = sync.version.value;
		for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
			const result = await contentApi.put(change(base), baseVersion);
			if (result.ok) {
				sync.accept(result.copy);
				return true;
			}
			// Someone saved in between: start again from their copy.
			const { conflict } = result;
			sync.accept(conflict);
			base = conflict.overrides === null ? emptyOverrides() : parseOverrides(conflict.overrides) ?? emptyOverrides();
			baseVersion = conflict.version;
		}
		error.value = 'השמירה לא הצליחה כי מכשיר אחר שומר באותו זמן. נסו שוב.';
		return false;
	} catch {
		error.value = 'אין חיבור לשרת, והשינוי לא נשמר.';
		return false;
	} finally {
		saving.value = false;
	}
}

export function useContentEditor() {
	return { saving, error, update };
}
