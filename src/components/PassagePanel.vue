<script setup lang="ts">
import PassageText from './PassageText.vue';
import type { Passage } from '@/types';

defineProps<{ passage: Passage }>();
</script>

<template>
	<details class="passage-panel" open>
		<summary>📖 הַטֶּקְסְט</summary>
		<div class="passage-scroll">
			<PassageText :passage="passage" />
		</div>
	</details>
</template>

<style scoped>
.passage-panel summary {
	padding: 8px 4px;
	font-weight: 700;
	cursor: pointer;
}

/* Portrait: a scrollable panel above the question. */
.passage-scroll {
	max-height: 42vh;
	overflow-y: auto;
	border-radius: var(--radius);
}

/* Landscape tablet: the parent lays text and question side by side. */
@media (min-width: 1000px) {
	.passage-scroll {
		max-height: calc(100vh - 160px);
	}
}
</style>
