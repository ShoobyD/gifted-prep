<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue';
import AppIcon from './AppIcon.vue';

// Registers the service worker and offers a new version instead of reloading on its own.
const { needRefresh, updateServiceWorker } = useRegisterSW();
</script>

<template>
	<div v-if="needRefresh" class="banner" role="status">
		<AppIcon name="sparkle" class="sparkle" />
		<span>יֵשׁ גִּרְסָה חֲדָשָׁה</span>
		<button type="button" class="update" @click="updateServiceWorker(true)">עִדְכּוּן</button>
		<button type="button" class="later" aria-label="אחר כך" @click="needRefresh = false"><AppIcon name="close" /></button>
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
	color: var(--on-primary);
	box-shadow: var(--shadow-float);
}

.banner span {
	flex: 1;
}

.sparkle {
	color: var(--gold);
	font-size: 24px;
}

.update {
	min-height: 48px;
	padding: 0 20px;
	border: 0;
	border-radius: 14px;
	background: var(--primary);
	color: var(--on-primary);
	font-weight: 700;
}

.later {
	display: grid;
	place-items: center;
	width: 40px;
	height: 40px;
	font-size: 22px;
	border: 0;
	border-radius: 50%;
	background: transparent;
	color: var(--on-primary);
}
</style>
