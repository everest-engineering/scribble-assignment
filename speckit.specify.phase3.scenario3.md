**Phase 3 — Scenario 3: Gameplay Interaction**

Goal
- Enable the drawer to interact with and clear the shared canvas; sync guesses from guessers; persist a trimmed, case-insensitive guess history; award 100 points deterministically to correct guessers.

Acceptance Criteria
- Drawer canvas interaction
  - The drawer can draw on a shared canvas component and can clear it via a Clear button.
  - Clear action resets the shared canvas state for all participants within one polling tick (2s).
- Guess input handling
  - Guess submissions are trimmed of leading/trailing whitespace and normalized to lower-case before processing.
  - Empty guesses (after trimming) are rejected client-side and not sent to the backend.
- Synced guesses and history
  - Guessers submit guesses via the existing `GuessForm` which POSTs guesses to `/api/rooms/:code/guess`.
  - The server maintains a deterministic, append-only `guesses` array per room containing objects: `{ id, participantId, text, normalizedText, createdAt }`.
  - Clients poll the room snapshot every 2 seconds and receive the latest `guesses` array; the array is ordered by `createdAt`.
  - The frontend trims and normalizes displayed guesses to lower-case for comparison, but displays the original text as submitted.
- Scoring
  - On receiving a guess, the server deterministically compares the guess `normalizedText` to the room's `secretWord` normalized to lower-case.
  - If a match occurs, the server awards exactly 100 points to the guessing participant and sets the room state to indicate the round winner; points are added to a per-participant `score` integer.
  - The award operation is idempotent for the winning guess (if repeated POSTs occur for the same guess ID, it does not double-award).
  - After a correct guess, future guesses in the same round are accepted but do not award additional points for the same secret word.

Implementation Notes
- Backend
  - Add endpoint: `POST /api/rooms/:code/guess` that accepts `{ participantId, text }` validated with Zod; returns the updated room snapshot.
  - Room model: extend `Room` with `guesses: Guess[]` and `scores: Record<string, number>` where `Guess` = `{ id, participantId, text, normalizedText, createdAt }`.
  - On guess POST: trim and lower-case `text` to `normalizedText`. If `normalizedText` equals lowercased `secretWord` and the room is `active` and `!roundWon`, award 100 points, set `roundWon=true`, and record winnerParticipantId; append guess to `guesses` array; save room.
  - Ensure idempotency: if the incoming guess payload contains an `id` that already exists, ignore duplicate scoring and just return current snapshot.
  - Ensure `toRoomSnapshot` includes `guesses` (full list) and `scores` for clients.
- Frontend
  - `GuessForm` should trim and lower-case the input before sending; avoid sending empty strings.
  - Use existing polling (2s) in `LobbyPage`/`GamePage` flows to refresh `room` snapshots which now include `guesses` and `scores`.
  - Render `guesses` in the UI (e.g., under `ResultPanel`) showing submitter name, original text, and timestamp; highlight the winning guess when `roundWon` is true.
  - `Canvas` component: expose a `clear()` action that sends `POST /api/rooms/:code/canvas/clear` or include `POST /api/rooms/:code/clear` endpoint; for simplicity use `POST /api/rooms/:code/clear-canvas` which sets `canvasState = null` and updates `updatedAt`.

Testing & Determinism
- Use the existing deterministic `chooseWord(code)` to pick `secretWord` so scoring behavior is repeatable per room code.
- Tests should validate that:
  - Trimming/case-insensitive matching awards 100 points.
  - Duplicate POSTs for same `guess.id` do not double-award.
  - Clearing the canvas is reflected in the polled snapshot within 2s.

Notes for Developers
- Keep network payloads small: limit `guesses` history to last 100 entries in snapshot but persist full history in memory if needed.
- This scenario avoids websockets: short polling (2s) is acceptable for the game's scope.

Files to Modify
- Backend: `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, `backend/src/api/rooms.ts`, `backend/src/api/schemas.ts`
- Frontend: `frontend/src/components/Canvas.tsx`, `frontend/src/components/GuessForm.tsx`, `frontend/src/components/ResultPanel.tsx`, `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`, `frontend/src/pages/GamePage.tsx`

Acceptance Checklist
- [ ] Drawer can clear canvas and action syncs within 2s
- [ ] Guesses trimmed and normalized client-side
- [ ] Server stores normalized guesses and maintains guess history
- [ ] Correct guess awards exactly 100 points deterministically
- [ ] Idempotent scoring on duplicate submissions
- [ ] Updated snapshots include `guesses` and `scores` for UI

