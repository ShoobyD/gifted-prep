<script setup lang="ts">
import { ref } from 'vue';
import AppIcon from './AppIcon.vue';
import PassageText from './PassageText.vue';
import type { Passage } from '@/types';

// The passage beside its questions: a leaf slipped into the album, headed by its own title.
// The title row is the switch that hides the text (to see more of the question on a phone)
// and shows it again; folded, the title stays, so it is clear which text the question is on.
defineProps<{ passage: Passage }>();

const open = ref(true);
</script>

<template>
	<section class="passage-panel">
		<!-- A heading holding the switch: the accessible shape of a show/hide section. -->
		<h2 class="heading">
			<button type="button" class="head" :aria-expanded="open" @click="open = !open">
				<AppIcon name="book" class="head-icon" />
				<span class="title">{{ passage.title }}</span>
				<span class="switch">
					<AppIcon :name="open ? 'up' : 'down'" />
					{{ open ? 'לְהַסְתִּיר' : 'לְהַרְאוֹת' }}
				</span>
			</button>
		</h2>
		<div v-show="open" class="passage-scroll">
			<PassageText :passage="passage" headless />
		</div>
	</section>
</template>

<style scoped>
/* A leaf slipped into the album: tinted paper on the page. */
.passage-panel {
	border: 2px solid var(--line-soft);
	border-radius: var(--radius);
	background: var(--tint-soft);
}

.heading {
	margin: 0;
}

.head {
	display: flex;
	align-items: center;
	gap: 12px;
	width: 100%;
	padding: 12px 16px;
	border: 0;
	background: none;
	color: inherit;
	text-align: start;
}

.head-icon {
	color: var(--reading);
	font-size: 28px;
}

.title {
	flex: 1;
	font-family: var(--font-display);
	font-size: 40px;
	line-height: 1.1;
}

/* What tapping the title does, said in words. */
.switch {
	flex: none;
	display: flex;
	align-items: center;
	gap: 6px;
	min-height: 44px;
	padding: 0 14px;
	border: 2px solid var(--line);
	border-radius: 999px;
	background: var(--surface);
	color: var(--muted);
	font-family: var(--font);
	font-size: 16px;
	font-weight: 700;
}

.head:active .switch {
	transform: translateY(1px);
}

/* Portrait: a scrollable panel above the question. */
.passage-scroll {
	max-height: 42vh;
	overflow-y: auto;
	padding: 0 20px 16px 16px;
	scrollbar-color: var(--line-strong) transparent;
}

/* Landscape tablet: the parent lays text and question side by side. */
@media (min-width: 1000px) {
	.passage-scroll {
		max-height: calc(100vh - 220px);
	}
}
</style>
