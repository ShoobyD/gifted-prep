<script setup lang="ts">
// The app's drawn icons, one stroke on a 24×24 grid, in the text's color.
defineProps<{
	name:
		| 'speaker' | 'stop' | 'erase' | 'next' | 'prev' | 'check' | 'retry' | 'show' | 'book'
		| 'facts' | 'paper' | 'sparkle' | 'pencil' | 'clock' | 'trophy' | 'star' | 'flame' | 'sticker' | 'close' | 'friends' | 'up' | 'down' | 'tablet' | 'chart'
		| 'exercise' | 'missing' | 'compare' | 'cart' | 'apple' | 'shapes' | 'dice' | 'medal';
}>();
</script>

<template>
	<svg
		class="icon"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2.4"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<template v-if="name === 'speaker'">
			<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
			<path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />
		</template>
		<rect v-else-if="name === 'stop'" x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" />
		<template v-else-if="name === 'erase'">
			<path d="M9 5.5h10.5v13H9L3.5 12z" />
			<path d="M11.5 9.5l5 5M16.5 9.5l-5 5" />
		</template>
		<!-- Forward in a right-to-left page points left. -->
		<path v-else-if="name === 'next'" d="M19 12H5M11 6l-6 6 6 6" />
		<path v-else-if="name === 'check'" d="M4.5 12.5l5 5 10-11" />
		<template v-else-if="name === 'retry'">
			<path d="M5 12a7 7 0 1 0 2.1-5" />
			<path d="M4.5 3.5v4.5H9" />
		</template>
		<template v-else-if="name === 'show'">
			<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
			<circle cx="12" cy="12" r="3" fill="currentColor" />
		</template>
		<template v-else-if="name === 'book'">
			<path d="M12 6.5C10 5 6.5 4.5 3.5 5v13c3-.5 6.5 0 8.5 1.5 2-1.5 5.5-2 8.5-1.5V5c-3-.5-6.5 0-8.5 1.5z" />
			<path d="M12 6.5v13" />
		</template>
		<path v-else-if="name === 'prev'" d="M5 12h14M13 6l6 6-6 6" />
		<template v-else-if="name === 'facts'">
			<circle cx="10.5" cy="10.5" r="6" />
			<path d="M15 15l5.5 5.5" />
		</template>
		<template v-else-if="name === 'paper'">
			<path d="M6 3h9l4 4v14H6z" />
			<path d="M15 3v4h4M9 12h7M9 16h5" />
		</template>
		<path v-else-if="name === 'sparkle'" d="M12 3l2 6.5 6.5 2.5-6.5 2.5L12 21l-2-6.5L3.5 12 10 9.5z" />
		<template v-else-if="name === 'pencil'">
			<path d="M15 4.5l4.5 4.5L8.5 20H4v-4.5z" />
			<path d="M12.5 7l4.5 4.5" />
		</template>
		<template v-else-if="name === 'clock'">
			<circle cx="12" cy="13" r="8" />
			<path d="M12 9v4l3 2M9.5 2.5h5" />
		</template>
		<template v-else-if="name === 'trophy'">
			<path d="M7 4h10v5a5 5 0 0 1-10 0z" />
			<path d="M7 6H4c0 3 1.5 5 3.5 5M17 6h3c0 3-1.5 5-3.5 5M12 14v3M8 21h8l-1-4H9z" />
		</template>
		<path v-else-if="name === 'star'" d="M12 2.5l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8 6.2 20l1.4-6.4L2.7 9.2l6.5-.7z" />
		<path v-else-if="name === 'flame'" d="M12 21.5c-4.4 0-7-2.8-7-6.4 0-3.8 3.2-5.4 3.8-9.6 2.2 1.6 3.2 3.8 3.2 6 1-1 1.6-2.2 1.6-3.8 2.8 2.2 5.4 4.8 5.4 8 0 3.8-2.6 5.8-7 5.8z" />
		<template v-else-if="name === 'sticker'">
			<rect x="4" y="4" width="16" height="16" rx="4" transform="rotate(-6 12 12)" />
			<path d="M9 12.5l2 2 4-4.5" />
		</template>
		<path v-else-if="name === 'close'" d="M6 6l12 12M18 6L6 18" />
		<template v-else-if="name === 'tablet'">
			<rect x="5" y="2.5" width="14" height="19" rx="2.5" />
			<path d="M10.5 18.5h3" />
		</template>
		<path v-else-if="name === 'chart'" d="M4 20.5h16M7 20.5v-6M12 20.5V9M17 20.5V4.5" />
		<path v-else-if="name === 'up'" d="M6 15l6-6 6 6" />
		<path v-else-if="name === 'down'" d="M6 9l6 6 6-6" />
		<template v-else-if="name === 'friends'">
			<circle cx="9" cy="8" r="3.5" />
			<path d="M3 20c0-4 3-6 6-6s6 2 6 6M16 5a3 3 0 0 1 0 6M17.5 14c2 .5 3.5 2.5 3.5 6" />
		</template>
		<path v-else-if="name === 'exercise'" d="M8 3.5v8M4 7.5h8M15 6l4 4M19 6l-4 4M13.5 17h7M3.5 15h8M3.5 19h8" />
		<template v-else-if="name === 'missing'">
			<rect x="3.5" y="5" width="17" height="14" rx="3" stroke-dasharray="3 2.6" />
			<path d="M10 10a2 2 0 1 1 3 1.7c-.7.4-1 .8-1 1.6" />
			<circle cx="12" cy="16" r=".5" fill="currentColor" />
		</template>
		<template v-else-if="name === 'compare'">
			<path d="M12 4v16M8 20h8M5 7h14" />
			<path d="M5 7l-3 7h6zM19 7l-3 7h6z" />
		</template>
		<template v-else-if="name === 'cart'">
			<path d="M3 4h2.5l2.2 10.5h10l2-7.5H6.5" />
			<circle cx="9" cy="19" r="1.5" />
			<circle cx="17" cy="19" r="1.5" />
		</template>
		<template v-else-if="name === 'apple'">
			<path d="M12 7.5c-2-1.5-7-1.5-7 4.5 0 4 3 8.5 5 8.5 1 0 1.3-.5 2-.5s1 .5 2 .5c2 0 5-4.5 5-8.5 0-6-5-6-7-4.5z" />
			<path d="M12 7.5c0-2 1-3.5 3-4" />
		</template>
		<template v-else-if="name === 'shapes'">
			<path d="M7 3.5l4 7H3z" />
			<rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
			<circle cx="7" cy="17" r="3.5" />
			<path d="M17 13.5l3.5 3.5-3.5 3.5-3.5-3.5z" />
		</template>
		<template v-else-if="name === 'dice'">
			<rect x="3.5" y="3.5" width="17" height="17" rx="4" />
			<circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" />
			<circle cx="12" cy="12" r="1.3" fill="currentColor" />
			<circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" />
		</template>
		<template v-else-if="name === 'medal'">
			<path d="M8 3h3l2 6M16 3h-3l-2 6" />
			<circle cx="12" cy="15" r="5.5" />
			<path d="M12 12.5v5" />
		</template>
	</svg>
</template>

<style scoped>
.icon {
	display: block;
	width: 1em;
	height: 1em;
	flex: none;
}
</style>
