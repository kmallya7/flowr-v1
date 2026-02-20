# Flowr — Lush Patisserie Production and Pastry Management

Flowr is the production command center for Lush Patisserie. It brings together daily logging, billing, pantry management, and operational analytics in one streamlined workspace.

## Highlights

- Centralized daily log for batches, staff shifts, and kitchen output
- Billing tools with invoice generation and recipe margin calculator
- Analytics for trends and performance
- Quick actions for common operational tasks
- Pastry management with inventory, clients, fixed expenses, and export
- Built-in dark mode

## Daily Operations

- Daily Log: Track production batches, staff shifts, and total kitchen output with notes.
- Dashboard: View date context (e.g., Saturday, Jan 17) and access key modules quickly.
- Quick Actions: Add Ingredient, New Client, Record Payment, View Orders.

## Billing and Costing

- Invoice: Generate client bills and manage records.
- Recipe Calculator: Calculate ingredient quantities, costs, and profit margins.

## Analytics

- Performance and trend views for operational and financial insights.
- Designed for fast visibility into day-to-day performance.

## Pastry Management

- Inventory: Track pantry items and sizes with supported units (g, kg, ml, L).
- Clients: Maintain customer records for faster invoicing.
- Fixed Expenses: Organize recurring costs for net margin clarity.
- Export: Move data out for reports or backups.

### Pantry — Add Ingredient

- Fields: Ingredient Name, Size, Unit (g/kg/ml/L), Cost (₹).
- Actions: Cancel, Confirm.
- Optimized for quick, consistent data entry.

## UI and Access

- Clean, mobile-friendly interface focused on speed.
- Dark Mode: Toggle in profile settings.
- Profile and Sign Out for secure session management.
- Role-aware navigation and section guards for `owner`, `admin`, `staff`, and `client`.

## Access and Invites (Phase 2)

- Admin People workspace supports inviting clients/staff and lifecycle tracking.
- Invite email requests are written in Firebase `firestore-send-email` format to `mail` (or custom extension collection).
- Access records are stored in `accessUsers`.
- Backend artifacts:
  - `docs/email-worker-contract.md`
  - `functions/index.example.js`
  - `docs/firestore-rules-phase2.md`

## Role Portals (Phase 3)

- Dedicated role modes now exist:
  - `owner/admin`: full management workspace
  - `staff`: staff-focused workspace
  - `client`: client-facing portal
- Sidebar and section access are role-aware at runtime.

## Phase 3.1 Enhancements

- Staff workspace now includes embedded operational tables (orders queue, inventory, recent work logs).
- Header includes role badge and quick-action shortcuts by role.
- Admin People includes inline role editing and a compact permission matrix.

## Phase 4 Hardening

- Access doc normalization + schema backfill path (`schemaVersion: 2`).
- Safer auth fallback (`access-check-failed` denies access instead of fail-open).
- Migration template: `scripts/migrate-access-users.example.js`.
- Release checklist: `docs/phase4-hardening-checklist.md`.

## Version

- Flowr v1.0.0 • Lush Patisserie

## License

This project is private and proprietary.  
© 2026 Karthick Mallya. All rights reserved. Unauthorized use or reproduction is strictly prohibited.
