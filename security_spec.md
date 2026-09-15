# Firebase Security Specification: SandY Intelligence

## 1. System Context & Data Invariants
- **Multi-Tenant User Isolation**: SandY Intelligence chat sessions and message logs are strictly private to the authenticated owner.
- **Relational Invariant**: Every `ChatSession` document and nested `ChatMessage` sub-document strictly belongs to `/users/{userId}/...`.
- **Identity Invariant**: `userId` inside document bodies must strictly match the path variable `{userId}` and `request.auth.uid`.
- **Temporal Invariant**: `createdAt` is validated against `request.time` on creation and is immutable upon update. `updatedAt` is strictly validated to equal `request.time` on updates.
- **Content Limits**: Individual message lengths cannot exceed 50,000 characters to prevent database bloat or Denial-of-Wallet attacks.
- **ID Sanitation**: Document IDs for sessions and messages must conform to `^[a-zA-Z0-9_\\-]+$` with a maximum length of 128 bytes.

## 2. The Dirty Dozen Payloads (Adversarial Tests)
1. **Unauthenticated Read/Write**: Attempting to read or write `/users/{anyId}/sessions/{sessionId}` without `request.auth` => REJECTED.
2. **User Impersonation Write**: User A attempting to create a session under `/users/UserB/sessions/s1` => REJECTED.
3. **Session Spoofing**: Setting `userId` in payload to User B while authenticated as User A under `/users/UserA/...` => REJECTED.
4. **Oversized Document ID Attack**: Providing an ID of 1,000 random characters => REJECTED (`isValidId` check).
5. **Special Characters ID Injection**: Injecting SQL/NoSQL punctuation like `../../` or special Unicode into document path => REJECTED.
6. **Oversized Message Content**: Pushing a message containing 100,000 characters => REJECTED (`size() <= 50000`).
7. **Immutable Timestamp Tampering**: Modifying `createdAt` during a session update => REJECTED (`incoming().createdAt == existing().createdAt`).
8. **Forged Future Server Timestamp**: Sending client timestamp in `updatedAt` instead of `request.time` => REJECTED.
9. **Shadow Field Injection**: Injecting arbitrary administrative fields like `role: 'admin'` or `bypass: true` => REJECTED.
10. **Role Enum Spoofing**: Setting message role to `system_override` instead of `user` or `assistant` => REJECTED.
11. **Cross-Session Message Injection**: Creating a message under session `s1` whose payload specifies `sessionId: 's2'` => REJECTED.
12. **Foreign Session Listing**: Attempting to query `list` across another user's session collection => REJECTED.
