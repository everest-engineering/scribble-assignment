# Research: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-10

## Decision 1 — isHost placement

**Decision**: Add `isHost: boolean` directly to the `Participant` type in
`backend/src/models/game.ts` and propagate it through `RoomSnapshot` to all
clients.

**Rationale**: The spec requires the frontend to render host-only UI (Start Game
button) and a host indicator on the participant list. Embedding `isHost` on the
participant record means the frontend reads it without any secondary lookup or
comparison. The field is not sensitive for a party game.

**Alternatives considered**:
- Derive host status from `participantId` matching the first participant — rejected
  because it couples host identity to list order, which could shift if the model
  is ever refactored.
- Return a separate `hostId` field on `RoomSnapshot` — rejected as redundant once
  `isHost` is already on each participant.

## Decision 2 — Name validation location

**Decision**: Validate and trim player names on the **frontend before the API
call** (empty-check guard in submit handler) AND enforce the same rule on the
**backend via the Zod schema** (`.min(1)` after `.trim()`).

**Rationale**: Frontend validation gives immediate inline feedback without a
round-trip. Backend validation is required by the constitution's "validate at
system boundaries" rule and protects the API from direct calls that bypass the
UI. Both layers must agree on the rule: trim first, then reject empty.

**Alternatives considered**:
- Frontend-only validation — rejected: API is directly callable; backend must
  be the authoritative boundary.
- Backend-only validation — rejected: adds latency to a common validation failure
  that can be caught instantly on the client.

## Decision 3 — Polling mechanism

**Decision**: Use `setTimeout`-after-response in a `useEffect` in `LobbyPage`.
Schedule the next poll 2 000 ms after the previous response (success or error)
arrives. Clear the timeout in the `useEffect` cleanup function.

**Rationale**: Clarified in `/speckit-clarify` session. Overlap is structurally
impossible; no in-flight guard flag is needed. The cleanup function fires on
unmount, satisfying FR-006.

**Alternatives considered**:
- `setInterval` with in-flight guard — rejected: more state to manage; a guard
  flag can be accidentally reset. Chosen approach is simpler.
- Polling inside `RoomStore` — rejected: the store is shared across pages;
  mounting/unmount lifecycle is easier to track in the component that owns the
  Lobby view.

## Decision 4 — Silent vs. visible loading during polls

**Decision**: Background polls call a new `pollRoom()` method on `RoomStore` that
calls `fetchRoom` directly **without** wrapping it in `withLoading()`. Only the
initial load on mount uses `withLoading()` (or an equivalent explicit
`isLoading: true` + `isLoading: false` pair).

**Rationale**: Clarified in `/speckit-clarify` session. Flashing a spinner every
2 s is disruptive. The existing `withLoading` wrapper sets `isLoading: true`
which the Lobby already renders as "Refreshing players…"; that visual must not
recur on every silent poll.

**Alternatives considered**:
- Reuse `fetchRoom()` (which currently goes through `withLoading`) — rejected:
  would trigger the loading indicator on every poll.

## Decision 5 — Zod schema for playerName

**Decision**: Change `playerName` in `createRoomSchema` and `joinRoomSchema` from
`z.string().optional()` to `z.string().trim().min(1, "Player name is required")`.

**Rationale**: The current schema accepts an absent or empty name and falls back
to "Player" in `displayName()`. The spec requires explicit rejection with a user-
readable error message. Zod's `.trim().min(1)` both trims and enforces non-empty
in one step. The `HttpError` class already in `rooms.ts` will propagate the 422
validation error to the client.

**Alternatives considered**:
- Keep schema optional and validate in the route handler — rejected: Zod already
  provides structured error messages; duplicating logic in the handler adds
  maintenance burden.

## Existing files that do NOT change

| File | Reason |
|------|--------|
| `backend/src/api/router.ts` | Route wiring is unchanged |
| `backend/src/app.ts` | Express app setup unchanged |
| `backend/src/server.ts` | Entry point unchanged |
| `backend/src/seed/starterData.ts` | Words and roles unchanged |
| `frontend/src/App.tsx` | Routing unchanged |
| `frontend/src/routes/index.tsx` | Route table unchanged |
| `frontend/src/components/*` | Shared components unchanged |
| `frontend/src/styles/app.css` | No new styles needed |
