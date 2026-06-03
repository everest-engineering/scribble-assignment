# Research: Game Start & Drawer Flow

**Feature**: `002-game-start-drawer-flow`
**Date**: 2026-06-03
**Status**: Complete — all NEEDS CLARIFICATION markers resolved in `/speckit.clarify` session.

---

## Decision 1 — Round State Location

**Decision**: Add `currentDrawerId?: string`, `currentWord?: string`, and `roundNumber?: number` directly to the `Room` model (and `currentDrawerId?` / `currentWord?` to `RoomSnapshot`) in `backend/src/models/game.ts`.

**Rationale**: Fields are optional in lobby state (undefined until `startRoom` is called). This avoids a new entity class and stays consistent with the existing flat model shape. Aligns with Constitution Principle V (Minimal Footprint — no speculative abstractions).

**Alternatives considered**:

- Separate `Round` entity — rejected; adds a join/lookup step with no benefit at this scale.
- Private server-side `Map<string, RoundState>` — rejected; splits related state across two structures for no gain.

---

## Decision 2 — Deterministic Word Selection

**Decision**: `words[(roundNumber - 1) % words.length]` where `roundNumber = 1` always in this feature, yielding `STARTER_WORDS[0]` (`"rocket"`).

**Rationale**: Formula is exhaustion-safe (modulo wraps), fully deterministic, and trivially unit-testable. `STARTER_WORDS` is a `const` array of 5 words already in `backend/src/seed/starterData.ts`.

**Alternatives considered**:

- `Math.random()` selection — rejected; violates FR-006 (must be deterministic).
- Hash-based selection — rejected; unnecessary complexity (Principle V).

---

## Decision 3 — Word Visibility Mechanism

**Decision**: Activate the existing `viewerParticipantId` parameter in `toRoomSnapshot`. When `viewerParticipantId === room.currentDrawerId`, include `currentWord` in the snapshot. For all other callers (including `undefined`), omit it (set to `null`).

**Rationale**: The `participantId` query param is already wired through the entire call chain: `api.fetchRoom` → `GET /rooms/:code?participantId=…` → route handler → `toRoomSnapshot(room, participantId)`. The parameter was stored but unused (`void viewerParticipantId`). Activating it adds zero new surface area.

**Alternatives considered**:

- New dedicated endpoint `GET /rooms/:code/round` — rejected; unnecessary endpoint proliferation.
- Always return `currentWord` and hide client-side — rejected; violates FR-007/FR-008 (security at API boundary, Principle IV).

---

## Decision 4 — Game Screen UI Scope

**Decision**: `GamePage` shows: (a) participant list with "Drawer" / "Guesser" label per player, (b) the secret word in a highlighted block to the drawer, (c) placeholder text "Waiting for the drawer…" where the word would be for guessers. No canvas, no guess input, no word-length hints.

**Rationale**: Keeps scope bounded to this feature's user stories. Canvas and guessing belong to a future feature.

**Alternatives considered**:

- Static canvas placeholder element — not requested; out of scope for this feature.
- Word count / blank tile hints — explicitly rejected in Q3 answer.

---

## Decision 5 — Multi-Round Scope

**Decision**: `roundNumber` is always `1`; it is set once in `startRoom` and never incremented. The word-selection formula is implemented but only exercises index `0` in this feature.

**Rationale**: Round rotation is explicitly out of scope per Q5 answer. Implementing it speculatively violates Principle V (YAGNI).

**Alternatives considered**:

- Minimal increment on re-start — rejected per user's explicit OOS answer.

---

## Existing Code Inventory (relevant files)

| File                                     | Current State                                                                | Changes Needed                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `backend/src/models/game.ts`             | `Room` has no round fields; `RoomSnapshot` has no round fields               | Add optional round fields to both                                          |
| `backend/src/services/roomStore.ts`      | `startRoom` sets status only; `toRoomSnapshot` ignores `viewerParticipantId` | `startRoom` sets drawer/word/round; `toRoomSnapshot` redacts `currentWord` |
| `backend/src/services/roomStore.test.ts` | 6 tests, all pass                                                            | Add 4+ tests for drawer assignment and word selection                      |
| `backend/src/api/rooms.ts`               | `POST /:code/start` calls `startRoom()` without participantId; correct       | No change needed                                                           |
| `frontend/src/services/api.ts`           | `RoomSnapshot` interface missing round fields                                | Add `currentDrawerId?`, `currentWord?`                                     |
| `frontend/src/pages/GamePage.tsx`        | Shows static "Guess the Word!" layout, no roles, no word                     | Replace with role list + conditional word display + polling                |
| `frontend/src/state/roomStore.ts`        | Has `fetchRoom()` method used by polling in LobbyPage                        | No change needed; GamePage will call it directly in a polling loop         |
