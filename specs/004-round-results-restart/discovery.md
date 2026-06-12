# Discovery: Round Results and Game Restart

## Scaffold Analysis (What the Starter Already Had)

After completing Feature 003, the scaffold supported:

- **Backend**: Full room lifecycle through `playing` state; canvas strokes, guess submission with validation, scoring (100 for correct, 0 for incorrect), and guess history tracking; `GET /rooms/:code` returns all round state via polling.
- **Frontend**: Interactive canvas for the drawer, guess form for guessers, live scoreboard, guess history panel, and ~2s polling in `GamePage`.
- **Data model**: `Room` supports `status: "lobby" | "playing"`, `scores`, `guessHistory`, `canvasStrokes`, `currentWord`, `drawerId`.
- **UI Shell**: `GamePage` renders the playing UI but has no distinct results screen or restart flow.

## Gaps (Incomplete Behaviors)

1. **No `results` status**: `RoomStatus` is limited to `"lobby" | "playing"`. There is no `"results"` state to represent the end-of-round phase.
2. **No automatic round end**: When a guesser submits the correct word, the score is awarded but the room remains in `"playing"` status indefinitely. There is no state transition to signal the round is over.
3. **No manual round end**: The host has no way to end the round if no one guesses correctly (or if they choose to end early). There is no `POST /rooms/:code/end` endpoint.
4. **No word reveal to all players in results**: During `playing`, only the drawer sees `currentWord`. In the results phase, the word should be revealed to everyone, but no mechanism exists to change visibility rules based on status.
5. **No restart endpoint or logic**: There is no `POST /rooms/:code/restart`. The host cannot return the room to `lobby` and clear round state while preserving the participant list.
6. **No results UI differentiation**: `GamePage` conditionally renders based on `status`, but there is no `results` branch. The results view (word reveal, final scores, full history, restart button) is not implemented.
7. **No join restriction for `results` state**: `POST /rooms/:code/join` only rejects `playing` rooms. A room in `results` state incorrectly accepts new joiners.
8. **No idle cleanup for `results` rooms**: The `cleanupIdleRooms` function only considers `lobby` rooms; `results` rooms accumulate forever if left idle.

## Assumptions

- **Assumption A1**: The results screen reuses the existing `/game` route and conditionally renders within `GamePage` rather than introducing a new `/results` route.
- **Assumption A2**: On restart, the participant list and host identity are preserved, but all round-specific state (secret word, scores, guess history, canvas strokes, drawer assignment) is fully reset.
- **Assumption A3**: Only the host can trigger round-end and restart actions; non-host attempts are rejected with a clear error.
- **Assumption A4**: New players cannot join a room in `results` state; they receive a `409 Conflict` and must wait for the host to restart and return the room to `lobby`.
- **Assumption A5**: The existing polling mechanism (~2s) is sufficient to synchronize the `results` state and restart transition to all clients.
- **Assumption A6**: If the host leaves during `results` state, the room is destroyed and remaining participants are redirected to the home screen.

## Relevant Files

| File | Role |
|------|------|
| `backend/src/models/game.ts` | Needs `RoomStatus` extended to include `"results"` |
| `backend/src/services/roomStore.ts` | Needs `endRound`, `restartGame`, `removeParticipant` updates for `results` handling |
| `backend/src/api/rooms.ts` | Needs `POST /rooms/:code/end` and `POST /rooms/:code/restart` routes |
| `backend/src/api/schemas.ts` | Needs Zod schemas for end-round and restart payloads |
| `frontend/src/pages/GamePage.tsx` | Needs `results` branch with word reveal, scoreboard, history, and restart button |
| `frontend/src/services/api.ts` | Needs `endRound` and `restartGame` client methods |
| `frontend/src/state/roomStore.ts` | Needs `endRound` and `restartGame` store actions |

## Open Questions / Unknowns (Resolved)

- Q: Should the results screen be a distinct `status` value or a flag inside `playing`? → A: Distinct `status: "results"` to clearly separate phases and enforce join/guess restrictions.
- Q: Should the revealed word use a new `secretWord` field or reuse `currentWord`? → A: Reuse `currentWord`; populate it for all viewers when `status === "results"`.
- Q: What happens if the last non-drawer leaves while the round is active? → A: Automatic end is impossible; the host must manually end the round.
- Q: Should `results` rooms be subject to idle cleanup? → A: Yes, apply the same 10-minute idle cleanup for operational consistency.
