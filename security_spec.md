# Security Specification

## Data Invariants
1. `users/{userId}` can only be created and updated by the user whose UID matches `{userId}`.
2. `users/{userId}` must have `ownerId` matching `userId` and `request.auth.uid`.
3. `users/{userId}/expenses/{expenseId}` can only be managed by `{userId}`.
4. `Expense` documents must have a `size() < 100` description string and positive amount.

## The Dirty Dozen Payloads
- Spofing ownerId
- Writing to another user's profile
- Sending oversized strings
etc.
