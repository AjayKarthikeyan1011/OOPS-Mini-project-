/**
 * Security TDD Specification for the "Dirty Dozen" Payloads documented in security_spec.md.
 * Run against the Firebase Emulator Suite if installed locally.
 */
export const DIRTY_DOZEN_CASES = [
  { id: 1, name: 'Unauthenticated order write', collection: 'orders', expected: 'PERMISSION_DENIED' },
  { id: 2, name: 'Unverified email customer profile write', collection: 'customers', expected: 'PERMISSION_DENIED' },
  { id: 3, name: 'Identity spoofing (ownerUid mismatch)', collection: 'orders', expected: 'PERMISSION_DENIED' },
  { id: 4, name: 'Shadow field injection (isFree: true)', collection: 'orders', expected: 'PERMISSION_DENIED' },
  { id: 5, name: 'Non-owner PII read on /customers', collection: 'customers', expected: 'PERMISSION_DENIED' },
  { id: 6, name: 'Unfiltered list query on /orders by non-admin', collection: 'orders', expected: 'PERMISSION_DENIED' },
  { id: 7, name: 'Oversized items array (> 20) or empty items', collection: 'orders', expected: 'PERMISSION_DENIED' },
  { id: 8, name: 'Invalid review rating (0 or 6)', collection: 'reviews', expected: 'PERMISSION_DENIED' },
  { id: 9, name: 'Client-spoofed createdAt timestamp', collection: 'orders', expected: 'PERMISSION_DENIED' },
  { id: 10, name: 'Terminal state bypass after Delivered', collection: 'orders', expected: 'PERMISSION_DENIED' },
  { id: 11, name: 'Immutable ownerUid mutation on update', collection: 'orders', expected: 'PERMISSION_DENIED' },
  { id: 12, name: 'Invalid path ID characters ($ or >128 chars)', collection: 'orders', expected: 'PERMISSION_DENIED' },
] as const;
