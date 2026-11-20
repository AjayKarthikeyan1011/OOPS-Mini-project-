# Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **CustomerProfile (`/customers/{userId}`)**: Contains PII (`address`, `email`). Only the owning authenticated, email-verified user (`request.auth.uid == userId`) or the verified Admin (`ajaykarthikeyan4545@gmail.com`) may read or write. `ownerUid` must equal `userId` and `request.auth.uid`.
2. **Order (`/orders/{orderId}`)**: Contains PII (`customerAddress`). An order must have `ownerUid == request.auth.uid`, positive `total`, valid `paymentMethod` (`Online Payment` or `Cash on Delivery`), bounded `items` (`1..20` entries), and server-enforced `createdAt == request.time`. Once `status == 'Delivered'`, non-admins cannot mutate the order (terminal state lock).
3. **Review (`/reviews/{reviewId}`)**: Contains no PII. `rating` must be an integer `>= 1 && <= 5`. `ownerUid` must equal `request.auth.uid`. Updates/deletes are restricted to owner or Admin.
4. **LogEntry (`/logs/{logId}`)**: `level` must be `'INFO'` or `'WARNING'`. Only owner or Admin may read/list/delete.
5. **Global Catch-All**: Default deny (`allow read, write: if false;`) at root.

## 2. The Dirty Dozen Payloads (Must All Be Rejected with PERMISSION_DENIED)
1. Unauthenticated write to `/orders/order_1` (`request.auth == null`).
2. Unverified email write (`email_verified == false`) to `/customers/uid1`.
3. Identity spoofing: creating `/orders/order_1` with `ownerUid: "victim_uid"` while signed in as `"attacker_uid"`.
4. Shadow / Ghost field injection on `/orders/order_1` (`isFree: true` extra field).
5. Non-owner reading `/customers/victim_uid` (PII address leak).
6. Non-owner listing `/orders` without `where('ownerUid', '==', auth.uid)` filter.
7. Oversized `items` list (`items.size() == 25 > 20`) or empty `items` (`items.size() == 0`) on `/orders/order_1`.
8. Invalid rating (`rating: 6` or `rating: 0`) on `/reviews/rev_1`.
9. Client-spoofed `createdAt` timestamp (`createdAt != request.time`) on `/orders/order_1`.
10. Terminal state bypass: non-admin updating an order whose existing `status == 'Delivered'`.
11. Immutable field tampering: changing `ownerUid` or `createdAt` during an order status update.
12. Path ID poisoning: creating `/orders/bad$id` failing `^[a-zA-Z0-9_\-]+$` regex or exceeding 128 chars.
