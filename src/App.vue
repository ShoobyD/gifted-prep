<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DeviceChoice from './components/DeviceChoice.vue';
import UpdateBanner from './components/UpdateBanner.vue';
import { useDevice } from './composables/useDevice';
import { useContentSync } from './composables/useContentSync';
import { useDeviceReport } from './composables/useDeviceReport';
import { useSync } from './composables/useSync';
import ParentDeviceView from './views/ParentDeviceView.vue';

const route = useRoute();
const router = useRouter();
const device = useDevice();

// Keeps the progress backed up on the server whenever the app runs behind its login.
useSync();
// Applies the parent's question-bank changes, from the local copy and then the server.
useContentSync();
// The child's tablet reports whether it has a Hebrew voice, for the parent's settings.
useDeviceReport();

// Behind the login, a device first says what it is; a parent device shows only the dashboard.
const mode = computed(() => (device.needsChoice.value ? 'choice' : device.isParent.value ? 'parent' : 'app'));

const title = computed(() => {
	if (mode.value === 'choice') return 'בְּרוּכִים הַבָּאִים';
	if (mode.value === 'parent') return 'מעקב הורים';
	return route.meta.title;
});

const isHome = computed(() => mode.value !== 'app' || route.name === 'home');

// The tablet's hidden technical menu: a long press on the title (then the grown-up check).
// Long enough that a child tapping around won't open it by chance.
const LONG_PRESS_MS = 1500;
let pressTimer: ReturnType<typeof setTimeout> | undefined;

function startPress() {
	if (mode.value !== 'app') return;
	pressTimer = setTimeout(() => router.push({ name: 'device' }), LONG_PRESS_MS);
}

function cancelPress() {
	clearTimeout(pressTimer);
}

function goBack() {
	// Pop when we came from inside the app; otherwise (deep link) replace with home.
	if (window.history.state?.back) {
		router.back();
	} else {
		router.replace({ name: 'home' });
	}
}
</script>

<template>
	<header class="topbar">
		<button
			class="back-btn"
			:class="{ 'is-hidden': isHome }"
			type="button"
			aria-label="חזרה"
			@click="goBack"
		>
			→
		</button>
		<h1
			class="topbar-title"
			@pointerdown="startPress"
			@pointerup="cancelPress"
			@pointerleave="cancelPress"
			@pointercancel="cancelPress"
			@contextmenu.prevent
		>
			{{ title }}
		</h1>
	</header>

	<main class="page">
		<DeviceChoice v-if="mode === 'choice'" />
		<ParentDeviceView v-else-if="mode === 'parent'" />
		<!-- Keyed so a new practice set always starts a fresh session. -->
		<RouterView v-else :key="route.fullPath" />
	</main>

	<UpdateBanner />
</template>

<style scoped>
.topbar {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px 16px;
	padding-top: max(12px, env(safe-area-inset-top));
	background: var(--primary);
	color: #fff;
}

.topbar-title {
	flex: 1;
	margin: 0;
	font-size: 26px;
	/* Long press opens the device menu, not the browser's own selection or callout. */
	-webkit-touch-callout: none;
	user-select: none;
}

.back-btn {
	width: 56px;
	height: 56px;
	border: 0;
	border-radius: 50%;
	background: rgba(255, 255, 255, .2);
	color: #fff;
	font-size: 30px;
	line-height: 1;
}

.back-btn:active {
	background: rgba(255, 255, 255, .35);
}

.back-btn.is-hidden {
	visibility: hidden;
}

.page {
	flex: 1;
	width: 100%;
	max-width: 1200px;
	margin: 0 auto;
	padding: 24px 16px;
}
</style>
