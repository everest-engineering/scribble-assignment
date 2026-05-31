# Research: Round End — Results Display and Lobby Restart

**Branch**: `005-round-end-restart` | **Date**: 2026-05-30

## Decision Log

### D-001: Room Status Extension

- **Decision**: Add `"ended"` as a third value for `RoomStatus` (alongside existing `"lobby"` and `"active"`). The type becomes `"lobby" | "active" | "ended"`.
- **Rationale**: The result screen is triggered by a server-side state change. Clients polling `GET /rooms/:code` detect `status: "ended"` and switch to the result view — no new endpoint or push mechanism needed. This is the established polling pattern already used in features 002–004.
- **Alternatives considered**:
  - Separate result endpoint (`GET /rooms/:code/result`) — redundant; the snapshot already has all data needed.
  - Client-side only state — would not sync across tabs; rejected.

### D-002: Result Screen Placement

- **Decision**: Render the result screen as a conditional branch **inside the existing `GamePage.tsx`** — when `room.status === "ended"`, show results UI; when `"active"`, show the current game UI.
- **Rationale**: Brownfield-first (constitution Principle I). No new route, no new page file. The polling `useEffect` already runs in `GamePage`; results appear within 2 seconds automatically. Adding a new page would require routing changes and a new file with minimal benefit.
- **Alternatives considered**:
  - New `ResultPage.tsx` with its own route — adds a route change and a new file; unnecessary given the conditional-render approach is sufficient.

### D-003: Lobby Redirect After Restart

- **Decision**: Add a check in `GamePage.tsx`'s existing `useEffect` (or a new `useEffect`) that navigates to `/lobby` when `room.status === "lobby"`. This fires automatically when the polling detects the restart.
- **Rationale**: The store's `fetchRoom()` already updates `room` reactively. A `useEffect` on `room.status` checking for `"lobby"` will redirect all players seamlessly within one polling cycle (≤ 2 s).
- **Alternatives considered**:
  - Redirect inside `restartRoom()` store method — can't navigate from a store method (no router access there).

### D-004: New API Endpoints

- **Decision**:
  - `POST /rooms/:code/end` — host ends the round; transitions room to `"ended"`. Body: `{ participantId }`.
  - `POST /rooms/:code/restart` — host restarts; clears guesses, transitions room to `"lobby"`. Body: `{ participantId }`.
- **Rationale**: Follows the existing verb-noun REST pattern (`/start`, `/guesses`). Each action is a discrete mutation with its own error surface.
- **Alternatives considered**:
  - Combining end + restart into a single `PATCH /rooms/:code` with a `status` field — less explicit, harder to validate role permissions per transition.

### D-005: State Cleared on Restart

- **Decision**: `restartRoom()` sets `room.status = "lobby"` and `room.guesses = []`. Everything else (participants, code, hostId, availableWords order) is preserved.
- **Rationale**: Spec FR-010 requires guesses cleared; FR-011 requires participants preserved. The word stays deterministic (`availableWords[0]`) per constitution Principle III.
- **Alternatives considered**:
  - Generating a fresh room code — violates player preservation (they'd need to rejoin).
  - Keeping guesses for history — contradicts FR-010 and would bleed history into the new round.

### D-006: Files Changed

**Backend** (4 existing files, 0 new):
- `backend/src/models/game.ts` — extend `RoomStatus` with `"ended"`
- `backend/src/services/roomStore.ts` — add `endRound()`, `restartRoom()`
- `backend/src/api/schemas.ts` — add `endRoundBodySchema`, `restartRoomBodySchema`
- `backend/src/api/rooms.ts` — add `POST /:code/end`, `POST /:code/restart` handlers

**Frontend** (3 existing files, 0 new):
- `frontend/src/services/api.ts` — update `RoomSnapshot.status` type; add `endRound()`, `restartRoom()` methods
- `frontend/src/state/roomStore.ts` — add `endRound()`, `restartRoom()` to `RoomStore`
- `frontend/src/pages/GamePage.tsx` — add result-screen conditional render, "End Round" button, lobby-redirect effect

Total: 7 modified files, 0 new files. Zero new npm dependencies.
