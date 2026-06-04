# Research: Game Start & Drawer Flow

**Feature**: `002-game-start-drawer-flow` | **Date**: 2026-06-04

---

## Decision 1 — Where to assign `drawerId` and `currentWord`

**Decision**: Extend the existing `POST /rooms/:code/start` handler in `backend/src/api/rooms.ts`
to set `room.drawerId` and `room.currentWord` atomically before calling `saveRoom()`. No new
endpoint is required.

**Rationale**: The start-game handler already owns the `playing` transition. Adding drawer
assignment and word selection here keeps the transition atomic and avoids a second HTTP round-trip.
The `saveRoom()` call already persists the mutated `Room` object.

**Alternatives considered**:
- Separate `POST /rooms/:code/assign-drawer` endpoint — rejected: extra round-trip, no benefit.
- Assign in `createRoom()` — rejected: drawer is undefined at lobby time; assignment must happen
  at game start.

---

## Decision 2 — Deterministic word selection algorithm

**Decision**: `wordIndex = Array.from(room.code).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % STARTER_WORDS.length`

**Rationale**: Derives purely from the room code already stored on the `Room` object. Reproducible:
the same code always produces the same word. No additional fields or state required. `STARTER_WORDS`
is the existing import in `roomStore.ts` from `backend/src/seed/starterData.ts`.

**Alternatives considered**:
- Always index 0 (`"rocket"`) — rejected: all games would use the same word, reducing variety.
- `Math.random()` — rejected: non-deterministic, violates constitution Principle IV.
- Separate word counter on Room — rejected: adds mutable state to the Room model unnecessarily.

---

## Decision 3 — How `toRoomSnapshot` gates `currentWord` visibility

**Decision**: Remove the `void viewerParticipantId` no-op in `toRoomSnapshot()` and replace it
with a ternary: `currentWord: room.drawerId === viewerParticipantId && viewerParticipantId !== undefined ? room.currentWord : null`.

**Rationale**: The `viewerParticipantId` parameter already exists in the function signature and is
already passed from all three call sites (`POST /rooms`, `POST /rooms/:code/join`,
`GET /rooms/:code`). Activating it here requires a single-line change and zero new abstractions.

**Alternatives considered**:
- Separate `GET /rooms/:code/game-state` endpoint for drawer data — rejected: adds surface area
  and breaks brownfield principle; existing endpoint already carries the `viewerParticipantId`.
- Always expose `currentWord` and enforce secrecy on the frontend — rejected: leaks the word
  over the wire to non-drawers; violates FR-003.

---

## Decision 4 — `drawerId` and `currentWord` on the `Room` model

**Decision**: Add `drawerId: string | null` and `currentWord: string | null` to the `Room`
interface in `backend/src/models/game.ts`, initialised to `null` at `createRoom()` time.

**Rationale**: Both fields must be persisted in the in-memory `Room` object so they survive
across `getRoom()` calls from polling clients. Initialising to `null` in lobby state means the
existing `createRoom()` logic needs only two new field assignments.

**Alternatives considered**:
- Store on a separate `GameState` map keyed by room code — rejected: extra indirection for no
  benefit given in-memory-only constraint.

---

## Decision 5 — Frontend: reuse `startPolling` / `stopPolling` in `GamePage`

**Decision**: `GamePage` calls `roomStore.startPolling(2000)` on mount (same as `LobbyPage`) and
`roomStore.stopPolling()` on unmount. No new polling infrastructure is needed.

**Rationale**: `RoomStore.startPolling` already uses `fetchRoom()` which passes `participantId`
in the query string, so the drawer will automatically receive `currentWord` in every poll
response. The same `pollError` state field is reused for game screen error display.

**Alternatives considered**:
- Dedicated game-screen polling hook — rejected: unnecessary abstraction; the existing
  `startPolling`/`stopPolling` API is sufficient.

---

## Decision 6 — Frontend `RoomSnapshot` type extension

**Decision**: Add `drawerId: string | null` and `currentWord: string | null` to the
`RoomSnapshot` interface in `frontend/src/services/api.ts`.

**Rationale**: These fields are always present in the backend response (FR-014); adding them
to the frontend type ensures TypeScript validates their usage throughout `GamePage` and
`roomStore`.

**Alternatives considered**:
- Use type assertion (`as`) at call sites — rejected: defeats TypeScript strictness (Principle V).
