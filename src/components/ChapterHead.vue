<script setup lang="ts">
// The top of a chapter page: a band in the area's color across the page, with the
// chapter's name and how much of it is done.
defineProps<{
	title: string;
	color: string;
	// The text's color on the band; white unless the color is light.
	ink?: string;
	done: number;
	total: number;
	// What is counted, e.g. "קְטָעִים שֶׁנִּקְרְאוּ".
	unit: string;
}>();
</script>

<template>
	<header class="head" :style="{ '--head': color, '--head-ink': ink ?? 'var(--on-primary)' }">
		<h2 class="title">{{ title }}</h2>
		<p class="count">
			<bdi class="count-num">{{ done }}/{{ total }}</bdi>
			<span>{{ unit }}</span>
		</p>
	</header>
</template>

<style scoped>
/* Out to the page's edges and up to its top; on a phone the tabs sit above it. */
.head {
	display: flex;
	flex-wrap: wrap;
	align-items: flex-end;
	justify-content: space-between;
	gap: 8px 20px;
	margin: calc(-1 * var(--page-top)) calc(-1 * var(--page-pad)) 28px;
	padding: 28px var(--page-pad) 22px;
	border-radius: 22px 6px 0 0;
	background: var(--head);
	color: var(--head-ink);
}

.title {
	margin: 0;
	font-size: 84px;
	line-height: .9;
}

.count {
	display: grid;
	justify-items: end;
	margin: 0;
	font-size: 20px;
	font-weight: 700;
	line-height: 1.2;
}

.count-num {
	font-family: var(--font-display);
	font-size: 56px;
	line-height: 1;
}

@media (max-width: 699px) {
	/* Right under the tabs, closing the gap they leave above the page's content. */
	.head {
		margin-top: -20px;
		border-radius: 0;
		padding-top: 20px;
	}

	.title {
		font-size: 56px;
	}

	.count-num {
		font-size: 44px;
	}
}
</style>
