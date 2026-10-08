import type { QuestionType } from '@/types';

export const TYPE_LABELS: Record<QuestionType, string> = {
	'reading-fact': 'מֵידָע מִתּוֹךְ הַטֶּקְסְט',
	'word-meaning': 'מַשְׁמָעוּת שֶׁל מִלָּה',
	'author-purpose': 'כַּוָּנַת הַכּוֹתֵב',
	'inference': 'הַסָּקַת מַסְקָנוֹת',
	'not-answered': 'עַל מָה הַטֶּקְסְט לֹא עוֹנֶה',
	'pronoun': 'לְמִי הַכַּוָּנָה',
	'word-relation': 'יַחַס בֵּין מִלִּים',
	'exercise': 'תַּרְגִּילִים',
	'missing-number': 'הַמִּסְפָּר הֶחָסֵר',
	'inequality': 'גָּדוֹל אוֹ קָטָן',
	'word-problem': 'בְּעָיוֹת מִלּוּלִיּוֹת',
	'picture-riddle': 'חִידוֹת צִיּוּרִים',
	'symbol-digit': 'סְפָרוֹת סוֹדִיּוֹת',
};
