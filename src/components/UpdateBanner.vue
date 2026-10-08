<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue';

// Registers the service worker and offers a new version instead of reloading on its own.
const { needRefresh, updateServiceWorker } = useRegisterSW();
</script>

<template>
	<div v-if="needRefresh" class="banner" role="status">
		<span>יֵשׁ גִּרְסָה חֲדָשָׁה 🎁</span>
		<button type="button" class="update" @click="updateServiceWorker(true)">עִדְכּוּן</button>
		<button type="button" class="later" aria-label="אחר כך" @click="needRefresh = false">✕</button>
	</div>
</template>

<style scoped>
.banner {
	position: fixed;
	inset-inline: 16px;
	bottom: max(16px, env(safe-area-inset-bottom));
	z-index: 10;
	display: flex;
	align-items: center;
	gap: 12px;
	max-width: 480px;
	margin: 0 auto;
	padding: 12px 16px;
	border-radius: 18px;
	background: var(--text);
	color: #fff;
	box-shadow: 0 6px 20px rgba(0, 0, 0, .25);
}

.banner span {
	flex: 1;
}

.update {
	min-height: 48px;
	padding: 0 20px;
	border: 0;
	border-radius: 14px;
	background: var(--primary);
	color: #fff;
	font-weight: 700;
}

.later {
	width: 40px;
	height: 40px;
	border: 0;
	border-radius: 50%;
	background: transparent;
	color: #fff;
}
</style>
