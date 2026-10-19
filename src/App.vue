<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DeviceChoice from './components/DeviceChoice.vue';
import UpdateBanner from './components/UpdateBanner.vue';
import WhoIsPracticing from './components/WhoIsPracticing.vue';
import { useChildren } from './composables/useChildren';
import { useDevice } from './composables/useDevice';
import { useContentSync } from './composables/useContentSync';
import { useDeviceReport } from './composables/useDeviceReport';
import { useSync } from './composables/useSync';
import { useTablet } from './composables/useTablet';
import ParentDeviceView from './views/ParentDeviceView.vue';

const route = useRoute();
const router = useRouter();
const device = useDevice();
const tablet = useTablet();
const { activeChild } = useChildren();

// Keeps the progress backed up on the server whenever the app runs behind its login.
useSync();
// Applies the parent's question-bank changes, from the local copy and then the server.
useContentSync();
// The child's tablet reports whether it has a Hebrew voice, for the parent's settings.
useDeviceReport();

// Behind the login, a device first says what it is; a parent device shows only the dashboard;
// a shared tablet asks who is practicing.
const mode = computed(() => {
	if (device.needsChoice.value) return 'choice';
	if (device.isParent.value) return 'parent';
	return tablet.needsChoice.value ? 'who' : 'app';
});

const title = computed(() => {
	if (mode.value === 'choice') return 'בְּרוּכִים הַבָּאִים';
	if (mode.value === 'parent') return 'מעקב הורים';
	if (mode.value === 'who') return 'שָׁלוֹם!';
	return route.meta.title;
});

// Another child picks up the tablet: start from home, not inside the previous child's session.
function onChoose(childId: string) {
	const changed = childId !== activeChild.value?.id;
	tablet.choose(childId);
	if (changed && route.name !== 'home') void router.replace({ name: 'home' });
}

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
		<WhoIsPracticing v-else-if="mode === 'who'" @choose="onChoose" />
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
