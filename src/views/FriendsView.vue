<script setup lang="ts">
import { onMounted } from 'vue';
import ProfileCard from '@/components/ProfileCard.vue';
import { useChildren } from '@/composables/useChildren';
import { useProfiles } from '@/composables/useProfiles';

// Every child in every family, side by side: what each one achieved, in a fixed order
// (never a ranking), so nobody comes last. A card opens that child's profile.
const { data, status, refresh } = useProfiles();
const { activeChild } = useChildren();

onMounted(refresh);
</script>

<template>
	<p v-if="!data && status !== 'failed'" class="note">טוֹעֲנִים…</p>
	<p v-else-if="!data" class="note">אֵין חִבּוּר לָאִינְטֶרְנֶט. נְנַסֶּה שׁוּב אַחַר כָּךְ.</p>
	<template v-else>
		<p v-if="status === 'failed'" class="note">אֵין חִבּוּר לָאִינְטֶרְנֶט, וְלָכֵן אֵלֶּה הַנְּתוּנִים מֵהַפַּעַם הַקּוֹדֶמֶת.</p>
		<div class="cards">
			<RouterLink
				v-for="profile in data.profiles"
				:key="profile.id"
				class="link"
				:to="{ name: 'friend', params: { id: profile.id } }"
			>
				<ProfileCard :profile="profile" :today="data.today" :me="profile.id === activeChild?.id" />
			</RouterLink>
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
	grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
	gap: 16px;
}

.link {
	display: block;
	border-radius: var(--radius);
	text-decoration: none;
}

.link:active {
	transform: translateY(3px);
}
</style>
