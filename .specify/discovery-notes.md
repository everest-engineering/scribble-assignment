# Discovery Notes

## Incomplete Behaviors (≥3)

1. **No host tracking** — Room creator is not marked as host. The lobby "Start Game" button is visible to all players and navigates client-side without any server call.
2. **No automatic polling** — Lobby requires manual "Refresh Room" clicks. The game page has zero sync mechanism for drawing, guesses, or scores.
3. **No game lifecycle** — `RoomStatus` is `"lobby"` only. No playing/result states, drawer assignment, secret word, canvas strokes, guess history, or scoring.
4. **Missing input validation** — Whitespace-only player names are accepted (default to "Player"). Room codes are not format-validated on join.
5. **Frontend API URL bug** — `frontend/src/services/api.ts` defaults to `http://localhost:3001/bug`, causing 404 on fresh clone unless `VITE_API_URL` is set.

## Assumptions (≥2)

1. **Single round only** — One drawer (the host), one secret word, round ends on first correct guess. No rotation, timers, or multiple rounds.
2. **Deterministic word selection** — Word index derived from room code hash: `STARTER_WORDS[hashCode(code) % length]`. Same room always gets the same word on restart.
3. **Polling cadence ~2000ms** — Used on lobby and game/result screens. Acceptable latency for drawing sync.
4. **Viewer-aware snapshots** — `GET /rooms/:code?participantId=` returns `secretWord` only to the drawer during `playing`; all players see `revealedWord` during `result`.

## Relevant Files

### Backend
- `backend/src/models/game.ts` — Room, Participant, RoomSnapshot types
- `backend/src/services/roomStore.ts` — In-memory room CRUD and snapshot builder
- `backend/src/api/rooms.ts` — HTTP route handlers
- `backend/src/api/schemas.ts` — Zod validation schemas
- `backend/src/seed/starterData.ts` — Starter words and roles

### Frontend
- `frontend/src/services/api.ts` — API client and types
- `frontend/src/state/roomStore.ts` — React state store
- `frontend/src/pages/LobbyPage.tsx` — Lobby UI
- `frontend/src/pages/GamePage.tsx` — Game UI (placeholders)
- `frontend/src/pages/CreateRoomPage.tsx` — Create room form
- `frontend/src/pages/JoinRoomPage.tsx` — Join room form
- `frontend/src/components/GuessForm.tsx` — Guess input (non-functional)
- `frontend/src/components/Scoreboard.tsx` — Score display (placeholder)
- `frontend/src/components/ResultPanel.tsx` — Result display (placeholder)
