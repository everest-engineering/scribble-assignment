# Discovery Notes

## Incomplete Behaviors Observed

1. **Room and player context lost on refresh** — refreshing `/lobby` redirects to `/`. No session restoration. `RoomStore` is in-memory on the frontend; a hard reload clears `room` and `participantId`, triggering the guard redirect. Consequence: any participant who refreshes the page must re-create or re-join.

2. **Lobby requires manual refresh** — new players don't appear automatically; user must click "Refresh Room". The starter `LobbyPage` called `roomStore.fetchRoom()` only on button click. No `setInterval` existed. This made multi-player join invisible without manual action.

3. **Host tracking not implemented** — the room creator has no special status. `Room` had no `hostId` field. `participants[0]` was implicitly the creator, but nothing stored, surfaced, or enforced this. Every host-gated feature (start, end, restart) depended on a field that did not exist.

4. **Non-host players can start the game** — the Start Game button in `LobbyPage` was rendered unconditionally for all participants with no permission check.

5. **Game can start with only one player** — no minimum player count was enforced on the button or the backend.

6. **Game start not synchronized** — the Start Game button called `navigate("/game")` directly with no API call. Only the clicking player transitioned; others stayed in the lobby forever with no way to know the game had started.

7. **`toRoomSnapshot()` was a stub** — the function accepted `viewerParticipantId` but immediately discarded it (`void viewerParticipantId`). It returned static seed data (`STARTER_WORDS`, `STARTER_ROLES`) regardless of game state. Word visibility gating, role derivation, and results reveal all required this to be substantively rewritten.

8. **`GuessForm.handleSubmit` was a no-op** — the component rendered a controlled input and submit button but `handleSubmit` only called `event.preventDefault()`. No API call existed.

9. **`frontend/src/services/api.ts` owns its own type definitions** — it does not import `RoomSnapshot` or `RoomSessionResponse` from the backend. Every backend model change required a parallel update to this file's local interfaces. This was not obvious from reading the spec templates and was discovered only during implementation of Group 1.

---

## Assumptions

1. **The player who creates a room is the host** — `participants[0]` is always the creator. `hostId` is set to `participant.id` at creation and never changes, even through restart.

2. **A minimum of 2 players is required before a game can start** — enforced on both the frontend (button disabled) and backend (400 response).

3. **Polling (~2 s via `setInterval`) is the intended sync mechanism** — WebSockets are explicitly out of scope per `AGENTS.md` and the constitution. All state changes (join, start, guess, end, restart) propagate to other clients via the next poll cycle, within ≤4 s worst case.

4. **Room data only needs to persist while the backend is running** — in-memory storage is acceptable. Restarting the backend clears all rooms. This is explicitly stated in the README and accepted as a constraint.

5. **Word selection is deterministic (`STARTER_WORDS[0]` = "rocket")** — no randomness. This keeps verification simple (the correct answer is always known) and avoids `Math.random()`, which would complicate reproducible testing.

6. **Canvas drawing is local to the drawer only** — strokes are not transmitted to other participants. Syncing canvas state over HTTP polling would require binary image data or a stroke delta protocol, neither of which is feasible within the polling + in-memory constraints.

---

## Relevant Files

### Backend
- `backend/src/models/game.ts` — `Room`, `RoomSnapshot`, `Participant`, `Guess`, `RoomStatus`, `ParticipantRole` interfaces
- `backend/src/services/roomStore.ts` — in-memory `Map<string, Room>` store; `createRoom`, `joinRoom`, `startGame`, `submitGuess`, `endGame`, `restartGame`, `toRoomSnapshot`
- `backend/src/api/rooms.ts` — all route handlers: `POST /rooms`, `POST /rooms/:code/join`, `POST /rooms/:code/start`, `POST /rooms/:code/guess`, `POST /rooms/:code/end`, `POST /rooms/:code/restart`, `GET /rooms/:code`
- `backend/src/api/schemas.ts` — Zod validation schemas for all endpoints
- `backend/src/seed/starterData.ts` — `STARTER_WORDS` and `STARTER_ROLES` constants

### Frontend
- `frontend/src/services/api.ts` — HTTP client; owns local copies of `RoomSnapshot`, `RoomSessionResponse`, `Guess`, `Participant` interfaces
- `frontend/src/state/roomStore.ts` — client-side `RoomStore` class using `useSyncExternalStore`; holds `room`, `participantId`, `error`, `isLoading`
- `frontend/src/pages/LobbyPage.tsx` — polling, host gate, status-driven navigation to `/game`
- `frontend/src/pages/GamePage.tsx` — canvas, role banners, guess form wiring, status-driven navigation to `/results`
- `frontend/src/pages/ResultsPage.tsx` — results screen, Play Again, status-driven navigation to `/lobby`
- `frontend/src/components/GuessForm.tsx` — guess submission form with `onSubmit` and `error` props
- `frontend/src/components/Scoreboard.tsx` — live score display sorted descending
- `frontend/src/components/ResultPanel.tsx` — live guess history with correct/incorrect markers
- `frontend/src/routes/index.tsx` — React Router route definitions including `/results`
