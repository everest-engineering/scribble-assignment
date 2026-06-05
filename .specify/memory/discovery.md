# Discovery Notes

*Updated per scenario. Last updated: Scenario 0 (pre-implementation)*

---

## Incomplete Behaviors

**B1 — No host tracking** *(Scenario 1)*
The `Participant` model has no `isHost` flag. The first player to create a room is not marked as host anywhere in the backend or frontend. The Start Game button in `LobbyPage` has no host-only guard.
Relevant: `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, `frontend/src/pages/LobbyPage.tsx`

**B2 — No lobby polling** *(Scenario 1)*
The lobby refreshes only on manual button click. There is no `setInterval` or polling loop anywhere in `LobbyPage`. The Refresh button calls `fetchRoom` once and stops.
Relevant: `frontend/src/pages/LobbyPage.tsx`, `frontend/src/services/api.ts`

**B3 — Game screen is entirely placeholder** *(Scenarios 2–4)*
`GamePage` renders static placeholder divs for the canvas, scoreboard, and results. `GuessForm.handleSubmit` is a no-op. `Scoreboard` shows hardcoded "Waiting for players…". `ResultPanel` shows hardcoded copy. No drawing, scoring, or guess logic exists.
Relevant: `frontend/src/pages/GamePage.tsx`, `frontend/src/components/GuessForm.tsx`, `frontend/src/components/Scoreboard.tsx`, `frontend/src/components/ResultPanel.tsx`

**B4 — Room never transitions out of "lobby" status** *(Scenarios 2–4)*
The `Room.status` type only includes `"lobby"`. No `startGame`, `submitGuess`, or `endRound` endpoints exist. The backend has no concept of an active round, drawer, current word, guesses, or scores.
Relevant: `backend/src/models/game.ts`, `backend/src/api/rooms.ts`, `backend/src/services/roomStore.ts`

**B5 — Player name is not validated for empty/whitespace** *(Scenario 2)*
`CreateRoomPage` and `JoinRoomPage` pass `playerName` directly to the API. The backend coerces a missing name to `"Player"` but does not reject whitespace-only strings.
Relevant: `backend/src/api/rooms.ts`, `frontend/src/pages/CreateRoomPage.tsx`, `frontend/src/pages/JoinRoomPage.tsx`

---

## Assumptions

**A1 — First participant to create a room is the host**
The README says "the creator is automatically the host" but the model has no host field. We assume `isHost: true` is stored on the first participant added during room creation and surfaced in the snapshot.

**A2 — Word selection is positional, not random**
The README says "deterministically selected from the starter list". We assume the first word in `STARTER_WORDS` (`"rocket"`) is always used for round 1, since no round counter or word rotation logic is specified.

**A3 — Guess history sync uses the same polling loop as lobby**
The README says guesses are "synced to all players via polling". We assume the game screen reuses the same `GET /rooms/:code` snapshot endpoint and polling cadence (~2 s) rather than a separate endpoint.

**A4 — `participantId` stored client-side is the source of truth for role/word visibility**
The frontend receives `participantId` on create/join. We assume role-conditional rendering (drawer sees word, guessers don't) is done client-side by comparing the stored `participantId` against the drawer field returned in the snapshot.

---

## Relevant Files

| File | Role |
|------|------|
| `backend/src/models/game.ts` | Room and Participant types — extend here for host, status, round, guess |
| `backend/src/services/roomStore.ts` | In-memory store — all game-state mutations go here |
| `backend/src/api/rooms.ts` | Route handlers — add start, guess, restart endpoints here |
| `backend/src/seed/starterData.ts` | Starter words and roles |
| `frontend/src/pages/LobbyPage.tsx` | Add polling, host guard, start-game call |
| `frontend/src/pages/GamePage.tsx` | Add canvas, guess submission, polling, result view |
| `frontend/src/services/api.ts` | Add API calls for startGame, submitGuess, restartGame |
| `frontend/src/state/roomStore.ts` | Client state store — extend for round/game state |
| `frontend/src/components/GuessForm.tsx` | Wire up submit handler |
| `frontend/src/components/Scoreboard.tsx` | Render real scores from snapshot |
| `frontend/src/components/ResultPanel.tsx` | Render guess history and result state |
