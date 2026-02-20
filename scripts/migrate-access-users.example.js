/*
  Phase 4 migration template for accessUsers hardening.

  Usage:
  1. Put this in a Node environment with firebase-admin configured.
  2. Set GOOGLE_APPLICATION_CREDENTIALS.
  3. npm i firebase-admin
  4. node scripts/migrate-access-users.example.js
*/

const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const allowedRoles = new Set(['owner', 'admin', 'staff', 'client']);
const allowedStatuses = new Set(['active', 'pending', 'suspended']);
const allowedInviteStatuses = new Set(['invited', 'accepted', 'revoked', 'expired']);

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeRecord(docId, data = {}) {
  const emailLower = normalizeEmail(data.emailLower || data.email || docId);

  const roleRaw = String(data.role || '').toLowerCase();
  const statusRaw = String(data.status || '').toLowerCase();
  const inviteRaw = String(data.inviteStatus || '').toLowerCase();

  const role = allowedRoles.has(roleRaw) ? roleRaw : 'client';
  const status = allowedStatuses.has(statusRaw) ? statusRaw : 'pending';
  const inviteStatus = allowedInviteStatuses.has(inviteRaw) ? inviteRaw : 'invited';

  return {
    emailLower,
    role,
    status,
    inviteStatus,
    clientId: role === 'client' ? (data.clientId || emailLower) : null,
    staffId: role === 'staff' ? (data.staffId || emailLower) : null,
    schemaVersion: 2,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
}

async function main() {
  const snap = await db.collection('accessUsers').get();
  console.log(`Found ${snap.size} accessUsers docs`);

  let touched = 0;
  let batch = db.batch();
  let opCount = 0;

  for (const doc of snap.docs) {
    const current = doc.data() || {};
    const patch = normalizeRecord(doc.id, current);

    batch.set(doc.ref, patch, { merge: true });
    touched += 1;
    opCount += 1;

    if (opCount >= 400) {
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
  }

  if (opCount > 0) await batch.commit();

  console.log(`Migration complete. Updated ${touched} docs.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
