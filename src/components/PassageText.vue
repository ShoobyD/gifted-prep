<script setup lang="ts">
import { computed } from 'vue';
import type { Passage } from '@/types';

const props = defineProps<{
	passage: Passage;
	// Inside the practice panel, which carries the title and the leaf around the text.
	headless?: boolean;
}>();

// Continuous line numbers across paragraphs, as printed in the booklet.
const numbered = computed(() => {
	let n = 0;
	return props.passage.paragraphs.map((lines) => lines.map((text) => ({ n: ++n, text })));
});
</script>

<template>
	<article class="passage" :class="{ 'passage--headless': headless }">
		<h2 v-if="!headless" class="title">{{ passage.title }}</h2>
		<p v-for="(lines, p) in numbered" :key="p" class="paragraph">
			<span v-for="line in lines" :key="line.n" class="line">
				<span class="num" aria-hidden="true">{{ line.n }}</span>
				<span class="text">{{ line.text }}</span>
			</span>
		</p>
	</article>
</template>

<style scoped>
/* A leaf slipped into the album: tinted paper on the page. */
.passage {
	padding: 16px 20px 16px 16px;
	border-radius: var(--radius);
	background: var(--tint-soft);
	border: 2px solid var(--line-soft);
	user-select: text;
}

.passage--headless {
	padding: 0;
	border: 0;
	border-radius: 0;
	background: none;
}

.title {
	margin: 0 0 8px;
	font-size: 40px;
	line-height: 1.1;
	text-align: center;
}

.paragraph {
	margin: 0 0 12px;
}

.line {
	display: flex;
	gap: 12px;
	font-size: 24px;
	line-height: 1.9;
}

.num {
	flex: none;
	width: 1.6em;
	color: var(--muted);
	font-size: 16px;
	line-height: 2.85;
	text-align: center;
}
</style>
