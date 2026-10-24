<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AlbumTabs from './components/AlbumTabs.vue';
import AppIcon from './components/AppIcon.vue';
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

// The child's home is their album: its cover is the bar, and the page has tabs on its edge.
const isAlbum = computed(() => mode.value === 'app' && route.name === 'home');
// Home and the area chapters have the album's tabs on the page's edge.
const hasTabs = computed(() => mode.value === 'app' && !!route.meta.tabs);

const title = computed(() => {
	if (mode.value === 'choice') return 'בְּרוּכִים הַבָּאִים';
	if (mode.value === 'parent') return 'מעקב הורים';
	if (mode.value === 'who') return 'שָׁלוֹם!';
	if (isAlbum.value) return activeChild.value ? `הָאַלְבּוֹם שֶׁל ${activeChild.value.name}` : 'הָאַלְבּוֹם שֶׁלִּי';
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
	<header class="topbar" :class="{ 'topbar--cover': isAlbum }">
		<button
			class="back-btn"
			:class="{ 'is-hidden': isHome }"
			type="button"
			aria-label="חזרה"
			@click="goBack"
		>
			<!-- Back in a right-to-left app points right. -->
			<AppIcon name="prev" />
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
		<!-- The album's own bits on its cover (from the home screen). -->
		<div id="cover-slot" class="cover-slot" />
	</header>

	<main class="page" :class="{ 'page--album': hasTabs }">
		<AlbumTabs v-if="hasTabs" />
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
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
	padding: 12px 16px;
	padding-top: max(12px, env(safe-area-inset-top));
	background: var(--topbar-bg);
	color: var(--on-topbar);
}

.topbar-title {
	flex: 1;
	margin: 0;
	font-family: var(--font-display);
	font-size: 44px;
	font-weight: 700;
	line-height: 1;
	/* Long press opens the device menu, not the browser's own selection or callout. */
	-webkit-touch-callout: none;
	user-select: none;
}

/* The album's cover: its name with the stars and streak under it, the count and the
   child's picture at the end. */
.topbar--cover {
	display: grid;
	grid-template-columns: 1fr auto auto;
	align-items: center;
	gap: 4px 20px;
	padding-inline: 24px;
}

.topbar--cover .cover-slot {
	display: contents;
}

.topbar--cover .topbar-title {
	font-size: 64px;
}

.topbar--cover .back-btn {
	display: none;
}

.cover-slot {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px 20px;
}

.cover-slot:empty {
	display: none;
}

.back-btn {
	display: grid;
	place-items: center;
	width: 56px;
	height: 56px;
	border: 0;
	border-radius: 50%;
	background: var(--on-topbar-soft);
	color: var(--on-topbar);
	font-size: 30px;
	line-height: 1;
}

.back-btn:active {
	background: var(--on-topbar-pressed);
}

.back-btn.is-hidden {
	visibility: hidden;
}

.page {
	--page-pad: 16px;
	--page-top: 24px;
	/* How far the album's tabs stand out of the page. */
	--tab-out: 88px;
	flex: 1;
	width: calc(100% - 24px);
	max-width: 1200px;
	margin: 0 auto 12px;
	padding: var(--page-pad);
	padding-top: var(--page-top);
	border-radius: var(--radius-page);
	background: var(--surface);
	box-shadow: var(--shadow-page);
}

@media (min-width: 700px) {
	.page {
		--page-pad: 32px;
		--page-top: 32px;
		width: calc(100% - 48px);
		margin-bottom: 24px;
		padding: var(--page-pad);
	}

	/* Room on the cover for the tabs, beside the page's edge. */
	.page--album {
		position: relative;
		width: calc(100% - 24px - var(--tab-out) - 16px);
		max-width: 1100px;
		margin-inline-end: auto;
		margin-inline-start: max(calc(var(--tab-out) + 16px), calc((100% - 1100px) / 2));
	}
}

@media (max-width: 699px) {
	.topbar--cover .topbar-title {
		font-size: 44px;
	}
}
</style>
