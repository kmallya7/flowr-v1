# Mail Queue Contract (Phase 2)

Current setup uses Firebase `firestore-send-email` extension format and writes to `mail` (or custom configured collection).
Legacy `mailQueue` + custom worker flow is no longer the default in app code.

## Producer

- Source: `js/clientPortal.js`
- Writes on:
  - New invite created
  - Invite resent

## Queue Document Schema

Collection: `mail` (default extension collection)

Required fields (extension format):

- `to`: array of email strings
- `message.subject`: string
- `message.text` and/or `message.html`: string

Optional metadata fields:

- `flowrMeta.type`
- `flowrMeta.role`
- `flowrMeta.inviteStatus`
- `flowrMeta.requestedAt`

## Processing Rules

1. Install and configure Firebase Extension `firestore-send-email`.
2. Ensure extension is listening to the same collection as `window.EMAIL_EXTENSION_COLLECTION`.
3. App writes extension-compatible docs; extension handles sending/retries/logging.

## Invite Email Template Inputs

Data required by template:

- recipient name (`fullName`)
- role (`role`)
- login instruction: Google sign-in using invited email
- product URL (recommended env var)

## Access Sync on Successful Send (Optional)

After successful send, backend may update `accessUsers/{emailLower}`:

- `lastInviteSentAt`: server timestamp
- `inviteProviderMessageId`: provider message id

## Security Notes

- Firestore rules should restrict who can create/read `mail` documents.
- Extension service account handles sending lifecycle.
- UI role-guards are not enough; backend rules must enforce role access.
