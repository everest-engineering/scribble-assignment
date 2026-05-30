# Implementation Plan: Result, Restart & Final Validation

**Branch**: `assignment` | **Date**: 2026-05-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-result-restart/spec.md`

## Summary

Extend the game loop to include a result state and a host-restart flow.
When a guesser submits the correct word, `submitGuess()` atomically transitions
the room to `status: "result"`. All clients poll and auto-navigate to a new
`/result` page that shows the secret word, final scores, and guess history.
The host sees a Restart button; clicking it calls `POST /rooms/:code/restart`,
which resets the room to lobby state (participants preserved, round state cleared).
All other clients detect the lobby transition via polling and navigate back automatically.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 18+)
**Primary Dependencies**: Express, React + Vite, Zod — all existing
**Storage**: In-memory `Map<string, Room>` — unchanged
**Testing**: Existing unit tests; manual two-tab acceptance
**Target Platform**: Local — `localhost:3001` / `localhost:5173`
**Project Type**: Web application — brownfield extension
**Constraints**: No new npm dependencies; TypeScript throughout; extend not rewrite

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield-First — extend not rewrite | ✅ PASS | Extends existing files; one new page file only |
| II. Deterministic Game Rules — auto round-end on first correct guess | ✅ PASS | Atomic in `submitGuess()`; backend-only |
| II. Dual validation — restart caller check | ✅ PASS | `restartRoom()` throws 403; frontend hides button |
| III. Polling, Not Real-Time | ✅ PASS | 2s `setInterval` in ResultPage; no WebSockets |
| IV. Incremental — Scenario 4 only | ✅ PASS | No changes outside these 9 files |
| V. Simplicity — no new deps | ✅ PASS | Zero new dependencies |

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── contracts/
│   └── rooms.md         ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code (files changed)

```text
backend/
└── src/
    ├── models/
    │   └── game.ts          ← extend RoomStatus to include "result"
    ├── api/
    │   ├── schemas.ts       ← add restartRoomSchema
    │   └── rooms.ts         ← add POST /:code/restart route
    └── services/
        └── roomStore.ts     ← extend submitGuess(); extend toRoomSnapshot(); add restartRoom()

frontend/
└── src/
    ├── services/
    │   └── api.ts           ← update status type; add restartGame()
    ├── state/
    │   └── roomStore.ts     ← add restartGame() action
    ├── pages/
    │   ├── GamePage.tsx     ← add useEffect to navigate to /result on status change
    │   └── ResultPage.tsx   ← NEW: result screen with secretWord, scores, guesses, restart
    └── routes/
        └── index.tsx        ← register /result route
```

**Structure Decision**: 9 files changed — 8 extensions of existing files, 1 new page component.

## Backend Changes

### 1. `backend/src/models/game.ts`
- Extend `RoomStatus` union: `"lobby" | "game"` → `"lobby" | "game" | "result"`

### 2. `backend/src/api/schemas.ts`
- Add `restartRoomSchema`: `{ participantId: z.string().trim().min(1, "participantId is required") }`

### 3. `backend/src/services/roomStore.ts`
- `submitGuess()` — extend round-end transition:
  - After scoring, spread `...(isCorrect ? { status: "result" as const } : {})` into `saveRoom()` call
- `toRoomSnapshot()` — extend `secretWord` reveal condition:
  - Before: `isDrawer && room.secretWord`
  - After: `(isDrawer || room.status === "result") && room.secretWord != null`
- `restartRoom(code, participantId)` — new export:
  - Return `null` if room not found
  - Throw `"Only the host can restart"` if `participantId !== room.hostId`
  - `saveRoom({ ...room, status: "lobby", drawerId: null, secretWord: null, guesses: [], scores: {} })`

### 4. `backend/src/api/rooms.ts`
- Import `restartRoom` and `restartRoomSchema`
- Add `router.post("/:code/restart", ...)`:
  - Parse `code` from params, `{ participantId }` from validated body
  - Call `restartRoom()`; map `null` → 404, `"Only the host can restart"` → 403
  - Respond with `{ room: toRoomSnapshot(room, participantId) }`

## Frontend Changes

### 5. `frontend/src/services/api.ts`
- Update `RoomSnapshot.status`: `"lobby" | "game"` → `"lobby" | "game" | "result"`
- Add `restartGame(code, participantId)` method: `POST /rooms/${code}/restart`

### 6. `frontend/src/state/roomStore.ts`
- Add `restartGame()` action: calls `api.restartGame(code, participantId)`, calls `setRoomSnapshot(response.room)`

### 7. `frontend/src/pages/GamePage.tsx`
- Add `useEffect` watching `room?.status`: when `status === "result"` call `navigate("/result")`
- Mirrors the existing LobbyPage `useEffect` that navigates to `/game` on `status === "game"`

### 8. `frontend/src/pages/ResultPage.tsx` — NEW
- Read `room`, `participantId` from `useRoomState()` and `useRoomStore()`
- Display: secret word (`room.secretWord`), scores (all participants), guess history (reverse order)
- Host-only Restart button: `room.hostId === participantId` → visible; calls `roomStore.restartGame()`
- 2s polling `useEffect` with `clearInterval` cleanup — same pattern as LobbyPage
- Navigation `useEffect`: when `room?.status === "lobby"` call `navigate("/lobby")`

### 9. `frontend/src/routes/index.tsx`
- Import `ResultPage` and register route at `/result`

## Data Flow

```
POST /rooms/:code/guesses (correct guess):
  → backend: append guess, update scores, set status: "result"
  → response: snapshot with secretWord revealed to all
  → frontend: setRoomSnapshot — GamePage polls detect "result" → navigate("/result")

GET /rooms/:code?participantId=<id> (polling every 2s from ResultPage):
  → all clients receive secretWord, final scores, full guess history
  → ResultPage renders result screen

POST /rooms/:code/restart (host only):
  → backend: reset to lobby, preserve participants
  → response: lobby snapshot (no secretWord, empty guesses/scores)
  → ResultPage polls detect "lobby" → navigate("/lobby")
```

## Testing Strategy

- Manual two-tab verification (primary gate)
- Backend TypeScript build confirms type correctness after `RoomStatus` extension
- Two-tab test: correct guess → both tabs auto-navigate to result within 2s
- Two-tab test: host restarts → both tabs auto-navigate to lobby within 2s
- Verify non-host sees no Restart button
- Verify guess after round ends returns 400 "Game is not active"

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Race: two correct guesses submitted at the same time | In-memory Map is single-threaded Node.js; first write wins; second call sees `status: "result"` and throws `"Game is not active"` |
| `RoomStatus` exhaustiveness — missed case in switch | TypeScript union extension causes compile error at any unhandled switch branch |
| ResultPage renders before room is loaded | Guard: `if (!room) return <div>Loading...</div>` at top of component |
| Polling fires after ResultPage unmounts | `clearInterval` in `useEffect` cleanup function |
| `restartGame()` called by non-host via client hack | Backend enforces `participantId === room.hostId`; 403 returned |
