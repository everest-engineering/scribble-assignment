# Discovery Notes

Discovery performed against the Scribble starter on a clean clone before any implementation work.

## Incomplete Behaviors (≥3)

1. **No host tracking** — `createRoom` adds a participant but never records who created the room. The lobby shows a "Start Game" button to every player with no permission check.
2. **No automatic polling** — the lobby only updates participant lists when the user clicks "Refresh Room". Multi-player sync requires manual action.
3. **Viewer-agnostic room snapshots** — `toRoomSnapshot` accepts `viewerParticipantId` but ignores it (`void viewerParticipantId`), so role-specific data (e.g. secret word for drawer only) cannot be implemented without changes.
4. **Empty player names silently default** — `displayName()` in `roomStore.ts` converts blank/undefined names to `"Player"` with no validation or user feedback.
5. **Game screen is entirely placeholder** — canvas is a styled div, guess form submit is a no-op, scoreboard and result panel show static text.

## Assumptions

1. **HTTP polling is the sole sync mechanism** — all room state (lobby participants, game drawing, guesses, scores) will sync via periodic `GET /rooms/:code?participantId=...` calls at ~2 second intervals. No WebSockets.
2. **Host equals room creator** — the participant returned by `createRoom` is permanently the host for that room's lifetime. Host-only actions: start game, restart game.
3. **Deterministic word selection** — the secret word will be chosen deterministically from the starter word list (index derived from room code hash), not randomly on each request, so all clients converge on the same word.
4. **Single round per game session** — one drawer, one word, one round. No rotation or multi-round logic (explicitly out of scope).

## Relevant Files

| Area | Path | Role |
|------|------|------|
| Backend model | `backend/src/models/game.ts` | Room, Participant, RoomSnapshot types |
| Backend store | `backend/src/services/roomStore.ts` | In-memory room CRUD, snapshot builder |
| Backend routes | `backend/src/api/rooms.ts` | REST endpoints |
| Backend validation | `backend/src/api/schemas.ts` | Zod request schemas |
| Backend seed | `backend/src/seed/starterData.ts` | Word list and roles |
| Frontend API | `frontend/src/services/api.ts` | HTTP client |
| Frontend state | `frontend/src/state/roomStore.ts` | Room session store |
| Frontend pages | `frontend/src/pages/LobbyPage.tsx` | Lobby UI |
| Frontend pages | `frontend/src/pages/CreateRoomPage.tsx` | Create room form |
| Frontend pages | `frontend/src/pages/JoinRoomPage.tsx` | Join room form |
| Frontend pages | `frontend/src/pages/GamePage.tsx` | Game screen (placeholder) |
| Frontend components | `frontend/src/components/GuessForm.tsx` | Guess input (no-op) |

## Starter Bug Found

- `frontend/src/services/api.ts` defaults API base URL to `http://localhost:3001/bug` instead of `http://localhost:3001`. Will fix in Phase 1.
