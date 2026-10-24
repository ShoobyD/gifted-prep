<script setup lang="ts">
// A heading in a chapter's printed index, ruled off from the rows under it.
defineProps<{ title: string; meta?: string }>();
</script>

<template>
	<div class="heading">
		<h3 class="title">{{ title }}</h3>
		<span v-if="meta" class="meta">{{ meta }}</span>
	</div>
</template>

<style scoped>
.heading {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	justify-content: space-between;
	gap: 4px 16px;
	margin: 36px 0 4px;
	padding-bottom: 10px;
	border-bottom: 3px solid var(--text);
}

.title {
	margin: 0;
	font-family: var(--font-display);
	font-size: 46px;
	line-height: 1;
}

.meta {
	color: var(--muted);
	font-size: 18px;
}
</style>
