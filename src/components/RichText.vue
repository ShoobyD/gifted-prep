<script setup lang="ts">
import { computed } from 'vue';

// Hebrew text with inline math between $...$ (e.g. "בְּסַךְ הַכֹּל $20 − 12 = 8$").
// Math segments are isolated as LTR so the bidi algorithm doesn't reorder them.
const props = defineProps<{ text: string }>();

const segments = computed(() =>
	props.text.split('$').map((value, i) => ({ value, isMath: i % 2 === 1 })),
);
</script>

<template>
	<template v-for="(segment, i) in segments" :key="i">
		<bdi v-if="segment.isMath" dir="ltr" class="inline-math">{{ segment.value }}</bdi>
		<template v-else>{{ segment.value }}</template>
	</template>
</template>

<style scoped>
.inline-math {
	white-space: nowrap;
}
</style>
