<script setup lang="ts">
import { computed } from 'vue';
import StickerGrid from '@/components/StickerGrid.vue';
import { useProgress } from '@/composables/useProgress';
import { earnedStickers, STICKERS } from '@/progress/stickers';

const { state } = useProgress();
const count = computed(() => earnedStickers(state.stickers).length);
</script>

<template>
	<p class="count">{{ count }} מִתּוֹךְ {{ STICKERS.length }} מַדְבֵּקוֹת</p>
	<StickerGrid :earned="state.stickers" />
</template>

<style scoped>
.count {
	margin: 0 0 20px;
	text-align: center;
	font-size: 26px;
}
</style>
