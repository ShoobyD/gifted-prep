import { createRouter, createWebHashHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';
import { resolveSet } from './data/questionSets';

declare module 'vue-router' {
	interface RouteMeta {
		title: string;
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
		{ path: '/parents', name: 'parents', component: () => import('./views/ParentsView.vue'), meta: { title: 'הוֹרִים' } },
		{
			path: '/practice/:set',
			name: 'practice',
			component: () => import('./views/PracticeView.vue'),
			meta: { title: 'תִּרְגּוּל' },
			beforeEnter: (to) => {
				const set = String(to.params.set);
				if (!resolveSet(set)) return { name: 'home' };
				to.meta.title = set.startsWith('reading-') ? 'הֲבָנַת הַנִּקְרָא' : 'חֶשְׁבּוֹן';
				return true;
			},
			props: (route) => resolveSet(String(route.params.set)),
		},
		{ path: '/:pathMatch(.*)*', redirect: '/' },
	],
	scrollBehavior: () => ({ top: 0 }),
});
