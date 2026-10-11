<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import ProgressDashboard from '@/components/ProgressDashboard.vue';
import { useDevice } from '@/composables/useDevice';
import { useRemoteProgress } from '@/composables/useRemoteProgress';
import { useSession } from '@/composables/useSession';
import { formatDateTime } from '@/utils/format';

// The whole app on a parent device: the child's progress as last backed up by the tablet.
// Read-only by design; settings and resets belong to the tablet.
const REFRESH_MS = 60_000;

const remote = useRemoteProgress();
const session = useSession();
const device = useDevice();

const statusLine = computed(() => {
	if (remote.status.value === 'loading' && !remote.progress.value) return { tone: 'busy', text: 'טוען…' };
	if (remote.status.value === 'failed') return { tone: 'warn', text: 'אין חיבור לשרת. מוצגים הנתונים האחרונים שנטענו.' };
	if (!remote.updatedAt.value) return { tone: 'busy', text: 'הטאבלט עוד לא שלח נתונים.' };
	return { tone: 'ok', text: `עודכן מהטאבלט: ${formatDateTime(remote.updatedAt.value)}` };
});

// Fresh numbers whenever the parent looks: on open, on returning to the app, and every minute.
function onVisible() {
	if (document.visibilityState === 'visible') void remote.refresh();
}
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
	void remote.refresh();
	document.addEventListener('visibilitychange', onVisible);
	timer = setInterval(onVisible, REFRESH_MS);
});
onUnmounted(() => {
	document.removeEventListener('visibilitychange', onVisible);
	clearInterval(timer);
});

function onLogout() {
	if (!confirm('להתנתק? כדי להיכנס שוב תצטרכו את הסיסמה.')) return;
	void session.logout();
}

function onChangeDevice() {
	if (!confirm('לשנות את סוג המכשיר?')) return;
	device.setRole(undefined);
}
</script>

<template>
	<div class="parents">
		<section class="card refresh">
			<p class="status-line" :class="`tone--${statusLine.tone}`" role="status">{{ statusLine.text }}</p>
			<button type="button" class="btn" :disabled="remote.status.value === 'loading'" @click="remote.refresh()">רענון 🔄</button>
		</section>

		<ProgressDashboard v-if="remote.progress.value" :progress="remote.progress.value" />

		<section class="card">
			<h2>המכשיר הזה</h2>
			<p class="note">זהו מכשיר מעקב: הוא מציג את מה שהטאבלט גיבה בשרת, ולא ניתן לתרגל בו. הגדרות, ייבוא ואיפוס נעשים בטאבלט, באזור ההורים.</p>
			<div class="actions">
				<button type="button" class="btn" @click="onChangeDevice">שינוי סוג המכשיר</button>
				<button type="button" class="btn" @click="onLogout">התנתקות</button>
			</div>
		</section>
	</div>
</template>

<style scoped>
.refresh {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}
</style>
