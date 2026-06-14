# Phase 0 — Research & Decisions

Spec: [./spec.md](./spec.md) · Plan: [./plan.md](./plan.md)

There were no `NEEDS CLARIFICATION` markers carried over from the spec. The items below capture the design decisions that need to be locked **before** Phase 1 contracts can be written.

---

## R-001 — Word selection algorithm

**Decision**: `selectWordForRound(words, roundNumber)` returns `words[(roundNumber - 1) mod words.length]`. For round 1 against the current `STARTER_WORDS = ["rocket", "pizza", "castle", "guitar", "sunflower"]`, this yields `"rocket"`.

**Rationale**:
- Satisfies FR-004 (deterministic, reproducible).
- Trivially testable — `selectWordForRound(STARTER_WORDS, 1) === "rocket"` is a single assertion.
- Works for any future round counts without a different rule (round 6 wraps back to "rocket"), matching constitution Principle I (no rotation logic, no random pack).
- Defensive: throws on an empty list, matching FR-010.

**Alternatives considered**:
- *Hash room code → index*: harder to test, breaks determinism across resets unless seeded.
- *Round-robin keyed by `roundNumber + roomCode`*: more variety but unnecessary for round-1-only scope.
- *Random with seed*: introduces a PRNG dependency; Principle IV would require justification we don't have.

---

## R-002 — Where snapshot filtering happens

**Decision**: The drawer-only `secretWord` filter lives **inside `toRoomSnapshot(room, viewerParticipantId)`** in `backend/src/services/roomStore.ts`. The function decides for itself whether to attach `secretWord` (drawer) or `maskedWord` only (everyone else). The HTTP layer (`backend/src/api/rooms.ts`) calls the helper unchanged.

**Rationale**:
- Single source of truth for snapshot shape. Routes don't need to know about drawer rules.
- Tests can drive the shape directly via the helper without spinning up Express.
- Matches the existing pattern (`viewerIsHost` and `canStart` are already derived inside `toRoomSnapshot`).
- Satisfies FR-005's "no client-side filtering" requirement by definition — the cleartext never appears in the wire bytes for a non-drawer.

**Alternatives considered**:
- *Two separate snapshot helpers (`toDrawerSnapshot` + `toGuesserSnapshot`)*: duplicates field assembly and makes drift likely.
- *Strip in the route after calling the helper*: violates the "extend, don't replace" principle by adding logic at a less-tested layer.

---

## R-003 — Snapshot shape for in-round vs in-lobby

**Decision**: `RoomSnapshot` gains:
- `round: { roundNumber: number; drawerParticipantId: string; maskedWord: string; secretWord?: string } | null`
- Each `ParticipantView` gains `isDrawer: boolean`.
- The room's `status` becomes `"lobby" | "round"` (was `"lobby"` literal).

`secretWord` is **only present** when the viewer is the drawer. The TypeScript type marks it optional precisely so callers can't accidentally consume `null` as a string.

**Rationale**:
- Backwards compatible with `001`'s snapshot consumers — they ignore the new `round` field when it's `null`.
- The optional `secretWord` plus mandatory `maskedWord` mirror the user-facing UI: drawer sees the word, guessers see length-only.
- `isDrawer` matches the established `isHost` pattern from `001`.

**Alternatives considered**:
- *Carry `secretWord: string | null` always*: easier for clients but breaks FR-005 because the bytes still need to travel only to the drawer.
- *Don't expose `maskedWord` to the drawer*: makes the drawer's UI assemble it from its own word, which is fine but slightly couples client and server. Including it on the drawer's snapshot too keeps the wire shape uniform.

---

## R-004 — Idempotency of `POST /rooms/:code/start`

**Decision**: When `room.round` is already non-null, `startRoom(code, requesterId)` short-circuits and returns `{ ok: true, room }` with the **existing** round payload — provided `requesterId` is still the host. If a non-host calls it while a round is active, return `{ ok: false, reason: "not_host" }` as before. Empty-word-list still returns the existing 409 envelope with a new reason `"no_words_available"` mapping to a 500 (server-side configuration error).

**Rationale**:
- Satisfies FR-007.
- Keeps the `{ ok: boolean, reason }` discriminated outcome shape from `001` — no new error envelopes for the route to map.
- A non-host hitting Start during a round still gets the same 403 they'd get pre-round, which is the principle of least surprise.

**Alternatives considered**:
- *Return 409 ("already started")*: surfaces a "failure" for a benign retry. Clients would have to suppress it. Idempotent success is friendlier.
- *Mutate `updatedAt` on the no-op*: harmless but pointless — leave it untouched so the in-memory store reflects "no state change".

---

## R-005 — How the frontend renders the round

**Decision**: A new `frontend/src/components/RoundView.tsx` component is rendered inside `LobbyPage` whenever `room.round !== null`. The participant list and room code badge stay; the "Status" card is replaced (within the same grid slot) by the round panel. The Start Game button hides when in-round (idempotent retries still possible via the network — but the UI doesn't surface them).

**Rationale**:
- One page = one route — matches Principle IV (no new top-level routes, no router changes).
- Existing `useLobbyPolling` already powers the refresh — no new hook needed.
- Component split keeps `LobbyPage` readable and allows the pure helper `getRoundViewState(room, participantId)` to live next to its consumer for unit tests.

**Alternatives considered**:
- *New `/round` route*: forces router changes and an extra navigation step (state stays in `roomStore`, so the navigate is pointless).
- *Inline JSX in `LobbyPage`*: would balloon the file and make the testable helper awkward to extract.

---

## R-006 — Frontend client typing for the new snapshot

**Decision**: `frontend/src/services/api.ts` updates `RoomSnapshot` to mirror the backend exactly: `status: "lobby" | "round"`; new `round` field (nullable, with optional `secretWord`); `ParticipantView` gains `isDrawer`. The client never tries to "compute" `isDrawer` or "mask" the word — both come from the server.

**Rationale**:
- Principle III — wire types stay in sync between `backend/src/models/game.ts` and `frontend/src/services/api.ts`.
- The absence of `secretWord` in the guesser snapshot is naturally enforced by TS's optional-field typing.

**Alternatives considered**: none material; this is bookkeeping.

---

## R-007 — Test coverage strategy

**Decision**: New Vitest cases land in three files:

- `backend/src/services/roomStore.test.ts` — `selectWordForRound` (determinism + empty-list throw), `startRoom` idempotency, `toRoomSnapshot` drawer-vs-guesser shape, `isDrawer` flag.
- `backend/src/api/rooms.test.ts` — request `GET /rooms/:code?participantId=<drawer>` returns `secretWord` cleartext; the same call with a guesser id omits it; double-POST Start returns the same word.
- `frontend/src/components/RoundView.test.tsx` — pure helper `getRoundViewState` returns the right mode (lobby/drawer/guesser) and label string.

No existing tests will be modified (Principle V). Snapshot leakage is asserted by checking the **absence** of the cleartext word in the JSON payload for a guesser id.

**Rationale**: covers FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-010 at the unit layer; FR-001 (transition) and FR-009 (name validation) are exercised by reusing `001`'s existing infrastructure.

---

## R-008 — UI affordances for the masked word

**Decision**: Render `maskedWord` as the raw string from the server, character-by-character, with each non-space character displayed as an underscore tile. The server already produces the correct length; the client doesn't compute the mask. Drawer's word panel renders the cleartext in monospace, large, with a "Your word" label.

**Rationale**: Keeps the rendering layer dumb — it just renders what the server sent. The "underscore tile" presentation is a CSS concern, not a logic concern.

**Alternatives considered**: client-side masking — rejected because it would require the cleartext to reach guesser clients, which violates FR-005 outright.
