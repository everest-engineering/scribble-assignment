# Research: Game Start and Drawer Flow (002)

## Decision 1 — Deterministic Word Selection Algorithm

**Decision**: Use a character-code-sum hash of the room code, modulo the word list length.

```
selectWord(code, words) = words[sum(code.charCodeAt(i) for i in 0..code.length-1) % words.length]
```

**Rationale**: Pure function — same input always produces same output. No external state, no `Math.random()`. O(1) relative to word list size. Trivially testable with hard-coded assertions (SC-003). Room codes are fixed at creation (4-char uppercase alphanumeric), so the hash is stable for the room's lifetime.

**Alternatives considered**:
- SHA-256 of room code → overkill for this use case, adds import dependency
- Lexicographic sort then index → coupling to word list order, fragile
- Room creation timestamp as seed → same code with different creation time yields different word; not stable across server restarts if room was recreated

---

## Decision 2 — Where `selectWord` Lives

**Decision**: Pure function exported from `backend/src/services/roomStore.ts` alongside other room logic. No new file.

**Rationale**: P1 (Brownfield) — extend existing file, do not create parallel service. The function is ~3 lines and used only by `startRoom`. Co-locating it keeps all game-state transitions in one place consistent with existing pattern.

**Alternatives considered**:
- `backend/src/utils/wordSelector.ts` — unnecessary indirection for a trivial function
- Inline inside `startRoom` — correct but harder to unit-test in isolation; exporting makes it directly testable

---

## Decision 3 — Viewer-Scoped Snapshot Shape

**Decision**: `toRoomSnapshot(room, viewerParticipantId)` returns:
- For drawer (`viewerParticipantId === room.drawerId`): `{ ..., drawerId: room.drawerId, secretWord: room.secretWord }`
- For guessers / unauthenticated: `{ ..., drawerId: room.drawerId, wordPlaceholder: "_ ".repeat(len).trim() }`

Both the drawer field and the word/placeholder are present on `RoomSnapshot`. Frontend reads `secretWord` (truthy only for drawer) or `wordPlaceholder`.

**Rationale**: Single snapshot type is simpler than two divergent types. The viewer-scoping happens at the serialisation boundary — the same pattern the spec calls for. The real word is never serialised into a non-drawer response.

**Alternatives considered**:
- Two distinct TypeScript types (`DrawerSnapshot` / `GuesserSnapshot`) — type-safe but requires discriminated union handling everywhere; excessive for this scope
- Always return both fields, frontend decides — forbidden by FR-004 ("actual word string MUST NOT appear in non-drawer snapshots")

---

## Decision 4 — Placeholder Format

**Decision**: One `_` per character, joined by spaces. `"apple"` → `"_ _ _ _ _"`.

**Rationale**: Matches spec assumption (FR-004, Assumptions section). Standard Hangman/Pictionary convention; immediately clear to users. Single-word list assumption (Assumptions) means no space-in-word edge case.

**Alternatives considered**:
- Blanks (`"___"`): harder to count letters at a glance
- Dots (`"• • •"`): non-ASCII, rendering inconsistency

---

## Decision 5 — `RoomSnapshot` Field Additions

**Decision**: Add two mutually-exclusive optional fields to the shared `RoomSnapshot` type:
- `secretWord?: string` — present only in drawer-scoped responses
- `wordPlaceholder?: string` — present only in guesser-scoped responses
- `drawerId: string` — always present when `status === "active"`; empty string `""` in lobby/ended for type simplicity

**Rationale**: Optional fields keep a single interface without discriminated union complexity. Frontend can do `snapshot.secretWord ?? snapshot.wordPlaceholder` safely. Constitution P4 (TypeScript-first): `any` forbidden; optional fields with `string | undefined` are fully typed.

**Alternatives considered**:
- `drawerId?: string` — makes it nullable in lobby where it's irrelevant, but lobby pages already read `hostId` for host gating; slight extra null-check burden. Using `""` in lobby is a simpler invariant.

---

## Decision 6 — `startRoom` Mutation

**Decision**: Update existing `startRoom()` in `roomStore.ts` to set `room.drawerId = room.hostId` and `room.secretWord = selectWord(room.code, STARTER_WORDS)` before persisting.

**Rationale**: Minimal change — one function, two new field assignments. Consistent with existing mutation pattern (direct assignment on the in-memory object, then `rooms.set`).

---

## Decision 7 — GamePage Polling

**Decision**: `GamePage.tsx` mirrors the `LobbyPage.tsx` polling pattern exactly: `setInterval(() => store.fetchRoom(), 2000)` in `useEffect` with cleanup on unmount.

**Rationale**: Spec FR-008, constitution P3 (HTTP polling ~2s). Reusing the same `fetchRoom()` method means the viewer-scoped response is already applied server-side — no frontend logic needed to decide which field to show beyond reading `snapshot.secretWord` vs `snapshot.wordPlaceholder`.

---

## Resolved Clarifications

| Question | Answer |
|---|---|
| Does game screen poll? | Yes — same ~2s cadence as lobby (FR-008) |
| Refresh mid-game → where? | Home screen — participant identity is ephemeral |
