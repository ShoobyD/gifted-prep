// Creates the admin family and its first child, once: the family that existed before the
// app had families (its password stays FAMILY_PASSWORD until it sets one in the app).
//
//   npm run db:bootstrap -- --family="שם המשפחה" --child="שם הילד"          the real database
//   npm run db:bootstrap:local -- --family="שם המשפחה" --child="שם הילד"    the local database
//
// Does nothing if an admin family already exists, so running it again is safe.

import { randomBytes } from 'node:crypto';
import { d1, databaseName, quote } from './d1.mjs';

const remote = process.argv.includes('--remote');
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3).trim();
const familyName = arg('family');
const childName = arg('child');
if (!familyName || !childName) {
	console.error('Usage: npm run db:bootstrap:local -- --family="שם המשפחה" --child="שם הילד"');
	process.exit(1);
}

console.log(`Database: ${databaseName(remote)}`);
const [[admin]] = d1('SELECT id, name FROM families WHERE is_admin = 1 LIMIT 1', { remote });
if (admin) {
	console.log(`Nothing to do: the admin family already exists (${admin.name}).`);
	process.exit(0);
}

const id = (prefix) => `${prefix}-${randomBytes(6).toString('hex')}`;
const familyId = id('f');
const childId = id('c');
const now = Date.now();

// One command, so it is all or nothing.
d1(`INSERT INTO families (id, name, password_hash, is_admin, created_at)
	VALUES (${quote(familyId)}, ${quote(familyName)}, NULL, 1, ${now});
INSERT INTO children (id, family_id, name, icon, position, created_at)
	VALUES (${quote(childId)}, ${quote(familyId)}, ${quote(childName)}, '', 0, ${now});`, { remote });

const [[family], [child]] = d1(`SELECT id, name, is_admin FROM families WHERE id = ${quote(familyId)};
SELECT id, name FROM children WHERE family_id = ${quote(familyId)}`, { remote });
console.log(`Created the admin family "${family.name}" (${family.id}) with the child "${child.name}" (${child.id}).`);
