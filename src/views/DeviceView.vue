<script setup lang="ts">
import { computed, ref } from 'vue';
import ParentGate from '@/components/ParentGate.vue';
import TabletModePicker from '@/components/TabletModePicker.vue';
import { useChildren } from '@/composables/useChildren';
import { useDevice } from '@/composables/useDevice';
import { useSession } from '@/composables/useSession';
import { useSync } from '@/composables/useSync';
import { useTablet, type TabletMode } from '@/composables/useTablet';
import { formatDateTime } from '@/utils/format';

// The tablet's hidden technical menu (long press on the title, then the grown-up check).
// Everything else is managed from a parent device; this only covers what must be done on
// the tablet itself.
const unlocked = ref(false);
const session = useSession();
const sync = useSync();
const device = useDevice();
const tablet = useTablet();
const { children, activeChild } = useChildren();

function onPickMode(mode: TabletMode, childId?: string) {
	tablet.setMode(mode, childId);
}

const syncState = computed(() => {
	const { status, meta } = sync;
	if (status.value === 'syncing') return { tone: 'busy', text: 'מסנכרן…' };
	if (status.value === 'failed') {
		return meta.dirty
			? { tone: 'warn', text: 'אין חיבור לשרת. השינויים שמורים במכשיר ויישלחו כשהחיבור יחזור.' }
			: { tone: 'warn', text: 'אין חיבור לשרת.' };
	}
	if (meta.dirty) return { tone: 'busy', text: 'יש שינויים שממתינים לשליחה.' };
	if (!meta.lastSyncedAt) return { tone: 'busy', text: 'עוד לא סונכרן.' };
	return { tone: 'ok', text: `מסונכרן ✓ · ${formatDateTime(meta.lastSyncedAt)}` };
});

function onChangeDevice() {
	if (!confirm('לשנות את סוג המכשיר?')) return;
	device.setRole(undefined);
}

function onLogout() {
	if (!confirm('להתנתק? כדי להיכנס שוב תצטרכו את הסיסמה.')) return;
	void session.logout();
}
</script>

<template>
	<ParentGate v-if="!unlocked" @unlock="unlocked = true" />

	<div v-else class="parents">
		<section class="card">
			<h2>הטאבלט של הילד</h2>
			<p class="note">מעקב, הגדרות, איפוס וניהול המאגר נעשים ממכשיר הורה (טלפון או מחשב), בכתובת של האתר.</p>
		</section>

		<section v-if="children.length > 1" class="card">
			<h2>של מי הטאבלט?</h2>
			<TabletModePicker :mode="tablet.mode.value" :child-id="activeChild?.id" @pick="onPickMode" />
		</section>

		<section v-if="session.authenticated.value" class="card">
			<h2>גיבוי בשרת</h2>
			<p class="status-line" :class="`tone--${syncState.tone}`" role="status">{{ syncState.text }}</p>
			<div class="actions">
				<button type="button" class="btn" :disabled="sync.status.value === 'syncing'" @click="sync.syncNow()">סנכרון עכשיו</button>
			</div>
		</section>
		<section v-else class="card">
			<h2>גיבוי בשרת</h2>
			<p class="status-line tone--warn">האפליקציה לא מחוברת לשרת כרגע. ההתקדמות נשמרת במכשיר ותישלח כשיהיה חיבור.</p>
		</section>

		<section v-if="session.authenticated.value" class="card">
			<h2>המכשיר הזה</h2>
			<div class="actions">
				<button type="button" class="btn" @click="onChangeDevice">שינוי סוג המכשיר</button>
				<button type="button" class="btn" @click="onLogout">התנתקות</button>
			</div>
		</section>
	</div>
</template>
