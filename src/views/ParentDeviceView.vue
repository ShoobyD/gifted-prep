<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import QuestionBank from '@/components/bank/QuestionBank.vue';
import ChildPicker from '@/components/ChildPicker.vue';
import ChildrenManager from '@/components/ChildrenManager.vue';
import ChildSettings from '@/components/ChildSettings.vue';
import FamiliesAdmin from '@/components/FamiliesAdmin.vue';
import ProgressDashboard from '@/components/ProgressDashboard.vue';
import { useDevice } from '@/composables/useDevice';
import { useRemoteProgress } from '@/composables/useRemoteProgress';
import { useSession } from '@/composables/useSession';
import { formatDateTime } from '@/utils/format';

// The whole app on a parent device: each child's progress as last backed up by the tablet,
// the child's settings and the family's children; for the admin also the question bank
// and the families.
const REFRESH_MS = 60_000;

const remote = useRemoteProgress();
type Tab = 'tracking' | 'bank' | 'families' | 'settings';
const session = useSession();
const tab = ref<Tab>('tracking');

const tabs = computed(() => [
	{ id: 'tracking' as const, label: '📊 מעקב' },
	...(session.isAdmin.value
		? [{ id: 'bank' as const, label: '📚 מאגר שאלות' }, { id: 'families' as const, label: '👪 משפחות' }]
		: []),
	{ id: 'settings' as const, label: '⚙️ הגדרות' },
]);
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
		<nav class="tabs" role="tablist">
			<button
				v-for="item in tabs"
				:key="item.id"
				type="button"
				role="tab"
				:aria-selected="tab === item.id"
				:class="{ on: tab === item.id }"
				@click="tab = item.id"
			>
				{{ item.label }}
			</button>
		</nav>

		<ChildPicker v-if="tab === 'tracking' || tab === 'settings'" />

		<QuestionBank v-if="tab === 'bank'" />

		<FamiliesAdmin v-else-if="tab === 'families'" />

		<template v-else-if="tab === 'settings'">
			<ChildSettings />
			<ChildrenManager />

			<section class="card">
				<h2>המכשיר הזה</h2>
				<p class="note">זהו מכשיר הורה: מעקב והגדרות. לא ניתן לתרגל בו.</p>
				<div class="actions">
					<button type="button" class="btn" @click="onChangeDevice">שינוי סוג המכשיר</button>
					<button type="button" class="btn" @click="onLogout">התנתקות</button>
				</div>
			</section>
		</template>

		<template v-else>
			<section class="card refresh">
				<p class="status-line" :class="`tone--${statusLine.tone}`" role="status">{{ statusLine.text }}</p>
				<button type="button" class="btn" :disabled="remote.status.value === 'loading'" @click="remote.refresh()">רענון 🔄</button>
			</section>

			<ProgressDashboard v-if="remote.progress.value" :progress="remote.progress.value" />
		</template>

	</div>
</template>

<style scoped>
.tabs {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
	gap: 8px;
}

.tabs button {
	min-height: 52px;
	border: 0;
	border-radius: var(--radius);
	background: var(--surface);
	box-shadow: var(--shadow);
	font-weight: 700;
}

.tabs button.on {
	background: var(--primary);
	color: #fff;
}

.refresh {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}
</style>
