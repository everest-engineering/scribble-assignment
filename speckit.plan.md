# Plan

## Findings (from Discovery)

1. The `Room` model lacks `hostId`, `status` is only `"lobby"`.
2. `toRoomSnapshot()` ignores viewer identity — everyone gets the same data.
3. Player names are not validated (empty → `"Player"`).
4. Guesses, scores, drawing data, and game round state are entirely absent.
5. Frontend has no polling; only manual refresh in the lobby.
6. Game page components (Canvas, GuessForm, Scoreboard, ResultPanel) are all placeholders.

---

## State Model Changes

### Backend — Extended Types (`backend/src/models/game.ts`)

```
RoomStatus = "lobby" | "playing" | "finished"

Room {
  code: string
  status: RoomStatus
  hostId: string                    // NEW — participant ID of creator
  participants: Participant[]
  drawerId: string | null           // NEW — who is drawing this round
  secretWord: string | null         // NEW — the word for this round
  guesses: Guess[]                  // NEW — all submitted guesses
  scores: Record<string, number>    // NEW — participantId → score
  strokes: Stroke[]                 // NEW — drawing data
  createdAt: string
  updatedAt: string
}

Participant {
  id: string
  name: string
  joinedAt: string
}

Guess {                             // NEW
  participantId: string
  participantName: string
  text: string
  isCorrect: boolean
}

Stroke {                            // NEW
  points: { x: number; y: number }[]
}

RoomSnapshot {
  code: string
  status: RoomStatus
  hostId: string                    // NEW — always visible
  participants: Participant[]
  drawerId: string | null           // NEW
  secretWord: string | null         // NEW — only if viewer is drawer OR status === "finished"
  availableWords: string[]
  roles: ParticipantRole[]
  guesses: Guess[]                  // NEW
  scores: Record<string, number>    // NEW
  strokes: Stroke[]                 // NEW
}
```

### Frontend — Extended Types (`frontend/src/services/api.ts`)

Mirror the backend types exactly. The `RoomSnapshot` interface must include all new fields.

---

## Data Flow

### Scenario 1 — Room Setup & Lobby

```
[Create Room Form]
  → POST /rooms { playerName }
  ← { participantId, room: RoomSnapshot { hostId, status: "lobby", ... } }
  → Navigate to /lobby

[Lobby Page — Polling]
  → setInterval(2000ms) → GET /rooms/:code?participantId=X
  ← { room: RoomSnapshot }
  → Update RoomStore state → re-render participant list

[Host clicks Start Game]
  → POST /rooms/:code/start { participantId }
  ← 200 { room: RoomSnapshot { status: "playing", drawerId, secretWord, ... } }
  → Navigate to /game
```

### Scenario 2 — Game Start & Drawer Flow

```
[Game Page load — Polling]
  → GET /rooms/:code?participantId=X
  ← RoomSnapshot with role-appropriate secretWord visibility
  → If viewerParticipantId === drawerId: show "Your word: ..."
  → If viewerParticipantId !== drawerId: hide word, show guess form
```

### Scenario 3 — Gameplay Interaction

```
[Drawer draws on canvas]
  → Every stroke-end: POST /rooms/:code/strokes { participantId, strokes }
  ← 200

[Guesser submits guess]
  → POST /rooms/:code/guess { participantId, text: "..." }
  ← 200 { isCorrect: boolean, score: number }

[All players poll]
  → GET /rooms/:code?participantId=X
  ← RoomSnapshot with latest strokes, guesses, scores
```

### Scenario 4 — Result & Restart

```
[All guessers correct → status → "finished"]
  → Poll detects status === "finished"
  → ResultPanel shows: secretWord (now visible to all), final scores, guess history

[Host clicks Restart]
  → POST /rooms/:code/restart { participantId }
  ← 200 { room: RoomSnapshot { status: "lobby", drawerId: null, ... } }
  → Navigate to /lobby
  → Polling resumes in lobby
```

---

## File-Level Plan

### Group 1 — Room Setup & Lobby

| Step | File | Change |
|------|------|--------|
| 1.1 | `backend/src/models/game.ts` | Add `hostId` to `Room`; extend `RoomStatus` with `"playing"` and `"finished"` |
| 1.2 | `backend/src/services/roomStore.ts` | Set `hostId = participant.id` in `createRoom()`; pass `hostId` in `toRoomSnapshot()`; validate name non-empty |
| 1.3 | `backend/src/api/schemas.ts` | Validate `playerName` is non-empty after trim in both `createRoomSchema` and `joinRoomSchema` |
| 1.4 | `backend/src/api/rooms.ts` | Add `POST /rooms/:code/start` endpoint with host + min-players guard |
| 1.5 | `frontend/src/services/api.ts` | Add `api.startGame()`, extend `RoomSnapshot` with `hostId` |
| 1.6 | `frontend/src/state/roomStore.ts` | Add `startGame()` method |
| 1.7 | `frontend/src/pages/LobbyPage.tsx` | Auto-poll `useEffect` with `setInterval` 2000ms + cleanup; disable Start for non-host / <2 players |
| 1.8 | `frontend/src/pages/CreateRoomPage.tsx` | Add client-side name trimming before submit |
| 1.9 | `frontend/src/pages/JoinRoomPage.tsx` | Add client-side name + code validation |

### Group 2 — Game Start & Drawer Flow

| Step | File | Change |
|------|------|--------|
| 2.1 | `backend/src/models/game.ts` | Add `GameRound`, `Guess`, `Stroke` interfaces |
| 2.2 | `backend/src/services/roomStore.ts` | Add `startGame()`: set drawerId, pick word deterministically, init scores; update `toRoomSnapshot()` for viewer-based word visibility |
| 2.3 | `backend/src/api/rooms.ts` | Update `POST /rooms/:code/start` to call `startGame()` |
| 2.4 | `frontend/src/services/api.ts` | Extend `RoomSnapshot` with `drawerId`, `secretWord`, `guesses`, `scores`, `strokes` |
| 2.5 | `frontend/src/pages/GamePage.tsx` | Show role badge; show/hide word; show/hide guess form based on role |
| 2.6 | `frontend/src/components/GuessForm.tsx` | Hide for drawer (or pass `disabled` with role-aware message) |

### Group 3 — Gameplay Interaction

| Step | File | Change |
|------|------|--------|
| 3.1 | `backend/src/services/roomStore.ts` | Add `submitGuess()`: trim, case-insensitive compare, score 100 if correct, record guess |
| 3.2 | `backend/src/services/roomStore.ts` | Add `saveStrokes()`: append strokes to room |
| 3.3 | `backend/src/api/schemas.ts` | Add guess schema (non-empty string) and stroke schema |
| 3.4 | `backend/src/api/rooms.ts` | Add `POST /rooms/:code/guess` and `POST /rooms/:code/strokes` |
| 3.5 | `frontend/src/services/api.ts` | Add `api.submitGuess()`, `api.saveStrokes()` |
| 3.6 | `frontend/src/state/roomStore.ts` | Add `submitGuess()`, `saveStrokes()` methods |
| 3.7 | `frontend/src/pages/GamePage.tsx` | Add polling loop to auto-refresh game state |
| 3.8 | `frontend/src/components/Scoreboard.tsx` | Render scores from `RoomSnapshot.scores` |
| 3.9 | `frontend/src/components/GuessForm.tsx` | Wire submit to `roomStore.submitGuess()`, show validation |
| 3.10 | Frontend: replace canvas placeholder | Implement HTML5 Canvas with mouse drawing for drawer; read-only rendering for guessers; "Clear Canvas" button |

### Group 4 — Result, Restart & Final Validation

| Step | File | Change |
|------|------|--------|
| 4.1 | `backend/src/services/roomStore.ts` | Auto-transition to `"finished"` when all guessers have guessed correctly; add `restartGame()` |
| 4.2 | `backend/src/api/rooms.ts` | Add `POST /rooms/:code/restart` endpoint |
| 4.3 | `frontend/src/services/api.ts` | Add `api.restartGame()` |
| 4.4 | `frontend/src/state/roomStore.ts` | Add `restartGame()` method |
| 4.5 | `frontend/src/components/ResultPanel.tsx` | Render final word, scores, guess history |
| 4.6 | `frontend/src/pages/GamePage.tsx` | Detect `"finished"` status; show ResultPanel; show Restart button for host |
| 4.7 | `frontend/src/pages/LobbyPage.tsx` | After restart, lobby shows preserved players, Start Game works again |

---

## Testing Strategy

- **Backend unit tests**: Test `startGame()` (host check, min players, word determinism), `submitGuess()` (trim, case-insensitive, scoring, duplicate correct), `restartGame()` (state reset, players preserved).
- **Frontend unit tests**: Test API methods for correct request URLs and bodies.
- **Manual tests**: Two browser tabs — create room, join, verify polling, start game, draw, guess, see result, restart.

## Risks

| Risk | Mitigation |
|------|------------|
| Canvas drawing data could grow large | Store as array of strokes; each stroke is array of points; limit stroke count per round? Not needed for single round. |
| Polling delay (~2s) creates stale state | Acceptable per spec; no real-time requirement. |
| Race condition: host clicks start while guesser polls | Atomic backend operations; frontend re-fetches after navigates. |
| Multiple correct guesses by same player | Track `hasGuessedCorrectly` per round per participant; only first correct scores 100. |
