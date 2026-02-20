# Functions (Example)

This folder contains a Phase 2 example worker for invite emails.

- `index.example.js`: Firestore trigger that consumes `mailQueue` and sends invite emails.

## Next steps

1. Create a real Firebase Functions project (`firebase init functions`) if not already present.
2. Copy `index.example.js` into the functions project as `index.js`.
3. Install dependencies (`firebase-admin`, `firebase-functions`, `resend`).
4. Configure env vars/secrets (`RESEND_API_KEY`, `APP_URL`, `MAIL_FROM`).
5. Deploy and verify queue processing in Firestore.
