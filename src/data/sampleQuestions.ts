import type { Question } from '@/types';

// Temporary hand-written set for exercising the engine; replaced by generators and banks later.
export const sampleQuestions: Question[] = [
	{
		id: 'sample-exercise',
		type: 'exercise',
		prompt: 'פִּתְרוּ אֶת הַתַּרְגִּיל:',
		math: '38 + 27 = ☐',
		answer: { kind: 'number', rule: { op: 'eq', value: 65 }, solution: 65 },
		explanation: '$30 + 20 = 50$, $8 + 7 = 15$, וּבְיַחַד $50 + 15 = 65$.',
	},
	{
		id: 'sample-missing',
		type: 'missing-number',
		prompt: 'הַשְׁלִימוּ אֶת הַמִּסְפָּר הֶחָסֵר:',
		math: '☐ + 25 = 62',
		answer: { kind: 'number', rule: { op: 'eq', value: 37 }, solution: 37 },
		explanation: 'מְחַפְּשִׂים כַּמָּה חָסֵר מִ-25 עַד 62: $62 − 25 = 37$.',
	},
	{
		id: 'sample-inequality',
		type: 'inequality',
		prompt: 'כִּתְבוּ מִסְפָּר שֶׁיִּתְאִים:',
		math: '40 + ☐ > 55',
		answer: { kind: 'number', rule: { op: 'gt', value: 15 }, solution: 16 },
		explanation: '$40 + 15 = 55$ בְּדִיּוּק, לָכֵן כָּל מִסְפָּר גָּדוֹל מִ-15 מַתְאִים, לְמָשָׁל 16.',
	},
	{
		id: 'sample-word-problem',
		type: 'word-problem',
		prompt: 'קִרְאוּ וְעִנּוּ:',
		body: 'לְדָנָה הָיוּ 20 שְׁקָלִים. הִיא קָנְתָה 3 עֲפָרוֹנוֹת, כָּל עִפָּרוֹן בְּ-4 שְׁקָלִים. כַּמָּה כֶּסֶף נִשְׁאַר לָהּ?',
		answer: {
			kind: 'choice',
			options: ['7 שְׁקָלִים', '8 שְׁקָלִים', '12 שְׁקָלִים', '16 שְׁקָלִים'],
			correctIndex: 1,
		},
		explanation: '3 עֲפָרוֹנוֹת, כָּל אֶחָד בְּ-4 שְׁקָלִים: $3 × 4 = 12$. נִשְׁאַר: $20 − 12 = 8$.',
	},
	{
		id: 'sample-word-relation',
		type: 'word-relation',
		prompt: 'בַּחֲרוּ אֶת הַתְּשׁוּבָה הַנְּכוֹנָה:',
		body: 'אֵיזֶה זוּג מִלִּים הֵן הֲפָכִים?',
		answer: {
			kind: 'choice',
			options: ['גָּדוֹל – עֲנָק', 'שָׂמֵחַ – עָצוּב', 'מָהִיר – זָרִיז', 'יָפֶה – נֶחְמָד'],
			correctIndex: 1,
		},
		explanation: 'הֲפָכִים הֵן מִלִּים שֶׁאוֹמְרוֹת דְּבָרִים מְנֻגָּדִים: שָׂמֵחַ הוּא הַהֵפֶךְ מֵעָצוּב.',
	},
];

export const questionSets: Record<string, () => Question[]> = {
	demo: () => sampleQuestions,
};
