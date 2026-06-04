# Discovery Notes

## Gaps Found

1. **Host tracking missing**: The `Room` model has no `hostId` field. The first player to create a room is not distinguished from subsequent joiners. The "Start Game" button in the lobby is client-side only with no API call, no host check, and no minimum player validation.

2. **Game state machine incomplete**: `RoomStatus` only has `"lobby"` — there is no `"playing"` or `"finished"` status. The `Room` model lacks `drawerId`, `secretWord`, `guesses`, `scores`, and `round` fields needed for gameplay.

3. **toRoomSnapshot ignores viewer role**: The `viewerParticipantId` parameter is accepted but discarded (`void viewerParticipantId`). All participants see the full word list regardless of their role, so drawer-only word visibility is not implemented.

4. **No auto-polling**: The Lobby only has a manual "Refresh Room" button. There is no automatic polling interval to sync room state.

5. **Canvas is a placeholder div**: No interactive drawing surface exists. The canvas area shows styled text only.

6. **Guess submission does nothing**: The GuessForm component's `handleSubmit` only calls `event.preventDefault()` with no API call or state update.

## Assumptions

1. **Word selection is deterministic**: Using `(room code charCode) % word list length` provides deterministic selection without randomness.

2. **First player is drawer**: In a 2-player game with roles `["drawer", "guesser"]`, the first participant (index 0) is the drawer, others are guessers.

3. **Canvas sync via polling**: Drawing strokes are stored on the backend and synced to all participants via the polling mechanism, since WebSockets are out of scope.

4. **Scoring is simple**: Correct guess = 100 points, incorrect = 0. No speed bonuses, partial credit, or drawer scoring.

5. **Single round only**: Multiple rounds, drawer rotation, and round timers are explicitly out of scope.

## Relevant Files

### Backend
- `backend/src/models/game.ts` — Type definitions
- `backend/src/services/roomStore.ts` — In-memory store
- `backend/src/api/rooms.ts` — Route handlers
- `backend/src/api/schemas.ts` — Zod validation
- `backend/src/seed/starterData.ts` — Word list and roles

### Frontend
- `frontend/src/services/api.ts` — API client
- `frontend/src/state/roomStore.ts` — Client state store
- `frontend/src/pages/LobbyPage.tsx` — Lobby with participants
- `frontend/src/pages/GamePage.tsx` — Game screen
- `frontend/src/components/GuessForm.tsx` — Guess input
- `frontend/src/components/Canvas.tsx` — Drawing canvas
- `frontend/src/components/Scoreboard.tsx` — Score display
- `frontend/src/components/ResultPanel.tsx` — Result display
- `frontend/src/styles/app.css` — Application styles
