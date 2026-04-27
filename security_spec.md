# Security Specification for PayOneAfrica

## Data Invariants
1. A transaction must always belong to a valid merchant.
2. Only the merchant owner can see their business info and API keys.
3. Only approved merchants can process successful transactions.
4. Admin can see and modify everything related to status and settlements.
5. Merchants cannot change their own balance directly via the client (system-only field).

## The Dirty Dozen Payloads (Target: Rejection)
1. Creating a merchant where `ownerId` != `request.auth.uid`.
2. Updating a merchant's `status` to 'approved' from the client.
3. Updating a merchant's `balance` directly from the client.
4. Reading another merchant's `apiKey`.
5. Creating a transaction with a fake `netAmount` to bypass fee logic.
6. Deleting a transaction record (immutability).
7. Creating a settlement record with `status: 'paid'`.
8. Injecting 1MB of garbage into the `businessName`.
9. Listing all transactions without a `merchantId` filter (Query Scraping).
10. Spoofing `request.auth.token.email`.
11. Updating `createdAt` timestamp.
12. Creating a merchant profile without being verified.

## Test Runner (Logic Overview)
- Verify `isOwner()` on `/merchants`.
- Verify `isAdmin()` on all paths.
- Verify `isValidMerchant()` checks key sizes and required fields.
- Verify `allow list` on `/transactions` forces `merchantId == auth.uid`'s merchantId.

## Conflict Report
| Collection | Identity Spoofing | State Shortcutting | Resource Poisoning |
|------------|-------------------|-------------------|--------------------|
| Merchants | Blocked by ownerId check | Blocked by action-based updates | Blocked by size guards |
| Transactions| Server-only write preferred | Fixed on creation | Size guards on strings |
| Settlements | Admin-only | Admin-only | Admin-only |
