# Plan: Gameplay Interaction

## Source

- Spec: `speckit/specs/03-gameplay-interaction.md`
- Prior feature: `speckit/specs/02-game-start-drawer.md`
- Constitution: `speckit/constitution.md`

## Goal

Complete the active round interaction slice: scores begin at 0, the drawer can draw and clear the canvas, guessers can submit validated guesses, guess history syncs through HTTP polling, and scoring is deterministic at 100 for correct guesses and 0 for incorrect guesses.

## Current State

Feature Group 2 starts a game, assigns the first participant as drawer, selects the deterministic word, and exposes the secret word only to the drawer. The game page still uses a placeholder canvas, placeholder scoreboard, and a guess form that prevents default submission without sending data.

## Backend Plan

1. Extend the room model in `backend/src/models/game.ts`.
   - Add per-participant scores initialized to 0 when the game starts.
   - Add drawing state to the active room. Store a compact serializable canvas payload, such as an array of stroke points or path commands.
   - Add guess history entries with id, participant id, participant name, trimmed text, correctness, score delta, and submitted timestamp.

2. Extend room snapshots.
   - Include scores for every participant.
   - Include current drawing state.
   - Include full guess history.
   - Keep secret-word visibility rules from Feature Group 2 unchanged.

3. Add Zod schemas in `backend/src/api/schemas.ts`.
   - Draw update payload: `participantId` and drawing payload.
   - Clear canvas payload: `participantId`.
   - Guess payload: `participantId` and `guessText`.
   - Trim guesses and reject empty or whitespace-only text.

4. Add room-store actions in `backend/src/services/roomStore.ts`.
   - `updateDrawing`: only drawer, only active `playing` room.
   - `clearDrawing`: only drawer, only active `playing` room.
   - `submitGuess`: only non-drawer participants, only active `playing` room.
   - Compare guesses case-insensitively after trimming.
   - Correct guesses add 100 once per guesser for this round; repeated correct guesses by the same participant do not increase score beyond 100.
   - Incorrect guesses add 0 and remain in history.

5. Add REST routes in `backend/src/api/rooms.ts`.
   - `POST /rooms/:code/drawing` for drawer drawing updates.
   - `POST /rooms/:code/clear` for drawer clear action.
   - `POST /rooms/:code/guesses` for guess submission.
   - Return updated room snapshots after successful mutations.

## Frontend Plan

1. Update API types and methods in `frontend/src/services/api.ts`.
   - Add score, drawing, and guess-history snapshot fields.
   - Add `updateDrawing`, `clearDrawing`, and `submitGuess` methods.

2. Update room store in `frontend/src/state/roomStore.ts`.
   - Add actions for drawing update, clear, and guess submit.
   - Continue using room snapshot replacement as the source of truth.

3. Add game-page polling.
   - Poll the active game room through existing `fetchRoom` while on `/game`.
   - Use polling to sync drawing state, guess history, and scores for all participants.
   - Stop polling on unmount.

4. Replace canvas placeholder with interactive drawing.
   - Use an HTML canvas.
   - Enable pointer drawing only for the drawer.
   - Keep non-drawer canvas read-only.
   - Send drawing state through HTTP after drawing changes.
   - Add a clear button visible/enabled only for the drawer.

5. Wire guesses and score display.
   - Make `GuessForm` submit through the room store.
   - Trim and reject empty guesses client-side before API call.
   - Disable guess submission for the drawer.
   - Update `Scoreboard` to render participant scores from room snapshot.
   - Update `ResultPanel` or activity panel to render synced guess history.

## Data Flow

1. Game start initializes active state.
   - Backend sets every participant score to 0.
   - Backend initializes empty drawing state and empty guess history.

2. Drawer draws or clears.
   - Frontend captures canvas state.
   - Frontend sends HTTP mutation with drawer participant id.
   - Backend verifies drawer permissions and updates drawing state.
   - All clients receive the updated state on their next poll.

3. Guesser submits a guess.
   - Frontend trims input and rejects empty text.
   - Backend trims again, rejects empty text, compares case-insensitively, appends history, and applies score delta.
   - All clients receive updated scores and guess history on their next poll.

## Testing Plan

1. Backend room-store tests.
   - Scores initialize to 0 when the game starts.
   - Drawer can update and clear drawing state.
   - Non-drawer cannot update or clear drawing state.
   - Empty guesses are rejected and not stored.
   - Guesses are trimmed before storage.
   - Correct guesses match case-insensitively and score 100.
   - Incorrect guesses score 0.
   - Repeated correct guesses by the same participant do not exceed 100.
   - Guess history is returned in snapshots.

2. Backend schema/API tests.
   - Draw, clear, and guess schemas require participant id.
   - Guess schema trims and rejects empty text.
   - Direct API calls reject unauthorized drawer/guesser actions.

3. Frontend tests.
   - API methods call expected endpoints.
   - Guess form rejects empty text and submits valid guesses.
   - Scoreboard renders scores from snapshot.
   - Activity panel renders guess history.

4. Manual validation.
   - Start a 2-player game.
   - Confirm both scores begin at 0.
   - Draw as drawer and confirm the drawing appears after polling.
   - Clear as drawer and confirm the canvas clears after polling.
   - Submit incorrect and correct guesses as guesser.
   - Confirm correct guess scores 100 and incorrect remains 0.
   - Confirm guess history appears for all participants.

## Risks

1. Canvas serialization can grow quickly; keep payload compact for the starter implementation.
2. Polling and drawing updates can race; backend snapshot should remain the source of truth.
3. Frontend and backend snapshot types are duplicated and must stay aligned.
4. Browser refresh still loses participant identity, so privileged actions must remain blocked without a valid participant id.

## Out Of Scope

1. WebSockets or push sync.
2. Timers, multiple rounds, drawer rotation, or speed bonuses.
3. Result state and restart flow.
4. Persistent storage or accounts.
