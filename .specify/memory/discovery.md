# Scribble — Discovery Notes

## Incomplete Behaviors

### 1. No host tracking
`Room` has no `hostId` field (`backend/src/models/game.ts:10-16`). `createRoom` does not record the
creator as host. In `LobbyPage.tsx:72` the "Start Game" button is visible and enabled for every
participant with no host-only gate.

### 2. No lobby polling
`LobbyPage` only has a manual "Refresh Room" button (`LobbyPage.tsx:69`). There is no `setInterval`
anywhere in `LobbyPage` or `RoomStore`; the participant list is never updated automatically.

### 3. No start-game flow
Clicking "Start Game" in the lobby navigates directly to `/game` via `navigate("/game")`
(`LobbyPage.tsx:72`) with no backend call, no minimum-player check, and no room status transition.

### 4. No drawer assignment or secret word
`Room` and `RoomSnapshot` have no `drawerId` or `currentWord` fields. `toRoomSnapshot` receives
`viewerParticipantId` but immediately discards it with `void viewerParticipantId`
(`roomStore.ts:100`). Word visibility per viewer is not implemented.

### 5. Canvas is a placeholder div
`GamePage.tsx:44` renders a plain `<div>` with hardcoded text "Waiting for drawer...". There is no
`<canvas>` element, no drawing API, no stroke sync, and no clear-canvas action.

### 6. Guess submission does nothing
`GuessForm.tsx:11` calls `event.preventDefault()` and returns immediately. There is no API call, no
input validation, no guess history, and no score update wired to the submit handler.

### 7. Scoreboard and ResultPanel are static placeholders
`Scoreboard.tsx` renders a hardcoded "Waiting for players... 0" row. `ResultPanel.tsx` renders a
static paragraph. Neither component reads from room or game state.

### 8. No `"playing"` or `"finished"` room status
`RoomStatus` is typed as the literal `"lobby"` only (`game.ts:2`). There is no status to represent
an active round or a finished round, so no component can branch on game phase.

### 9. No result state or restart flow
No backend endpoint exists to end a round or reveal the correct word. No frontend action or route
handles the post-round result screen or restores the lobby with players preserved and round state
cleared.

## Assumptions

### A1 — Host is the room creator
The first participant returned by `createRoom` is the host. `hostId = participants[0].id` at
creation time. This is consistent with "the creator is automatically the host" (README Scenario 1)
and requires no additional input from the caller.

### A2 — Deterministic word selection by room count
The secret word index is derived from a monotonically incrementing room counter stored in
`roomStore.ts` (e.g. `roomsCreated % STARTER_WORDS.length`). This ensures the same room always
maps to the same word without randomness, keeping acceptance criteria reproducible across sessions.

### A3 — `RoomStatus` expands to `"lobby" | "playing" | "finished"`
The game lifecycle requires a clear status transition. All polling consumers (lobby, game) and the
result screen branch on this field, so it must be a discriminated union in the model.

### A4 — Guesses are stored as an array on `Room`
Since there is no database, guess history is appended to the room in memory as an array of records:
`{ participantId: string; text: string; correct: boolean; timestamp: string }`. The full array is
returned in every `RoomSnapshot` so all polling clients stay in sync without a separate endpoint.

## Relevant Files

### Backend
| File | Role | Gap |
|------|------|-----|
| `backend/src/models/game.ts` | `Room`, `RoomSnapshot`, `RoomStatus`, `Participant` types | Needs `hostId`, `drawerId`, `currentWord`, `guesses`, status union |
| `backend/src/services/roomStore.ts` | All room CRUD; `toRoomSnapshot` | `viewerParticipantId` ignored; no game-start, guess, or restart logic |
| `backend/src/seed/starterData.ts` | Fixed word list and roles | Used correctly; no change needed |
| `backend/src/api/rooms.ts` | Route handlers | Needs routes: start-game, submit-guess, restart |
| `backend/src/api/schemas.ts` | Zod request schemas | Needs schemas for start-game and submit-guess payloads |
| `backend/src/app.ts` | Express app wiring | No change expected |

### Frontend
| File | Role | Gap |
|------|------|-----|
| `frontend/src/state/roomStore.ts` | `RoomStore` class and `RoomState` | No polling interval; no guess or start-game actions |
| `frontend/src/services/api.ts` | Typed fetch helpers and `RoomSnapshot` type | Missing start-game, submit-guess, restart methods; `RoomSnapshot` needs new fields |
| `frontend/src/pages/LobbyPage.tsx` | Lobby UI | Manual refresh only; no polling; no host-only or 2-player guard on Start |
| `frontend/src/pages/GamePage.tsx` | Game UI | All placeholders; needs canvas, drawer/guesser conditional UI, polling |
| `frontend/src/components/GuessForm.tsx` | Guess input | Submit is a no-op; needs API call, validation, drawer-disabled state |
| `frontend/src/components/Scoreboard.tsx` | Score display | Static placeholder; needs live scores from snapshot |
| `frontend/src/components/ResultPanel.tsx` | Guess history and result | Static placeholder; needs guess history list and result state |
