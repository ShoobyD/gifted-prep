<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue';
import { familiesApi, familyErrorMessage, generatePassword, type FamilyEntry } from '@/family/familiesApi';
import { CHILD_ICONS } from '@/family/icons';
import { formatDateTime } from '@/utils/format';

// The admin's screen: the families that use the app. Passwords are set here and given to
// each family; the server keeps only a hash, so a forgotten password is replaced, not shown.
const families = shallowRef<FamilyEntry[]>([]);
const status = ref<'loading' | 'idle' | 'failed'>('loading');
const saving = ref(false);
const error = ref('');
// What just happened; after a password was set, also the password, shown this once to pass on.
const notice = ref('');
const noticePassword = ref('');
const copied = ref(false);

async function run(task: () => Promise<FamilyEntry[]>, done?: string, password?: string): Promise<boolean> {
	saving.value = true;
	error.value = '';
	notice.value = '';
	noticePassword.value = '';
	copied.value = false;
	try {
		families.value = await task();
		if (done) notice.value = done;
		if (password) noticePassword.value = password;
		return true;
	} catch (cause) {
		error.value = familyErrorMessage(cause);
		return false;
	} finally {
		saving.value = false;
	}
}

onMounted(async () => {
	try {
		families.value = await familiesApi.list();
		status.value = 'idle';
	} catch {
		status.value = 'failed';
	}
});

// --- A new family ---

const adding = ref(false);
const newName = ref('');
const newPassword = ref('');
const newChild = ref('');

function startAdding() {
	adding.value = true;
	newName.value = '';
	newPassword.value = generatePassword();
	newChild.value = '';
	error.value = '';
}

async function add() {
	const name = newName.value.trim();
	const password = newPassword.value.trim();
	const childName = newChild.value.trim();
	const icon = CHILD_ICONS[families.value.length % CHILD_ICONS.length] ?? '';
	const created = await run(
		() => familiesApi.create({ name, password, ...(childName && { child: { name: childName, icon } }) }),
		`נוצרה המשפחה "${name}". זו הסיסמה שלה; העבירו אותה למשפחה. אחרי סגירת ההודעה אי אפשר לראות אותה שוב.`,
		password,
	);
	if (created) adding.value = false;
}

// --- Changing a family ---

// The family being changed, and what about it.
const editing = ref<{ id: string; field: 'name' | 'password' }>();
const value = ref('');

function startEditing(family: FamilyEntry, field: 'name' | 'password') {
	editing.value = { id: family.id, field };
	value.value = field === 'name' ? family.name : generatePassword();
	error.value = '';
}

async function saveEdit(family: FamilyEntry) {
	const field = editing.value?.field;
	const text = value.value.trim();
	const saved = field === 'name'
		? await run(() => familiesApi.update(family.id, { name: text }))
		: await run(
			() => familiesApi.update(family.id, { password: text }),
			family.admin
				? 'הסיסמה של המשפחה שלכם הוחלפה. מעכשיו נכנסים רק איתה; המכשירים שכבר מחוברים נשארים מחוברים.'
				: `זו הסיסמה החדשה של "${family.name}"; העבירו אותה למשפחה. המכשירים שלהם שכבר מחוברים נשארים מחוברים.`,
			text,
		);
	if (saved) editing.value = undefined;
}

async function copyPassword() {
	try {
		await navigator.clipboard.writeText(noticePassword.value);
		copied.value = true;
	} catch {
		// No clipboard access (e.g. not a secure page): the password is on screen to copy by hand.
	}
}

async function remove(family: FamilyEntry) {
	const kids = family.children.map((c) => c.name).join(', ');
	if (!confirm(`למחוק את המשפחה "${family.name}"${kids ? ` ואת ההתקדמות של ${kids}` : ''}? המכשירים שלה יתנתקו, ואי אפשר לשחזר.`)) return;
	await run(() => familiesApi.remove(family.id), `המשפחה "${family.name}" נמחקה.`);
}
</script>

<template>
	<section class="card">
		<h2>משפחות</h2>
		<p class="note">כל משפחה נכנסת עם סיסמה משלה ורואה רק את הילדים שלה. את הילדים כל משפחה מוסיפה בעצמה, בלשונית "הגדרות".</p>

		<p v-if="status === 'loading'" class="note">טוען…</p>
		<p v-else-if="status === 'failed'" class="message tone--warn">אין חיבור לשרת, ואי אפשר להציג את המשפחות.</p>

		<ul v-else class="families">
			<li v-for="family in families" :key="family.id" class="family">
				<div class="head">
					<strong>{{ family.name }}</strong>
					<span v-if="family.admin" class="badge">מנהל</span>
				</div>
				<p class="meta">
					<template v-if="family.children.length">
						<span v-for="child in family.children" :key="child.id" class="child">{{ child.icon }} {{ child.name }}</span>
					</template>
					<template v-else>עוד אין ילדים</template>
				</p>
				<p class="meta">
					נוצרה {{ formatDateTime(family.createdAt) }}<template v-if="family.admin && !family.hasPassword"> · נכנסים עם הסיסמה המקורית</template>
				</p>

				<form v-if="editing?.id === family.id" class="edit" @submit.prevent="saveEdit(family)">
					<label>
						{{ editing.field === 'name' ? 'שם המשפחה' : 'סיסמה חדשה' }}
						<span class="field">
							<input v-model="value" :maxlength="editing.field === 'name' ? 40 : 100" dir="auto" autocomplete="off">
							<button v-if="editing.field === 'password'" type="button" class="btn" @click="value = generatePassword()">סיסמה אקראית</button>
						</span>
					</label>
					<div class="actions">
						<button type="submit" class="btn btn--primary" :disabled="saving">{{ saving ? 'שומר…' : 'שמירה' }}</button>
						<button type="button" class="btn" :disabled="saving" @click="editing = undefined">ביטול</button>
					</div>
				</form>
				<div v-else class="actions">
					<button type="button" class="btn" :disabled="saving" @click="startEditing(family, 'name')">שינוי שם</button>
					<button type="button" class="btn" :disabled="saving" @click="startEditing(family, 'password')">סיסמה חדשה</button>
					<button v-if="!family.admin" type="button" class="btn btn--danger" :disabled="saving" @click="remove(family)">מחיקה</button>
				</div>
			</li>
		</ul>

		<form v-if="adding" class="edit add" @submit.prevent="add">
			<h3>משפחה חדשה</h3>
			<label>
				שם המשפחה
				<input v-model="newName" maxlength="40" required>
			</label>
			<label>
				סיסמה
				<span class="field">
					<input v-model="newPassword" maxlength="100" dir="ltr" autocomplete="off" required>
					<button type="button" class="btn" @click="newPassword = generatePassword()">סיסמה אקראית</button>
				</span>
			</label>
			<label>
				שם הילד הראשון (לא חובה; אפשר להוסיף ילדים גם אחר כך)
				<input v-model="newChild" maxlength="40">
			</label>
			<div class="actions">
				<button type="submit" class="btn btn--primary" :disabled="saving">{{ saving ? 'שומר…' : 'יצירה' }}</button>
				<button type="button" class="btn" :disabled="saving" @click="adding = false">ביטול</button>
			</div>
		</form>
		<div v-else-if="status === 'idle'" class="actions">
			<button type="button" class="btn" :disabled="saving" @click="startAdding">+ משפחה חדשה</button>
		</div>

		<p v-if="error" class="message tone--warn" role="alert">{{ error }}</p>
		<div v-if="notice" class="message tone--ok notice" role="status">
			<p>{{ notice }}</p>
			<p v-if="noticePassword" class="password-row">
				<bdi class="password" dir="ltr">{{ noticePassword }}</bdi>
				<button type="button" class="btn" @click="copyPassword">{{ copied ? 'הועתק ✓' : 'העתקה' }}</button>
			</p>
			<button type="button" class="btn" @click="notice = ''; noticePassword = ''">סגירה</button>
		</div>
	</section>
</template>

<style scoped>
.families {
	display: grid;
	gap: 12px;
	margin: 12px 0;
	padding: 0;
	list-style: none;
}

.family {
	display: grid;
	gap: 6px;
	padding: 12px;
	border: 2px solid #eeeaff;
	border-radius: 14px;
}

.head {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 18px;
}

.badge {
	padding: 2px 10px;
	border-radius: 999px;
	background: #eeeaff;
	font-size: 13px;
}

.meta {
	display: flex;
	flex-wrap: wrap;
	gap: 4px 12px;
	margin: 0;
	color: var(--muted);
	font-size: 14px;
}

.edit {
	display: grid;
	gap: 10px;
}

.add {
	margin-top: 12px;
	padding: 12px;
	border: 2px dashed #e2ddff;
	border-radius: 14px;
}

.add h3 {
	margin: 0;
	font-size: 17px;
}

.edit label {
	display: grid;
	gap: 4px;
	font-size: 14px;
	color: var(--muted);
}

.field {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.edit input {
	flex: 1 1 180px;
	min-height: 44px;
	padding: 0 12px;
	border: 2px solid #e2ddff;
	border-radius: 12px;
	font: inherit;
	font-size: 16px;
}

.notice {
	display: grid;
	justify-items: start;
	gap: 8px;
	user-select: text;
}

.notice p {
	margin: 0;
}

.password-row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 10px;
}

.password {
	padding: 6px 12px;
	border-radius: 10px;
	background: #eeeaff;
	color: var(--text);
	font-family: ui-monospace, Consolas, monospace;
	font-size: 20px;
	letter-spacing: 1px;
}

.btn--primary {
	background: var(--primary);
	border-color: var(--primary);
	color: #fff;
	font-weight: 700;
}
</style>
