<script setup lang="ts">
import { onMounted } from 'vue';
import { useChildren } from '@/composables/useChildren';
import { useProfiles } from '@/composables/useProfiles';
import { daysBetween, type Profile } from '@/family/profilesApi';

// Every child in every family, side by side: what each one achieved, in a fixed order
// (never a ranking), so nobody comes last.
const { data, status, refresh } = useProfiles();
const { activeChild } = useChildren();

onMounted(refresh);

// Neutral wording ("practice", not "practiced"): the children are boys and girls.
function lastPractice(profile: Profile): string {
	if (!profile.lastPractice || !data.value) return 'עוֹד אֵין אִמּוּנִים';
	const days = daysBetween(profile.lastPractice, data.value.today);
	if (days <= 0) return 'אִמּוּן אַחֲרוֹן: הַיּוֹם';
	if (days === 1) return 'אִמּוּן אַחֲרוֹן: אֶתְמוֹל';
	if (days === 2) return 'אִמּוּן אַחֲרוֹן: לִפְנֵי יוֹמַיִם';
	return `אִמּוּן אַחֲרוֹן: לִפְנֵי ${days} יָמִים`;
}
</script>

<template>
	<p v-if="!data && status !== 'failed'" class="note">טוֹעֲנִים…</p>
	<p v-else-if="!data" class="note">אֵין חִבּוּר לָאִינְטֶרְנֶט. נְנַסֶּה שׁוּב אַחַר כָּךְ.</p>
	<template v-else>
		<p v-if="status === 'failed'" class="note">אֵין חִבּוּר לָאִינְטֶרְנֶט, וְלָכֵן אֵלֶּה הַנְּתוּנִים מֵהַפַּעַם הַקּוֹדֶמֶת.</p>
		<div class="cards">
			<article v-for="profile in data.profiles" :key="profile.id" class="card" :class="{ me: profile.id === activeChild?.id }">
				<header class="who">
					<span class="icon" aria-hidden="true">{{ profile.icon || '🙂' }}</span>
					<span class="names">
						<span class="name">{{ profile.name }}<span v-if="profile.id === activeChild?.id" class="badge">אֲנִי</span></span>
						<span class="family">{{ profile.family }}</span>
					</span>
				</header>
				<dl class="stats">
					<div><dt>כּוֹכָבִים</dt><dd>⭐ {{ profile.stars }}</dd></div>
					<div><dt>רֶצֶף יָמִים</dt><dd>🔥 {{ profile.streak }}</dd></div>
					<div><dt>הַשָּׁבוּעַ</dt><dd>✨ {{ profile.weekStars }}</dd></div>
					<div><dt>מַדְבֵּקוֹת</dt><dd>🎖️ {{ profile.stickers.length }}</dd></div>
				</dl>
				<p class="last">{{ lastPractice(profile) }}</p>
			</article>
		</div>
	</template>
</template>

<style scoped>
.note {
	margin: 0 0 16px;
	text-align: center;
	color: var(--muted);
}

.cards {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 16px;
}

.card {
	display: grid;
	gap: 12px;
	padding: 16px;
	border-radius: var(--radius);
	background: var(--surface);
	box-shadow: var(--shadow);
}

.card.me {
	outline: 3px solid var(--primary);
}

.who {
	display: flex;
	align-items: center;
	gap: 12px;
}

.icon {
	font-size: 48px;
	line-height: 1;
}

.names {
	display: grid;
}

.name {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 24px;
	font-weight: 700;
}

.badge {
	padding: 0 10px;
	border-radius: 999px;
	background: var(--primary);
	color: #fff;
	font-size: 15px;
}

.family {
	color: var(--muted);
	font-size: 15px;
}

.stats {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 6px;
	margin: 0;
	text-align: center;
}

.stats dt {
	color: var(--muted);
	font-size: 13px;
}

.stats dd {
	margin: 0;
	font-size: 20px;
	font-weight: 700;
	white-space: nowrap;
}

.last {
	margin: 0;
	color: var(--muted);
	font-size: 16px;
}
</style>
