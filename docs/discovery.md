# Discovery Notes

## What Works

### Room Lifecycle
- Creating a room generates a unique 4-character code and returns a `participantId`
- Joining a room by code adds the player and returns the same session shape
- Fetching a room (`GET /rooms/:code`) returns a snapshot with participants, available words, and roles
- All room data is stored in memory on the backend; restarting clears all rooms

### Frontend Shell
- Full page routing: Start → Create Room / Join Room → Lobby → Game
- `RoomStoreProvider` wraps the app and holds `room`, `participantId`, `isLoading`, and `error` in a React context store
- `CreateRoomPage` and `JoinRoomPage` call the API and write the session into the store on success
- `LobbyPage` shows the current participant list with a manual refresh button
- `GamePage` renders a layout with sidebar, canvas area, guess form, and scoreboard — all placeholders

### Validation & Error Handling
- Zod schemas on the backend validate request bodies; invalid payloads return 400
- Missing or unknown room codes return 404
- The frontend store catches errors and surfaces them via the `error` field

### Seed Data
- 5 words available: `rocket`, `pizza`, `castle`, `guitar`, `sunflower`
- 2 roles defined: `drawer`, `guesser`
- Both are returned on every room snapshot but are not yet used by any game logic

---

## What Is Missing

### Host Behavior
- No field on `Room` or `Participant` to mark who created the room
- All players are treated equally; there is no host-only permission check anywhere
- The "Start Game" button does not exist

### Lobby Polling
- The lobby only refreshes on manual button click — no automatic polling
- No interval-based fetch is wired in `LobbyPage` or the store

### Game Start Flow
- `RoomStatus` is typed as `"lobby"` only — no `"playing"` or `"finished"` states exist
- There is no API endpoint to transition room status
- The frontend has no logic to detect that a game has started and navigate to the game screen

### Drawer Assignment
- The `roles` array is returned in the snapshot but is never mapped to specific participants
- No field on `Room` or `RoomSnapshot` associates a participant with the `drawer` role
- The drawer's secret word is not tracked anywhere

### Secret Word Visibility
- `availableWords` is returned to every player on every snapshot — there is no per-viewer filtering
- `toRoomSnapshot` receives `viewerParticipantId` but ignores it (`void viewerParticipantId`)

### Drawing Canvas
- The canvas area in `GamePage` is a plain `<div>` with static text "Waiting for drawer..."
- No drawing library, canvas element, or pointer event handling exists
- No clear canvas action exists

### Guess Submission
- `GuessForm` component exists but has no form submit handler and makes no API call
- No backend endpoint exists for submitting or storing guesses
- No guess history is tracked on the `Room` model

### Guess Sync
- No polling in `GamePage` to fetch updated room state during a round
- Other players cannot see guesses in real time or near-real time

### Scoring
- No `score` field exists on `Participant`
- No scoring logic exists anywhere — correct guess awarding 100 points is fully absent

### Result State
- No `"finished"` room status
- No endpoint or model field for storing the correct word, final scores, or full guess history after a round ends
- `ResultPanel` component is a placeholder with no data

### Restart Flow
- No endpoint to reset a room back to lobby state
- No mechanism to clear round-specific data (drawer, word, guesses, scores) while keeping participants

---

## Assumptions

1. **Host = first participant.** The player who calls `POST /rooms` is the host. This can be tracked by storing the `participantId` of the first participant on the `Room` model, without adding a separate role field.

2. **Deterministic word selection means index-based, not random.** "Deterministically selected" in the spec means the word is chosen by a fixed rule (e.g. round count mod word list length), so all clients agree on the word without coordination.

3. **Polling is the only sync mechanism.** WebSockets are explicitly out of scope. Both lobby and in-game state updates will use `setInterval`-based polling (~2s cadence) calling the existing `GET /rooms/:code` endpoint.

4. **One round only.** The spec describes a single round with no drawer rotation or round counter. Restart returns everyone to the lobby, preserving participants, and clears all round state.

5. **The backend filters the secret word per viewer.** Since `toRoomSnapshot` already receives `viewerParticipantId` (currently unused), the intended pattern is to populate `currentWord` only when the viewer is the drawer — no separate endpoint needed.

6. **Guess comparison is case-insensitive and trimmed server-side.** The spec says "trimmed, case-insensitively compared" — this logic belongs in the backend endpoint, not the client.

7. **Empty or whitespace-only player names are rejected.** The spec states names must be trimmed and non-empty. This validation needs to be added to both the Zod schemas and the frontend forms.

---

## Files Involved

### Backend
| File | Relevance |
|---|---|
| `backend/src/models/game.ts` | Core types — needs `hostId`, `currentWord`, `guesses`, `scores`, status values added |
| `backend/src/services/roomStore.ts` | Room CRUD — needs `startGame`, `submitGuess`, `restartRoom` operations; `toRoomSnapshot` needs viewer filtering |
| `backend/src/api/rooms.ts` | Route handlers — needs new endpoints for start, guess, and restart |
| `backend/src/api/schemas.ts` | Zod schemas — needs schemas for new request bodies and name validation |
| `backend/src/api/router.ts` | Route registration — needs new routes mounted |
| `backend/src/seed/starterData.ts` | Seed words and roles — read-only reference, no changes needed |

### Frontend
| File | Relevance |
|---|---|
| `frontend/src/pages/LobbyPage.tsx` | Needs polling, host badge, and conditional "Start Game" button |
| `frontend/src/pages/GamePage.tsx` | Needs real canvas, guess submission wiring, polling, role-aware layout |
| `frontend/src/components/GuessForm.tsx` | Needs submit handler calling the guess API |
| `frontend/src/components/Scoreboard.tsx` | Needs real score data from room snapshot |
| `frontend/src/components/ResultPanel.tsx` | Needs correct word, scores, and guess history from result state |
| `frontend/src/state/roomStore.ts` | Needs actions for `startGame`, `submitGuess`, `restartRoom`; polling helpers |
| `frontend/src/services/api.ts` | Needs client methods for all new endpoints |

### Config / CI
| File | Relevance |
|---|---|
| `.github/workflows/ci.yml` | Runs build and tests — changes must keep this green |
| `.github/pull_request_template.md` | PR submission format to follow |
