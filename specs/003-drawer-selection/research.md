# Research: Drawer Selection & Word Visibility

## Unknowns / Questions

- Deterministic word-selection algorithm: how to derive a reproducible pick from a room seed + round index.
- Source and placement of the starter word list (where it lives in the repo/runtime).
- Server-side access control for the secret word endpoint (how to ensure only the drawer can retrieve it).
- Exact trimming/validation rules for player display names (client vs server enforcement and error message text).

---

### Deterministic word selection

Decision: Use a simple, deterministic index algorithm: compute an integer hash of the concatenation `roomSeed + ":" + roundIndex`, then take `hash % starterList.length`. Implement a small stable hash (e.g. FNV-1a or a JS-friendly 32-bit hash) so the same inputs always produce the same index.

Rationale: This approach is simple to implement cross-platform (Node + browser tests), easy to reason about, and reproducible for test fixtures. It avoids shipping a custom PRNG state machine and is robust for short starter lists.

Alternatives considered:

- Use a seeded PRNG (e.g., mulberry32) seeded with `roomSeed` and advance to `roundIndex` draws. More flexible but slightly more code to maintain across environments.
- Use cryptographic HMAC-SHA256 then map to an index. More secure but unnecessary for deterministic test-oriented selection.

---

### Starter word list location

Decision: Reuse the existing server-side starter word list from the repository's seed data (seed/starterData.ts). The server will expose this list (read-only) where needed; for tests use the same module to keep values consistent.

Rationale: The repo already contains starter data for local development; centralizing the list on the backend avoids duplication and keeps the canonical list authoritative for deterministic selection.

Alternatives considered:

- Embedding a separate client-side copy (risk of drift).
- Loading words from an external API (adds network dependency and complexity).

---

### Secret-word access control

Decision: Server exposes an endpoint such as `GET /rooms/:roomId/rounds/:roundIndex/secret` which returns the secret word only when the requesting client's `clientId` (sent in a header or authenticated request context) matches the current `drawerPlayerId` for the round. The server must never include the secret word in the public room payload delivered to non-drawers.

Rationale: Centralizing access control on the server is the strongest protection against accidental leaks. The client should not guess or compute the secret word locally.

Alternatives considered:

- Emit the secret word to all clients and let the client hide it — insecure and violates requirements.

---

### Player display name trimming and validation

Decision: Enforce trimming and non-empty validation both client- and server-side. Implementation: call `trim()` on the submitted name; if the resulting string length is 0, reject with HTTP 400 and an error JSON `{ code: 'invalid_name', message: 'Please enter a name.' }`. The client should present the inline message exactly as required by UX tests.

Rationale: Clients can provide faster feedback, but server-side validation is required to prevent malformed data from entering the room model and to stay consistent with Test-First requirements.

Alternatives considered:

- Only client-side validation — insufficient, easily bypassed.

---

## Actionable outcomes

- Implement FNV-1a (or reuse existing hash utility) for deterministic index selection in the backend `room`/`round` logic.
- Use `seed/starterData.ts` as the canonical starter list; update backend APIs to reference it.
- Add server endpoint `GET /rooms/:roomId/rounds/:roundIndex/secret` with drawer-only access guard.
- Add server- and client-side validation for display names, and include an integration test verifying the 400 error for whitespace-only names.
