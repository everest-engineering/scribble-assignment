# Research: Game Start & Drawer Flow

**Feature**: 002-game-start-drawer
**Date**: 2026-06-04

---

## Decision 1: Where Drawer Assignment and Word Selection Happen

**Decision**: Both `drawerId` and `secretWord` are set inside `startRoom()` in
`backend/src/services/roomStore.ts`, at the moment the room transitions to `"playing"`.

**Rationale**: `startRoom()` is already the single transition point for the
`lobby → playing` status change (Scenario 1). Adding drawer and word assignment there keeps all
game-start state mutations co-located in one function. This is the minimal change that satisfies
FR-001 through FR-004 without adding a new code path.

**Alternatives considered**:
- A separate `assignDrawer()` function called after `startRoom()` — rejected; two mutations for
  a single atomic event (game start) would require callers to remember to call both, creating an
  inconsistency risk.
- Frontend-driven assignment — rejected; server-authoritative state is required (FR-002) and
  aligns with constitution Principle V.

---

## Decision 2: Secret Word Visibility Filtering

**Decision**: Implement the existing `viewerParticipantId` parameter in `toRoomSnapshot()`.
If `viewerParticipantId === room.drawerId`, include `secretWord` in the returned snapshot.
Otherwise omit it entirely (field absent, not `null` or empty string).

**Rationale**: The `viewerParticipantId` hook was already in place from Scenario 1 (`void`d
placeholder). Activating it here is the intended design. Omitting the field (rather than
nulling it) prevents guessers from seeing a `null` field they could detect programmatically.
The frontend already passes `participantId` on every `GET /rooms/:code` call.

**Alternatives considered**:
- Return `secretWord: null` for non-drawers — rejected; `null` leaks the field name and could
  be detected. Absence is safer and cleaner.
- A separate `/rooms/:code/word` endpoint — rejected; unnecessary extra round-trip. The existing
  snapshot endpoint already carries viewer context.

---

## Decision 3: RoomSnapshot Type Shape for Optional Fields

**Decision**: Add `drawerId: string | undefined` and `secretWord: string | undefined` to the
`RoomSnapshot` interface on both backend and frontend. Mark them optional (`?:`) because the
snapshot is also returned for rooms in `"lobby"` status (before a game starts).

**Rationale**: A room exists in `"lobby"` status before these fields are set. Making them
optional allows the same interface to describe both pre-game and in-game snapshots without
creating a discriminated union. The frontend guards with `room.drawerId` checks before
rendering drawer-specific UI.

**Alternatives considered**:
- Discriminated union `type RoomSnapshot = LobbySnapshot | PlayingSnapshot` — valid but
  overkill for this lab scope; optional fields are simpler and avoid breaking the existing
  snapshot consumers from Scenario 1.

---

## Decision 4: Game Screen State Source (No New Polling in Scenario 2)

**Decision**: The game screen reads state from the `RoomStore` that was already populated when
the player navigated from the lobby. No new polling is added in Scenario 2. The drawer and word
are always present in the store by the time `/game` is reached.

**Rationale**: When the host clicks Start, `startRoom()` returns the updated snapshot (with
`drawerId` and `secretWord`) which is stored immediately. Non-host players navigate to `/game`
when the lobby poll detects `status === "playing"` — at that point their store also has the
latest snapshot including `drawerId` (and `secretWord` for the drawer). Polling is not needed
to hydrate this state. Game-screen polling will be added in Scenario 3 for guess history sync.

**Alternatives considered**:
- Add game-screen polling in Scenario 2 — premature; no state change is expected on the game
  screen during S2's scope. Adding it now would also require handling guess-history fields that
  don't exist yet.

---

## Decision 5: Canvas Placeholder Differentiation

**Decision**: The existing `<div className="canvas-placeholder">` in `GamePage.tsx` is retained
as a styled div. For the drawer it shows "Draw here — your canvas will be active in the next
step"; for the guesser it shows "Waiting for drawer…". No `<canvas>` element is introduced in
this scenario.

**Rationale**: Agreed in clarification session: drawing interaction is Scenario 3's scope.
Using a div avoids any premature canvas API work while still satisfying FR-010 (role-labelled
placeholder) and SC-005 (visually distinguishable without instruction).

**Alternatives considered**:
- Insert a real `<canvas>` element now — deferred to S3 per clarification decision.
