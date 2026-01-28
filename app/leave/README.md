# Leave Submission Wizard

This module implements the Navy Leave Request flow, featuring offline-first persistence, optimistic UI updates, and PII encryption.

## Architecture

- **State Management:** `useLeaveStore` (Zustand) handles the current wizard state, drafts, and submission logic.
- **Persistence:** `services/storage.ts` provides a unified interface for SQLite (Native) and LocalStorage (Web).
- **Security:** Sensitive fields (e.g., `emergencyContact`) are encrypted at rest using AES (via `crypto-js`).

## Offline Strategy

The app follows an "Offline First" approach:
1.  **Drafts:** Saved locally immediately upon edit (`updateDraft` with debounce).
2.  **Submission:**
    - **Step 1 (Optimistic):** The request is immediately added to the store with `status: 'pending'` and `syncStatus: 'pending_upload'`. The UI reflects success instantly.
    - **Step 2 (Background Sync):** The app attempts to send the payload to the API.
    - **Reconciliation:**
        - **Success:** The optimist record is replaced or updated with the server-confirmed ID. `syncStatus` becomes `'synced'`.
        - **Failure:** The record remains valid locally but `syncStatus` is marked as `'error'`. The user is notified (future: retry queue).

## Integration Tests Flow

The critical flow "Edit -> Invalidate Complete" ensures data integrity:
1.  User marks a step as "Complete".
2.  User taps "Edit" to modify a field.
3.  The system MUST automatically invalidate the "Complete" status of that step (and subsequent dependent steps).

## Constraints & Standards

- **No HTML Tags:** Use React Native primitives (`<View>`, `<Text>`) exclusively.
- **Styling:** Use NativeWind (`className="..."`). Avoid inline styles where possible.
- **PII Safety:** NEVER `console.log` form data, especially `emergencyContact` or PII fields. Use `logger.sanitize` if debugging is strictly necessary.
