# Firestore Rules Template (Phase 2)

UI guards are convenience only. Enforce permissions with Firestore rules.

Use this as a starting point and adapt to your collections and business policy.

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() {
      return request.auth != null;
    }

    function emailLower() {
      return lower(request.auth.token.email);
    }

    function accessDoc() {
      return get(/databases/$(database)/documents/accessUsers/$(emailLower()));
    }

    function role() {
      return accessDoc().data.role;
    }

    function status() {
      return accessDoc().data.status;
    }

    function inviteStatus() {
      return accessDoc().data.inviteStatus;
    }

    function isActive() {
      return signedIn() && status() == 'active' && inviteStatus() in ['accepted', 'invited'];
    }

    function isOwner() {
      return isActive() && role() == 'owner';
    }

    function isAdmin() {
      return isActive() && role() in ['owner', 'admin'];
    }

    function isStaff() {
      return isActive() && role() in ['owner', 'admin', 'staff'];
    }

    function isClient() {
      return isActive() && role() == 'client';
    }

    // Access user directory
    match /accessUsers/{id} {
      allow read: if isStaff();
      allow create, update, delete: if isAdmin();
    }

    // Email extension queue: only admins write; backend extension handles processing fields.
    match /mail/{id} {
      allow create: if isAdmin();
      allow read: if isAdmin();
      allow update, delete: if false;
    }

    // Staff directory
    match /staff/{id} {
      allow read: if isStaff();
      allow write: if isAdmin();
    }

    // Clients
    match /clients/{id} {
      allow read: if isStaff() || (isClient() && id == emailLower());
      allow write: if isAdmin();
    }

    // Orders (example)
    match /orders/{id} {
      allow read: if isStaff() || isClient();
      allow write: if isStaff();
    }

    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Notes

- The backend invite worker should use Admin SDK, so these rule restrictions do not block it.
- If you use UIDs instead of email-doc IDs, replace `emailLower()` lookup logic.
- For multi-tenant orgs, add `orgId` checks to every collection rule.
