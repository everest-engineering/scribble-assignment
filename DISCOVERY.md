# Discovery Notes
# Discovery Notes

## Gaps Found (≥3)

1. **Host tracking missing**: The `Room` model has no `hostId` field. The first player to create a room is not distinguished from subsequent joiners. The "Start Game" button in the lobby is client-side only with no API call, no host check, and no minimum player validation.

2. **Game state machine incomplete**: `RoomStatus` only has `"lobby"` — there is no `"playing"` or `"finished"` status. The `Room` model lacks `drawerId`, `secretWord`, `guesses`, `scores`, and `round` fields needed for gameplay.

3. **toRoomSnapshot ignores viewer role**: The `viewerParticipantId` parameter is accepted but discarded (`void viewerParticipantId`). All participants see the full word list regardless of their role, so drawer-only word visibility is not implemented.

4. **No auto-polling**: The Lobby only has a manual "Refresh Room" button. There is no automatic polling interval to sync room state.

5. **Canvas is a placeholder div**: No interactive drawing surface exists. The canvas area shows styled text only.

6. **Guess submission does nothing**: The GuessForm component's `handleSubmit` only calls `event.preventDefault()` with no API call or state update.

## Assumptions (≥2)

1. **Word selection is deterministic**: The spec says "deterministically selected from the starter list." Since there are 5 words, using `(participant count) % 5` or a room-based hash provides deterministic selection without randomness.

2. **First player is drawer**: The spec says "the host (or first player) becomes the clearly-identified drawer." In a 2-player game with roles `["drawer", "guesser"]`, the first participant (index 0) is the drawer, others are guessers.

3. **Canvas sync is out of scope**: Drawing interactions only need to work on the drawer's screen. The spec says the drawing is "visible on the drawer's screen" — true canvas sync across clients would need WebSockets, which is explicitly out of scope.

4. **Scoring is simple**: Correct guess = 100 points, incorrect = 0. No speed bonuses, partial credit, or drawer scoring. Only the first correct guess matters since the round ends.

5. **Single round only**: Multiple rounds, drawer rotation, and round timers are explicitly out of scope. The game plays one round, shows results, and can restart (which returns to lobby).

## Relevant Files

### Backend
- `backend/src/models/game.ts` — Type definitions (Room, Participant, RoomSnapshot)
- `backend/src/services/roomStore.ts` — In-memory store, CRUD operations, snapshot generation
- `backend/src/api/rooms.ts` — Route handlers for rooms
- `backend/src/api/schemas.ts` — Zod validation schemas
- `backend/src/seed/starterData.ts` — Word list and role definitions

### Frontend
- `frontend/src/services/api.ts` — API client with typed fetch wrapper
- `frontend/src/state/roomStore.ts` — Client-side state store (observer pattern + Context)
- `frontend/src/pages/CreateRoomPage.tsx` — Create room form
- `frontend/src/pages/JoinRoomPage.tsx` — Join room form
- `frontend/src/pages/LobbyPage.tsx` — Lobby with participants list and manual refresh
- `frontend/src/pages/GamePage.tsx` — Game screen (all placeholders)
- `frontend/src/components/GuessForm.tsx` — Guess input form (no-op)
- `frontend/src/components/Scoreboard.tsx` — Placeholder scoreboard
- `frontend/src/components/ResultPanel.tsx` — Placeholder activity panel
- `frontend/src/styles/app.css` — All application styles
