<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const isHome = computed(() => route.name === 'home');

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
		<h1 class="topbar-title">{{ route.meta.title }}</h1>
	</header>

	<main class="page">
		<!-- Keyed so a new practice set always starts a fresh session. -->
		<RouterView :key="route.fullPath" />
	</main>
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
	margin: 0;
	font-size: 26px;
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
