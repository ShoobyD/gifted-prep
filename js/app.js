// App shell: hash-based navigation between screens.
// Plain script (no modules) so the app also works when opened from file://.
(function () {
	'use strict';

	const DEFAULT_SCREEN = 'home';
	const screens = document.querySelectorAll('[data-screen]');
	const titleEl = document.getElementById('screen-title');

	function currentScreen() {
		const name = location.hash.slice(1);
		return document.querySelector(`.screen[data-screen="${name}"]`) ? name : DEFAULT_SCREEN;
	}

	function show(name) {
		screens.forEach((screen) => {
			screen.hidden = screen.dataset.screen !== name;
		});
		const active = document.querySelector(`.screen[data-screen="${name}"]`);
		titleEl.textContent = active.dataset.title;
		document.body.dataset.screen = name;
		window.scrollTo(0, 0);
	}

	// True once we pushed a screen onto history from home, so "back" can pop it.
	let pushedFromHome = false;

	function navigate(name) {
		if (name === DEFAULT_SCREEN) {
			if (!location.hash) return;
			// Pop instead of pushing, so the Android back button doesn't loop between screens.
			if (pushedFromHome) {
				history.back();
			} else {
				history.replaceState(null, '', location.pathname + location.search);
				show(DEFAULT_SCREEN);
			}
			pushedFromHome = false;
			return;
		}
		pushedFromHome = currentScreen() === DEFAULT_SCREEN;
		location.hash = name;
	}

	document.addEventListener('click', (event) => {
		const target = event.target.closest('[data-nav]');
		if (target) navigate(target.dataset.nav);
	});

	window.addEventListener('hashchange', () => {
		const name = currentScreen();
		// Reached home via the browser/Android back button: nothing left to pop.
		if (name === DEFAULT_SCREEN) pushedFromHome = false;
		show(name);
	});
	show(currentScreen());

	window.App = { navigate };
})();
