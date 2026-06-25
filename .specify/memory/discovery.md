# Discovery Notes — Scribble Starter

## Incomplete Behaviors (≥3)

1. **No host tracking** — Room creator is not marked as host; any participant can click "Start Game" and navigate to `/game` without a backend call.
2. **No automatic lobby polling** — Participants only appear after manual "Refresh Room"; the assignment requires ~2s HTTP polling.
3. **Game screen is placeholder-only** — Canvas is a static div, guess form is a no-op, scoreboard and result panel show hardcoded placeholder text.
4. **No viewer-specific API responses** — `toRoomSnapshot` ignores `viewerParticipantId`; secret word cannot be hidden from guessers.
5. **Player name validation missing** — Empty or whitespace-only names silently become `"Player"` on both backend and frontend.
6. **Broken default API URL** — Frontend defaults to `http://localhost:3001/bug` instead of `http://localhost:3001`.

## Assumptions (≥2)

1. **Single round per game session** — The lab scope is one round: start → draw/guess → result → restart to lobby. No drawer rotation or multi-round logic.
2. **Round ends on first correct guess** — When a guesser submits a case-insensitive match, status transitions to `result` and scoring is final.
3. **Host is always the drawer** — On game start, the room creator (host) becomes the drawer for the single round.
4. **Deterministic word selection** — Secret word is chosen by hashing the room code against the starter word list (same word for the same room code every time).
5. **Polling is the sole sync mechanism** — All state (participants, strokes, guesses, scores, status) syncs via `GET /rooms/:code?participantId=...` at ~2s intervals.

## Relevant Files

### Backend
- `backend/src/models/game.ts` — Room and participant types
- `backend/src/services/roomStore.ts` — In-memory store and snapshot builder
- `backend/src/api/rooms.ts` — HTTP route handlers
- `backend/src/api/schemas.ts` — Zod request validation
- `backend/src/seed/starterData.ts` — Word list and roles

### Frontend
- `frontend/src/services/api.ts` — REST client and types
- `frontend/src/state/roomStore.ts` — Global room state
- `frontend/src/pages/LobbyPage.tsx` — Lobby UI (manual refresh only)
- `frontend/src/pages/GamePage.tsx` — Placeholder game UI
- `frontend/src/components/GuessForm.tsx`, `Scoreboard.tsx`, `ResultPanel.tsx` — Non-functional placeholders
