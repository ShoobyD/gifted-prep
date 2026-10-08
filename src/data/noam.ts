// Machon Noam sample test, grade 2 stage A (resources/samples/machon-noam-grade2-stageA-2025.pdf).
// Transcribed from the page images; answers from the booklet's answer key (pages 8–10).
import type { MockTest, Passage, Question } from '@/types';
import { BLANK } from '@/types';

// The booklet prints no title for the passage; this one names its topic.
const sleep: Passage = {
	id: 'noam-sleep',
	title: 'שֵׁנָה טוֹבָה',
	kind: 'informational',
	source: 'noam',
	// Printed lines kept as is: the questions cite line numbers.
	paragraphs: [
		[
			'כֻּלָּנוּ יוֹדְעִים שֶׁשֵּׁנָה טוֹבָה בַּלַּיְלָה חֲשׁוּבָה מְאֹד לִילָדִים. בִּזְמַן הַשֵּׁנָה',
			'שְׁרִירִי הַגּוּף נָחִים וּמַעַרְכוֹת הַגּוּף מִתְרַעַנְנוֹת. הַמֵּידָע שֶׁקָּלַטְנוּ בְּמַהֲלַךְ',
			'הַיּוֹם נִשְׁמַר בַּזִּכָּרוֹן וְחָמָרִים הַחִיּוּנִיִּים לַגְּדִילָה מוּפְרָשִׁים.',
			'אִם אֵין אָנוּ מַקְפִּידִים עַל מַסְפִּיק שְׁעוֹת שֵׁנָה, מַעֲרָכוֹת שׁוֹנוֹת',
			'בְּגוּפֵנוּ נִפְגָּעוֹת. חֹסֶר בִּשְׁעוֹת שֵׁנָה גּוֹרֵם לְעַצְבָּנוּת, לְעַקְשָׁנוּת וּלְשִׁנּוּיִים',
			'בְּמַצַּב הָרוּחַ. קָשֶׁה לָנוּ יוֹתֵר לִשְׁלֹט בְּעַצְמֵנוּ וַאֲנַחְנוּ עֲלוּלִים לְהִסָּחֵף',
			'בְּקַלּוּת לְהִתְנַהֲגוּת לֹא טוֹבָה. בְּנוֹסָף, כְּשֶׁלֹּא יְשֵׁנִים הֵיטֵב, מַעֲרֶכֶת',
			'הַחִסּוּן נֶחֱלֶשֶׁת וַאֲנַחְנוּ חֲשׂוּפִים יוֹתֵר לְמַחֲלוֹת.',
			'כְּדֵי שֶׁנּוּכַל לִהְיוֹת מְרֻכָּזִים וּבְרִיאִים יוֹתֵר בַּיּוֹם, כְּדַאי שֶׁנְּאַמֵּץ',
			'מִסְפָּר כְּלָלִים שֶׁיַּעַזְרוּ לָנוּ לְהֵרָדֵם בְּקַלּוּת וְלִישֹׁן הֵיטֵב בַּלַּיְלָה:',
			'כְּלָל רִאשׁוֹן: שְׁמִירָה עַל שִׁגְרָה. כְּשֶׁמַּחְלִיטִים עַל שָׁעָה קְבוּעָה',
			'שֶׁל כִּבּוּי אוֹרוֹת, הַגּוּף מִתְרַגֵּל לִשְׁעוֹת הַשֵּׁנָה וְקַל יוֹתֵר לְהֵרָדֵם.',
			'כְּלָל שֵׁנִי: יְצִירַת אֲוִירָה שְׁלֵוָה. לְהִשְׁתַּדֵּל לֹא לִקְרֹא סְפָרִים מַפְחִידִים',
			'לִפְנֵי הַשֵּׁנָה וְלֹא לִצְפּוֹת יוֹתֵר מִדַּי בַּטֵּלֵוִיזְיָה. הַחֶדֶר שֶׁיְּשֵׁנִים בּוֹ צָרִיךְ',
			'לִהְיוֹת מֻתְאָם לְשֵׁנָה – חָשׁוּךְ, נָעִים וְשָׁקֵט.',
			'כְּלָל שְׁלִישִׁי: הֲכָנַת הַגּוּף לְשֵׁנָה. יֵשׁ סוּגֵי מְזוֹנוֹת שֶׁמְּכִילִים חֳמָרִים',
			'מְעוֹרְרִים כְּמוֹ שׁוֹקוֹלָד וְקוֹלָהּ וְאוֹתָם רָצוּי לֹא לֶאֱכֹל לִפְנֵי הַשֵּׁנָה.',
			'בְּמֶשֶׁךְ הַיּוֹם, כְּדַאי לְהַקְפִּיד עַל פְּעִילוּת סְפּוֹרְטִיבִית. מִשְׂחָק בְּכַדּוּר,',
			'שְׂחִיָּה אוֹ רְכִיבָה עַל אוֹפַנַּיִם מְסַיְּעִים מְאֹד לְהִרָדְמוּת מְהִירָה בַּלַּיְלָה.',
			'קְחוּ אַחֲרָיוּת עַל שְׁעוֹת הַשֵּׁנָה שֶׁלָּכֶם! הָרִכּוּז שֶׁלָּכֶם בְּבֵית הַסֵּפֶר',
			'יִשְׁתַּפֵּר וְגַם מַצַּב הָרוּחַ.',
		],
	],
	questions: [
		{
			id: 'noam-sleep-1',
			type: 'reading-fact',
			body: 'מָה אֶפְשָׁר לִלְמֹד מֵהַשּׁוּרוֹת 4–8?',
			answer: {
				kind: 'choice',
				options: [
					'אֵילוּ נְזָקִים קוֹרִים כַּאֲשֶׁר אֵין יְשֵׁנִים מַסְפִּיק בַּלַּיְלָה.',
					'אֵילוּ חֳמָרִים מוּפְרָשִׁים בַּגּוּף בִּזְמַן שֶׁיְּשֵׁנִים.',
					'כֵּיצַד אֶפְשָׁר לְהַחְלִים בִּמְהִירוּת מִמַּחֲלוֹת.',
					'כֵּיצַד הַמֵּידָע שֶׁקָּלַטְנוּ בְּמֶשֶׁךְ הַיּוֹם נִשְׁמָר בַּזִּכָּרוֹן.',
				],
				correctIndex: 0,
			},
			explanation: 'בְּשׁוּרוֹת 4–8 כָּתוּב מָה קוֹרֶה כְּשֶׁלֹּא יְשֵׁנִים מַסְפִּיק: עַצְבָּנוּת, עַקְשָׁנוּת וּמַעֲרֶכֶת חִסּוּן חַלָּשָׁה. אֵלֶּה נְזָקִים.',
		},
		{
			id: 'noam-sleep-2',
			type: 'word-meaning',
			body: 'אֵיזוֹ מִלָּה יָכֹלה לְהַחֲלִיף בַּקֶּטַע אֶת הַמִּלָּה "שְׁלֵוָה" (שׁוּרָה 13)?',
			answer: {
				kind: 'choice',
				options: ['אֲדִישָׁה', 'מְעַיֶּפֶת', 'חֲשׁוּכָה', 'רְגוּעָה'],
				correctIndex: 3,
			},
			explanation: 'אֲוִירָה שְׁלֵוָה הִיא אֲוִירָה שְׁקֵטָה וּרְגוּעָה, בְּלִי רַעַשׁ וּבְלִי פַּחַד.',
		},
		{
			id: 'noam-sleep-3',
			type: 'inference',
			body: 'כְּדֵי לְהֵרָדֵם בְּקַלּוּת כְּדַאי...',
			answer: {
				kind: 'choice',
				options: [
					'לֶאֱכֹל שׁוֹקוֹלָד לִפְנֵי הַשֵּׁנָה.',
					'לְהִשְׁתַּתֵּף בְּשִׁעוּרֵי הַסְּפּוֹרְט בְּבֵית הַסֵּפֶר.',
					'לִצְפּוֹת בְּסֶרֶט מַפְחִיד בַּטֵּלֵוִיזְיָה.',
					'לָלֶכֶת לִישֹׁן בְּכָל יוֹם בְּשָׁעָה אַחֶרֶת.',
				],
				correctIndex: 1,
			},
			explanation: 'בְּשׁוּרוֹת 18–19 כָּתוּב שֶׁפְּעִילוּת סְפּוֹרְטִיבִית בְּמֶשֶׁךְ הַיּוֹם עוֹזֶרֶת לְהֵרָדֵם מַהֵר. אֶת שְׁאָר הַדְּבָרִים הַקֶּטַע אוֹמֵר לֹא לַעֲשׂוֹת.',
		},
	],
};

export const noamPassages: Passage[] = [sleep];

const wordProblems: Question[] = [
	{
		id: 'noam-wp-1',
		type: 'word-problem',
		body: 'דָּנִי וְאִיתַי אוֹסְפִים בְּיַחַד מַדְבֵּקוֹת. דָּנִי הֵבִיא 13 מַדְבֵּקוֹת וְאִיתַי הֵבִיא 15. הֵם הֶחְלִיטוּ לְחַלֵּק בֵּינֵיהֶם אֶת הָאֹסֶף בְּאֹפֶן שָׁוֶה. כַּמָּה מַדְבֵּקוֹת לָקַח כָּל אֶחָד מֵהֶם?',
		answer: {
			kind: 'choice',
			options: ['28 מַדְבֵּקוֹת', '18 מַדְבֵּקוֹת', '14 מַדְבֵּקוֹת', '9 מַדְבֵּקוֹת'],
			correctIndex: 2,
		},
		explanation: 'קֹדֶם מְחַבְּרִים: $13 + 15 = 28$. אַחַר כָּךְ מְחַלְּקִים לִשְׁנַיִם שָׁוִים: $14 + 14 = 28$, לָכֵן כָּל אֶחָד לָקַח 14.',
	},
	{
		id: 'noam-wp-2',
		type: 'word-problem',
		body: 'אֵיתָן קוֹלֵעַ 2 סַלִים בְּמִשְׂחָק. יוֹנָתָן קוֹלֵעַ מִסְפָּר כָּפוּל שֶׁל סַלִים מֵאֲשֶׁר אֵיתָן בְּמִשְׂחָק, וּרְוִיטַל קוֹלַעַת פִּי 3 סַלִים מיוֹנָתָן. כַּמָּה סַלִים קוֹלַעַת רְוִיטַל בְּמִשְׂחָק?',
		answer: {
			kind: 'choice',
			options: ['12 סַלִים', '4 סַלִים', '16 סַלִים', '7 סַלִים'],
			correctIndex: 0,
		},
		explanation: 'יוֹנָתָן קוֹלֵעַ כָּפוּל מֵאֵיתָן: $2 × 2 = 4$. רְוִיטַל קוֹלַעַת פִּי 3 מִיּוֹנָתָן: $4 × 3 = 12$.',
	},
	{
		id: 'noam-wp-3',
		type: 'word-problem',
		body: 'בְּסָלָט יְרָקוֹת יֵשׁ בְּסַךְ הַכֹּל 10 יְרָקוֹת. מִתּוֹכָם 4 עַגְבָנִיּוֹת, 3 מְלָפְפוֹנִים וְכָל הַשְּׁאָר גְּזָרִים. כַּמָּה גְּזָרִים יֵשׁ בַּסָּלָט?',
		answer: {
			kind: 'choice',
			options: ['3 גְּזָרִים', '4 גְּזָרִים', '7 גְּזָרִים', '10 גְּזָרִים'],
			correctIndex: 0,
		},
		explanation: 'מוֹרִידִים מִכָּל הַיְּרָקוֹת אֶת הָעַגְבָנִיּוֹת וְאֶת הַמְּלָפְפוֹנִים: $10 − 4 − 3 = 3$.',
	},
];

const MISSING_PROMPT = 'עֲלֵיכֶם לְהַשְׁלִים אֶת הַתְּשׁוּבָה הַנְּכוֹנָה תּוֹךְ שִׁמּוּשׁ בְּאַרְבַּע פְּעֻלּוֹת חֶשְׁבּוֹן: חִבּוּר, חִסּוּר, כֶּפֶל וְחִלּוּק.';

const missingNumbers: Question[] = [
	{
		id: 'noam-mn-1',
		type: 'missing-number',
		prompt: MISSING_PROMPT,
		math: `7 + ${BLANK} = 40`,
		answer: { kind: 'number', rule: { op: 'eq', value: 33 }, solution: 33 },
		explanation: 'כַּמָּה צָרִיךְ לְהוֹסִיף לְ-7 כְּדֵי לְהַגִּיעַ לְ-40? $40 − 7 = 33$.',
	},
	{
		id: 'noam-mn-2',
		type: 'missing-number',
		prompt: MISSING_PROMPT,
		math: `${BLANK} − 14 = 27`,
		answer: { kind: 'number', rule: { op: 'eq', value: 41 }, solution: 41 },
		explanation: 'מְחַפְּשִׂים מִסְפָּר שֶׁאִם מוֹרִידִים מִמֶּנּוּ 14 נִשְׁאָר 27: $27 + 14 = 41$. בְּדִיקָה: $41 − 14 = 27$.',
	},
	{
		id: 'noam-mn-3',
		type: 'missing-number',
		prompt: MISSING_PROMPT,
		math: `2 × ${BLANK} = 26`,
		answer: { kind: 'number', rule: { op: 'eq', value: 13 }, solution: 13 },
		explanation: '2 כָּפוּל מִסְפָּר זֶה הַמִּסְפָּר וְעוֹד הַמִּסְפָּר: $13 + 13 = 26$, לָכֵן $2 × 13 = 26$.',
	},
];

const EXERCISE_PROMPT = 'פִּתְרוּ אֶת תַּרְגִּילֵי הַחֶשְׁבּוֹן וְכִתְבוּ אֶת הַתּוֹצָאָה בַּמָּקוֹם הַמַּתְאִים.';

const exercises: Question[] = [
	{
		id: 'noam-ex-1',
		type: 'exercise',
		prompt: EXERCISE_PROMPT,
		math: `21 + 43 = ${BLANK}`,
		answer: { kind: 'number', rule: { op: 'eq', value: 64 }, solution: 64 },
		explanation: 'עֲשָׂרוֹת: $20 + 40 = 60$. אֲחָדוֹת: $1 + 3 = 4$. בְּיַחַד: $60 + 4 = 64$.',
	},
	{
		id: 'noam-ex-2',
		type: 'exercise',
		prompt: EXERCISE_PROMPT,
		math: `10 × 7 = ${BLANK}`,
		answer: { kind: 'number', rule: { op: 'eq', value: 70 }, solution: 70 },
		explanation: '$10 × 7$ הֵם 7 עֲשָׂרוֹת, כְּלוֹמַר $70$.',
	},
	{
		// Division sign kept as printed (÷).
		id: 'noam-ex-3',
		type: 'exercise',
		prompt: EXERCISE_PROMPT,
		math: `15 ÷ 3 = ${BLANK}`,
		answer: { kind: 'number', rule: { op: 'eq', value: 5 }, solution: 5 },
		explanation: 'מְחַלְּקִים 15 לִשְׁלוֹשָׁה חֲלָקִים שָׁוִים: $5 + 5 + 5 = 15$, לָכֵן $15 ÷ 3 = 5$.',
	},
];

const INEQUALITY_PROMPT = 'עֲלֵיכֶם לְהַשְׁלִים אֶת הַתְּשׁוּבָה הַנְּכוֹנָה כָּךְ שֶׁאִי-הַשִּׁוְיוֹן יִתְקַיֵּם.';

// Several answers are correct; the solution is the one in the answer key.
const inequalities: Question[] = [
	{
		id: 'noam-in-1',
		type: 'inequality',
		prompt: INEQUALITY_PROMPT,
		math: `8 × 5 < 8 × ${BLANK}`,
		answer: { kind: 'number', rule: { op: 'gt', value: 5 }, solution: 8 },
		explanation: '$8 × 5 = 40$. כְּדֵי לְקַבֵּל יוֹתֵר מִ-40 צָרִיךְ לִכְפֹּל אֶת 8 בְּמִסְפָּר גָּדוֹל מִ-5, לְמָשָׁל $8 × 8 = 64$.',
	},
	{
		// Any number above 30 makes it true (31 ÷ 5 is a bit more than 6); the key gives 35.
		id: 'noam-in-2',
		type: 'inequality',
		prompt: INEQUALITY_PROMPT,
		math: `${BLANK} ÷ 5 > 30 ÷ 5`,
		answer: { kind: 'number', rule: { op: 'gt', value: 30 }, solution: 35 },
		explanation: '$30 ÷ 5 = 6$. כְּדֵי לְקַבֵּל יוֹתֵר מִ-6 צָרִיךְ לְחַלֵּק מִסְפָּר גָּדוֹל מִ-30, לְמָשָׁל $35 ÷ 5 = 7$.',
	},
	{
		id: 'noam-in-3',
		type: 'inequality',
		prompt: INEQUALITY_PROMPT,
		math: `30 − 8 > 30 − ${BLANK}`,
		answer: { kind: 'number', rule: { op: 'gt', value: 8 }, solution: 10 },
		explanation: '$30 − 8 = 22$. כְּדֵי שֶׁהַצַּד הַשֵּׁנִי יִהְיֶה קָטָן מִ-22 צָרִיךְ לְהוֹרִיד יוֹתֵר מִ-8, לְמָשָׁל $30 − 10 = 20$.',
	},
];

const RIDDLE_PROMPT = 'בְּתַרְגִּילִים שֶׁלְּפָנֵיכֶם הֶחֱלִיפוּ חֵלֶק מֵהַמִּסְפָּרִים בְּצִיּוּרִים. כָּל צִיּוּר מַתְאִים לְמִסְפָּר מְסֻיָּם. עֲלֵיכֶם לִמְצֹא מַהוּ הַמִּסְפָּר הַזֶּה כְּדֵי שֶׁהַתַּרְגִּיל יִהְיֶה נָכוֹן.';

const riddles: Question[] = [
	{
		// 🍓 replaces the flower, 🚗 the horseshoe magnet. The booklet's options were 3, 5, 7, 8.
		id: 'noam-pr-1',
		type: 'picture-riddle',
		prompt: RIDDLE_PROMPT,
		lines: ['🍓 + 🍓 = 10', '🚗 + 🍓 = 13'],
		math: `🚗 = ${BLANK}`,
		answer: { kind: 'number', rule: { op: 'eq', value: 8 }, solution: 8 },
		explanation: '$5 + 5 = 10$, לָכֵן $🍓 = 5$. אָז $🚗 + 5 = 13$, לָכֵן $🚗 = 8$.',
	},
	{
		// ⚽ replaces the anchor, ⭐ the star, 🎈 the bell. The booklet's options were 21, 19, 16, 15.
		// ⚽ and ⭐ are not determined one by one, only their sum; 🎈 is.
		id: 'noam-pr-2',
		type: 'picture-riddle',
		prompt: RIDDLE_PROMPT,
		lines: ['⚽ + ⭐ = 9', '⚽ + ⭐ + 🎈 + ⚽ + ⭐ = 39'],
		math: `🎈 = ${BLANK}`,
		answer: { kind: 'number', rule: { op: 'eq', value: 21 }, solution: 21 },
		explanation: 'בַּשּׁוּרָה הַשְּׁנִיָּה יֵשׁ פַּעֲמַיִם $⚽ + ⭐$, כְּלוֹמַר $9 + 9 = 18$. לָכֵן $🎈 = 39 − 18 = 21$.',
	},
	{
		// A digit puzzle: ☆ replaces the black burst, standing for a digit inside two-digit numbers
		// (☆2 and 4☆). The booklet gives options and no question line, so it stays multiple choice.
		id: 'noam-pr-3',
		type: 'symbol-digit',
		prompt: RIDDLE_PROMPT,
		lines: ['☆2 + 4☆ = 64'],
		math: `☆ = ${BLANK}`,
		answer: { kind: 'choice', options: ['4', '3', '2', '1'], correctIndex: 2 },
		explanation: 'נְנַסֶּה $☆ = 2$: הַמִּסְפָּרִים הֵם 22 וְ-42, וְ-$22 + 42 = 64$. נָכוֹן!',
	},
];

export const noamTest: MockTest = {
	id: 'noam-2025',
	title: 'מִבְחָן לְדֻגְמָה – מָכוֹן נֹעַם',
	source: 'noam',
	// Booklet order: part A (math) comes before part B (reading).
	sections: [
		{
			title: 'בעיות בחשבון',
			instructions: 'קִרְאוּ בְּעִיּוּן כָּל שְׁאֵלָה וּבַחֲרוּ בַּתְּשׁוּבָה הַנְּכוֹנָה.',
			questions: wordProblems,
		},
		{
			title: 'הַשְׁלִימוּ אֶת הַמִּסְפָּר',
			instructions: MISSING_PROMPT,
			questions: missingNumbers,
		},
		{
			title: 'תַּרְגִּילֵי חֶשְׁבּוֹן',
			instructions: EXERCISE_PROMPT,
			questions: exercises,
		},
		{
			title: 'תַּרְגִּילֵי אִי-שִׁוְיוֹן',
			instructions: INEQUALITY_PROMPT,
			questions: inequalities,
		},
		{
			title: 'חִידוֹת בְּצִיּוּרִים',
			instructions: RIDDLE_PROMPT,
			questions: riddles,
		},
		{
			title: 'הֲבָנַת הַנִּקְרָא',
			instructions: 'קִרְאוּ אֶת הַקֶּטַע וַעֲנוּ עַל הַשְּׁאֵלוֹת:',
			passage: sleep,
			questions: sleep.questions,
		},
	],
};
