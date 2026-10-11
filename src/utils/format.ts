// Short date-time for parent screens, e.g. "12/10 08:05".
export function formatDateTime(value: string | number) {
	const d = new Date(value);
	return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// m:ss
export function formatDuration(seconds: number) {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${String(s).padStart(2, '0')}`;
}
