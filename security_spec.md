# StoryWeave Security Specification (Payload-First TDD)

## 1. Data Invariants
1. **Owner & Verified Identity Isolation**: Every user document (`/users/{userId}`) and user-owned subcollection document (`stories`, `characters`, `plots`, `preferences`) belongs strictly to the authenticated, email-verified user whose `request.auth.uid == userId`.
2. **Master Gate Parent Link**: No subcollection document (`stories`, `characters`, `plots`, `preferences`) can be written unless `/users/{userId}` exists (or is created atomically in the same batch via `existsAfter`).
3. **Immutable Identity & Creation Timestamps**: `uid` / `userId` and `createdAt` can never change after creation. `createdAt` (on create) and `updatedAt` (on create/update) must strictly equal `request.time`.
4. **No Shadow Fields & Bounded Strings/Arrays**: All payloads enforce `keys().hasAll(...)` + `keys().hasOnly(...)` on create, `affectedKeys().hasOnly(...)` on update, explicit string `.size()` ceilings, and bounded array lengths (`<= 25`).
5. **PII Isolation**: User email, displayName, and photoURL under `/users/{userId}` are never listable and only readable by the document owner.

## 2. "Dirty Dozen" Adversarial Payloads
1. **Unverified Email Spoof**: `{ uid: "u1", email: "user@example.com", displayName: "Writer", createdAt: serverTime, updatedAt: serverTime }` with `request.auth.token.email_verified == false` -> **PERMISSION_DENIED**.
2. **Cross-Tenant User Profile Read**: `get(/users/otherUser)` as `u1` -> **PERMISSION_DENIED**.
3. **Directory Scraping / List Users**: `list(/users)` as authenticated `u1` -> **PERMISSION_DENIED**.
4. **Cross-Tenant Story Injection**: `create(/users/otherUser/stories/s1, { id: "s1", userId: "u1", ... })` -> **PERMISSION_DENIED**.
5. **Identity Spoofing Inside Payload**: `create(/users/u1/stories/s1, { id: "s1", userId: "otherUser", ... })` -> **PERMISSION_DENIED**.
6. **Shadow Field Injection ("Ghost Field")**: `create(/users/u1, { uid: "u1", email: "...", displayName: "...", isAdmin: true, createdAt: serverTime, updatedAt: serverTime })` -> **PERMISSION_DENIED**.
7. **ID Poisoning Attack**: `create(/users/u1/stories/bad..id$with#spaces, ...)` -> **PERMISSION_DENIED** (`isValidId` fails).
8. **Orphaned Subcollection Write**: `create(/users/u1/stories/s1, ...)` when `/users/u1` does not exist -> **PERMISSION_DENIED** (Master Gate fails).
9. **Client Timestamp Tampering**: `create(/users/u1/characters/c1, { ..., createdAt: "2020-01-01", updatedAt: serverTime })` -> **PERMISSION_DENIED**.
10. **Immortal Field Mutation on Update**: `update(/users/u1/stories/s1, { userId: "u2", updatedAt: serverTime })` -> **PERMISSION_DENIED**.
11. **Value Poisoning / Type Mismatch on Update**: `update(/users/u1/stories/s1, { wordCount: "ten-thousand", updatedAt: serverTime })` -> **PERMISSION_DENIED**.
12. **Array Exhaustion ("Denial of Wallet")**: `create(/users/u1/characters/c1, { ..., strengths: [/* 25 strings */] })` -> **PERMISSION_DENIED** (`strengths.size() <= 15` fails).
