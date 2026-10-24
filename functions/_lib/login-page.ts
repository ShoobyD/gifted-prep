// The login page. Built here on the server rather than in the Vue app on purpose:
// someone who isn't logged in gets only this small page, never the app or its content.
// It wears the sticker album's colors (DESIGN.md) but loads nothing: before the login
// every other file is locked, so its sticker is drawn inline and its font is the system's.

const PAGE = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#1446a0">
<title>כניסה</title>
<link rel="icon" href="/favicon-64.png" type="image/png">
<style>
	*, *::before, *::after { box-sizing: border-box; }
	/* The album's blue cover, and on it one white page: rounded outer edge, near-square spine. */
	body {
		margin: 0; min-height: 100vh; padding: 16px;
		display: flex; align-items: center; justify-content: center;
		background: #1446a0; color: #10224f;
		font-family: "Rubik", "Noto Sans Hebrew", "Segoe UI", Arial, sans-serif; font-size: 20px;
	}
	::selection { background: #ffd23f; color: #10224f; }
	.box {
		width: 100%; max-width: 380px; padding: 32px 28px 28px;
		border-radius: 22px 6px 6px 22px; background: #fff; box-shadow: 0 18px 40px rgba(5, 16, 50, .35);
		text-align: center;
	}
	/* A gold star sticker, stuck on a little crooked. */
	.sticker {
		display: block; width: 72px; height: auto; margin: 0 auto;
		transform: rotate(-4deg); filter: drop-shadow(0 4px 6px rgba(16, 34, 79, .28));
	}
	h1 { margin: 14px 0 22px; font-size: 28px; }
	input {
		width: 100%; min-height: 56px; padding: 12px; font: inherit; text-align: center; color: inherit;
		border: 3px solid #c9d1e3; border-radius: 16px; background: #fff; caret-color: #1446a0;
	}
	input::placeholder { color: #5a6b96; opacity: 1; }
	input:focus { outline: none; border-color: #1446a0; }
	button {
		width: 100%; min-height: 60px; margin-top: 14px; font: inherit; font-weight: 700;
		border: 0; border-radius: 18px; background: #1446a0; color: #fff; cursor: pointer;
		box-shadow: 0 6px 14px rgba(16, 34, 79, .2);
		transition: transform .15s ease-out;
	}
	button:active { transform: translateY(2px); }
	button:focus-visible { outline: 3px solid #ffd23f; outline-offset: 3px; }
	button:disabled { opacity: .55; cursor: default; }
	.error { min-height: 1.4em; margin: 14px 0 0; color: #d43a3a; font-weight: 700; }
</style>
</head>
<body>
	<main class="box">
		<svg class="sticker" viewBox="0 0 100 133" aria-hidden="true">
			<rect x="2" y="2" width="96" height="129" rx="12" fill="#fff"/>
			<rect x="8" y="8" width="84" height="96" rx="8" fill="#ffb000"/>
			<path d="M50 30l8 17 19 3-14 13 4 19-17-9-17 9 4-19-14-13 19-3z" fill="#fff" stroke="#10224f" stroke-width="4" stroke-linejoin="round"/>
			<path d="M14 117h48" stroke="#c9d1e3" stroke-width="3" stroke-linecap="round"/>
		</svg>
		<h1>מחוננים – תרגול</h1>
		<form id="form">
			<input id="password" type="password" autocomplete="current-password" placeholder="סיסמה" required autofocus aria-label="סיסמה">
			<button id="submit" type="submit">כניסה</button>
		</form>
		<p class="error" id="error" role="alert"></p>
	</main>
<script>
	var form = document.getElementById('form');
	var input = document.getElementById('password');
	var button = document.getElementById('submit');
	var error = document.getElementById('error');

	form.addEventListener('submit', function (event) {
		event.preventDefault();
		error.textContent = '';
		button.disabled = true;
		button.textContent = 'בודקים…';
		fetch('/api/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password: input.value }),
		})
			.then(function (response) {
				// The cookie is set; reload the same address, which now serves the app.
				if (response.ok) return location.reload();
				return response.json().then(function (data) { throw new Error(data.error || 'שגיאה'); });
			})
			.catch(function (cause) {
				error.textContent = cause.message === 'Failed to fetch' ? 'אין חיבור לאינטרנט' : cause.message;
				button.disabled = false;
				button.textContent = 'כניסה';
				input.select();
			});
	});
</script>
</body>
</html>
`;

export function loginPageResponse(): Response {
	return new Response(PAGE, {
		status: 401,
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'Cache-Control': 'no-store',
		},
	});
}
