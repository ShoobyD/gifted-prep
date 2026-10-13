import { createRouter, createWebHashHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';
import { findMockTest } from './data/mockTests';
import { resolveSet, type PracticeSet } from './data/questionSets';

declare module 'vue-router' {
	interface RouteMeta {
		title: string;
		// Built once per navigation by the guard below.
		practice?: PracticeSet;
	}
}

// Hash history: works from any static host and keeps the Android back button in sync.
export const router = createRouter({
	history: createWebHashHistory(),
	routes: [
		{ path: '/', name: 'home', component: HomeView, meta: { title: 'מְחֻנָּנִים – תִּרְגּוּל' } },
		{ path: '/reading', name: 'reading', component: () => import('./views/ReadingView.vue'), meta: { title: 'הֲבָנַת הַנִּקְרָא' } },
		{ path: '/math', name: 'math', component: () => import('./views/MathView.vue'), meta: { title: 'חֶשְׁבּוֹן' } },
		{ path: '/test', name: 'test', component: () => import('./views/TestView.vue'), meta: { title: 'מִבְחַן דֻּגְמָה' } },
		{
			path: '/test/:id',
			name: 'test-run',
			component: () => import('./views/TestRunView.vue'),
			meta: { title: 'מִבְחַן דֻּגְמָה' },
			beforeEnter: (to) => (findMockTest(String(to.params.id)) ? true : { name: 'test' }),
			props: (route) => ({ entry: findMockTest(String(route.params.id)) }),
		},
		{ path: '/stickers', name: 'stickers', component: () => import('./views/StickersView.vue'), meta: { title: 'הַמַּדְבֵּקוֹת שֶׁלִּי' } },
		// Hidden on purpose: reached by a long press on the title (see App.vue).
		{ path: '/device', name: 'device', component: () => import('./views/DeviceView.vue'), meta: { title: 'הַגְדָּרוֹת מַכְשִׁיר' } },
		{
			path: '/practice/:set',
			name: 'practice',
			component: () => import('./views/PracticeView.vue'),
			meta: { title: 'תִּרְגּוּל' },
			// Only hands over the set built by the guard: props functions re-run on every
			// RouterView render, and building a set there rebuilt the session mid-way.
			props: (route) => ({ set: String(route.params.set), ...route.meta.practice }),
		},
		{ path: '/:pathMatch(.*)*', redirect: '/' },
	],
	scrollBehavior: () => ({ top: 0 }),
});

function practiceTitle(set: string): string {
	if (set === 'review') return 'חֲזָרָה עַל טָעֻיּוֹת';
	return set.startsWith('reading-') ? 'הֲבָנַת הַנִּקְרָא' : 'חֶשְׁבּוֹן';
}

// A global guard rather than beforeEnter, which skips query-only changes such as
// "another round" (?run=…) — each round needs a freshly built set.
router.beforeEach((to) => {
	if (to.name !== 'practice') return true;
	const set = String(to.params.set);
	const practice = resolveSet(set);
	if (!practice) return { name: 'home' };
	to.meta.practice = practice;
	to.meta.title = practiceTitle(set);
	return true;
});
