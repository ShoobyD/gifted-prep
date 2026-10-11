// The login page. Built here on the server rather than in the Vue app on purpose:
// someone who isn't logged in gets only this small page, never the app or its content.

const PAGE = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#5b4bdb">
<title>כניסה</title>
<link rel="icon" href="/favicon-64.png" type="image/png">
<style>
	*, *::before, *::after { box-sizing: border-box; }
	body {
		margin: 0; min-height: 100vh; padding: 16px;
		display: flex; align-items: center; justify-content: center;
		background: #f4f1ff; color: #2a2550;
		font-family: "Rubik", "Noto Sans Hebrew", "Segoe UI", Arial, sans-serif; font-size: 20px;
	}
	.box {
		width: 100%; max-width: 360px; padding: 28px 24px;
		border-radius: 24px; background: #fff; box-shadow: 0 4px 0 rgba(42, 37, 80, .15);
		text-align: center;
	}
	.icon { font-size: 52px; line-height: 1; }
	h1 { margin: 8px 0 20px; font-size: 26px; }
	input {
		width: 100%; padding: 12px; font: inherit; text-align: center;
		border: 3px solid #e2ddff; border-radius: 16px; background: #fff;
	}
	input:focus { outline: none; border-color: #5b4bdb; }
	button {
		width: 100%; min-height: 56px; margin-top: 14px; font: inherit; font-weight: 700;
		border: 0; border-radius: 16px; background: #5b4bdb; color: #fff; cursor: pointer;
		box-shadow: 0 4px 0 rgba(42, 37, 80, .15);
	}
	button:active { transform: translateY(3px); }
	button:disabled { opacity: .55; cursor: default; }
	.error { min-height: 1.4em; margin: 14px 0 0; color: #e5484d; }
</style>
</head>
<body>
	<main class="box">
		<div class="icon" aria-hidden="true">⭐</div>
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
