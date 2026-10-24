<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from './AppIcon.vue';
import { useSession } from '@/composables/useSession';

// The album's tabs, one per area, standing out of the page's edge: the way to turn to
// another chapter from home or from inside one. Each reads across, under its area's icon,
// so a child reads it without tilting their head; the open chapter's tab stands out further.
const route = useRoute();
const session = useSession();

interface Tab {
	name: string;
	icon: InstanceType<typeof AppIcon>['$props']['name'];
	label: string;
	color: string;
	ink: string;
}

const AREAS: Tab[] = [
	{ name: 'reading', icon: 'book', label: 'קְרִיאָה', color: 'var(--reading)', ink: 'var(--on-primary)' },
	{ name: 'math', icon: 'exercise', label: 'חֶשְׁבּוֹן', color: 'var(--math)', ink: 'var(--on-math)' },
	{ name: 'test', icon: 'paper', label: 'מִבְחָנִים', color: 'var(--test)', ink: 'var(--on-primary)' },
];
const FRIENDS: Tab = { name: 'friends', icon: 'friends', label: 'חֲבֵרִים', color: 'var(--parents)', ink: 'var(--on-primary)' };

// Friends only behind the server: the other children's achievements come from it.
const tabs = computed(() => (session.authenticated.value ? [...AREAS, FRIENDS] : AREAS));
</script>

<template>
	<nav class="tabs" aria-label="תְּחוּמִים">
		<RouterLink
			v-for="tab in tabs"
			:key="tab.name"
			:to="{ name: tab.name }"
			class="tab"
			:class="{ on: route.name === tab.name }"
			:aria-current="route.name === tab.name ? 'page' : undefined"
			:style="{ '--tab': tab.color, '--tab-ink': tab.ink }"
		>
			<AppIcon :name="tab.icon" class="tab-icon" />
			<span>{{ tab.label }}</span>
		</RouterLink>
	</nav>
</template>

<style scoped>
/* Out past the page's edge, onto the cover (the page leaves room for them). */
.tabs {
	position: absolute;
	top: 24px;
	right: calc(-1 * var(--tab-out));
	width: var(--tab-out);
	display: grid;
	gap: 12px;
}

.tab {
	display: grid;
	justify-items: center;
	align-content: center;
	gap: 6px;
	width: var(--tab-out);
	min-height: 112px;
	padding: 12px 10px;
	border-radius: 0 18px 18px 0;
	background: var(--tab);
	color: var(--tab-ink);
	box-shadow: 4px 6px 12px rgba(5, 16, 50, .3);
	font-family: var(--font-display);
	font-size: 28px;
	font-weight: 700;
	line-height: 1;
	text-decoration: none;
	/* Back into place slowly, after a quick press. */
	transition: transform .35s cubic-bezier(.16, 1, .3, 1);
}

.tab-icon {
	font-size: 34px;
}

/* Pressed, a tab is pulled out a little, like a finger tugging an album's tab. */
.tab:active {
	transform: translateX(10px);
	transition-duration: .08s;
}

/* The open chapter: further out onto the cover, its inner edge still at the page. */
.tab.on {
	width: calc(var(--tab-out) + 12px);
	margin-inline-start: -12px;
}

/* A phone has no room beside the page: the tabs run along its top inside it. */
@media (max-width: 699px) {
	.tabs {
		position: static;
		width: auto;
		grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
		align-items: start;
		gap: 8px;
		/* Up to the page's top edge and out to its sides. */
		margin: calc(-1 * var(--page-top)) calc(-1 * var(--page-pad)) 20px;
	}

	.tab {
		width: auto;
		min-height: 64px;
		gap: 2px;
		padding: 8px 4px;
		border-radius: 0 0 14px 14px;
		box-shadow: 0 4px 8px rgba(16, 34, 79, .2);
		font-size: 24px;
	}

	.tab-icon {
		font-size: 24px;
	}

	.tab:active {
		transform: translateY(-6px);
	}

	.tab.on {
		width: auto;
		margin-inline-start: 0;
		min-height: 74px;
	}
}

/* After the phone rules, so a reduced-motion phone also gets only a small nudge. */
@media (prefers-reduced-motion: reduce) {
	.tab {
		transition: none;
	}

	.tab:active {
		transform: translateX(4px);
	}
}

@media (prefers-reduced-motion: reduce) and (max-width: 699px) {
	.tab:active {
		transform: translateY(-3px);
	}
}
</style>
