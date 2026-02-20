# Phase 4 Hardening Checklist

## Data Integrity

- [ ] Run `scripts/migrate-access-users.example.js` (or equivalent backend migration).
- [ ] Confirm all `accessUsers` docs have:
  - `emailLower`
  - `role` in `owner|admin|staff|client`
  - `status` in `active|pending|suspended`
  - `inviteStatus` in `invited|accepted|revoked|expired`
  - `schemaVersion: 2`
- [ ] For `role=client`, verify `clientId` set.
- [ ] For `role=staff`, verify `staffId` set.

## Auth + Access Behavior

- [ ] Non-invited Google account is denied and signed out.
- [ ] Suspended account is denied and signed out.
- [ ] Revoked/expired invite account is denied and signed out.
- [ ] Owner/admin can access Admin workspace.
- [ ] Staff cannot access Admin workspace.
- [ ] Client cannot access inventory/clients/admin sections.

## UI/UX Behavior

- [ ] Sidebar nav works after role switches (owner/admin/staff/client).
- [ ] Header role badge updates correctly by role.
- [ ] Header quick actions route correctly for each role mode.
- [ ] Staff embedded tables render without console errors.
- [ ] Admin role dropdown updates role and refreshes table state.

## Backend Email Worker

- [ ] `mail` collection docs are consumed by `firestore-send-email`.
- [ ] Extension logs show successful send attempts for invite docs.
- [ ] Resend action creates a new extension-compatible mail document.

## Security

- [ ] Firestore rules enforce role restrictions server-side.
- [ ] Client cannot modify email extension processing documents after creation.
- [ ] Client cannot elevate role by writing `accessUsers`.
- [ ] Admin SDK worker is the only actor mutating send statuses.

## Release Gate

- [ ] Test accounts for each role validated in production-like environment.
- [ ] Monitoring in place for sign-in denials and email failures.
- [ ] Rollback plan documented for auth/rules changes.
