import { dayStreak, type ProgressState, type SessionRecord } from './state';

export interface Sticker {
	id: string;
	emoji: string;
	name: string;
	// How to earn it, shown in the collection.
	hint: string;
	earned(state: ProgressState, last: SessionRecord | undefined, today: Date): boolean;
}

const isMockTest = (record: SessionRecord) => record.set.startsWith('test-');

const levelCount =(state: ProgressState, level: number) =>
	Object.values(state.levels).filter((l) => l >= level).length;

export const STICKERS: Sticker[] = [
	{
		id: 'first-session',
		emoji: '🌱',
		name: 'צַעַד רִאשׁוֹן',
		hint: 'מְסַיְּמִים סְבַב תִּרְגּוּל רִאשׁוֹן',
		earned: (s) => s.sessions.length >= 1,
	},
	{
		id: 'perfect',
		emoji: '💯',
		name: 'מֻשְׁלָם',
		hint: 'עוֹנִים נָכוֹן עַל כָּל הַשְּׁאֵלוֹת בִּסְבָב אֶחָד',
		earned: (_, last) => !!last && last.total > 0 && last.correct === last.total,
	},
	{
		id: 'stars-50',
		emoji: '⭐',
		name: 'אוֹסֵף כּוֹכָבִים',
		hint: 'אוֹסְפִים 50 כּוֹכָבִים',
		earned: (s) => s.stars >= 50,
	},
	{
		id: 'stars-200',
		emoji: '🌟',
		name: 'כּוֹכָב זוֹהֵר',
		hint: 'אוֹסְפִים 200 כּוֹכָבִים',
		earned: (s) => s.stars >= 200,
	},
	{
		id: 'stars-500',
		emoji: '🌠',
		name: 'מְטָאוֹר',
		hint: 'אוֹסְפִים 500 כּוֹכָבִים',
		earned: (s) => s.stars >= 500,
	},
	{
		id: 'streak-3',
		emoji: '🔥',
		name: 'שְׁלוֹשָׁה יָמִים בִּרְצִיפוּת',
		hint: 'מִתְאַמְּנִים 3 יָמִים בִּרְצִיפוּת',
		earned: (s, _, today) => dayStreak(s.practiceDays, today) >= 3,
	},
	{
		id: 'streak-7',
		emoji: '🏆',
		name: 'שָׁבוּעַ שָׁלֵם',
		hint: 'מִתְאַמְּנִים 7 יָמִים בִּרְצִיפוּת',
		earned: (s, _, today) => dayStreak(s.practiceDays, today) >= 7,
	},
	{
		id: 'sessions-10',
		emoji: '🎒',
		name: 'תַּלְמִיד חָרוּץ',
		hint: 'מְסַיְּמִים 10 סְבָבִים',
		earned: (s) => s.sessions.length >= 10,
	},
	{
		id: 'sessions-30',
		emoji: '🧠',
		name: 'מֹחַ חָזָק',
		hint: 'מְסַיְּמִים 30 סְבָבִים',
		earned: (s) => s.sessions.length >= 30,
	},
	{
		id: 'reader-5',
		emoji: '📚',
		name: 'תּוֹלַעַת סְפָרִים',
		hint: 'קוֹרְאִים 5 קְטָעִים שׁוֹנִים',
		earned: (s) => Object.keys(s.passages).length >= 5,
	},
	{
		id: 'reader-15',
		emoji: '🦉',
		name: 'יַנְשׁוּף חָכָם',
		hint: 'קוֹרְאִים 15 קְטָעִים שׁוֹנִים',
		earned: (s) => Object.keys(s.passages).length >= 15,
	},
	{
		id: 'mock-test',
		emoji: '📝',
		name: 'מִבְחָן רִאשׁוֹן',
		hint: 'מְסַיְּמִים מִבְחַן דֻּגְמָה',
		earned: (s) => s.sessions.some(isMockTest),
	},
	{
		id: 'mock-90',
		emoji: '🎓',
		name: 'כִּמְעַט מֻשְׁלָם',
		hint: 'מְקַבְּלִים 90% וּמַעְלָה בְּמִבְחַן דֻּגְמָה',
		earned: (s) => s.sessions.some((r) => isMockTest(r) && r.total > 0 && r.correct / r.total >= 0.9),
	},
	{
		id: 'level-3',
		emoji: '🚀',
		name: 'רָמָה גְּבוֹהָה',
		hint: 'מַגִּיעִים לְ-3 כּוֹכָבִים בְּנוֹשֵׂא חֶשְׁבּוֹן אֶחָד',
		earned: (s) => levelCount(s, 3) >= 1,
	},
	{
		id: 'all-level-3',
		emoji: '👑',
		name: 'מֶלֶךְ הַחֶשְׁבּוֹן',
		hint: 'מַגִּיעִים לְ-3 כּוֹכָבִים בְּכָל נוֹשְׂאֵי הַחֶשְׁבּוֹן',
		earned: (s) => levelCount(s, 3) === Object.keys(s.levels).length,
	},
];

// Stickers newly earned now (not already in the collection).
export function newStickers(state: ProgressState, last: SessionRecord | undefined, today: Date): Sticker[] {
	return STICKERS.filter((sticker) => !state.stickers.includes(sticker.id) && sticker.earned(state, last, today));
}
