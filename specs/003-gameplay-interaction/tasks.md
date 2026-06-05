# Tasks: Gameplay Interaction

## Source

- Spec: `speckit/specs/03-gameplay-interaction.md`
- Plan: `speckit/plans/03-gameplay-interaction.md`

## Status

Implemented and API-validated.

## Backend Tasks

- [x] Extend room state with participant scores.
- [x] Initialize every participant score to 0 when the game starts.
- [x] Extend room state with serializable drawing data.
- [x] Initialize drawing state to empty when the game starts.
- [x] Extend room state with guess history entries.
- [x] Initialize guess history to empty when the game starts.
- [x] Extend room snapshots with scores, drawing state, and guess history.
- [x] Preserve Feature Group 2 drawer-only secret word visibility.
- [x] Add draw-update schema requiring `participantId` and drawing payload.
- [x] Add clear-canvas schema requiring `participantId`.
- [x] Add guess schema requiring `participantId` and trimmed `guessText`.
- [x] Reject empty or whitespace-only guesses with a clear API error.
- [x] Add room-store action for drawer-only drawing updates.
- [x] Add room-store action for drawer-only canvas clear.
- [x] Add room-store action for guess submission by non-drawers only.
- [x] Reject drawing, clear, and guess actions for rooms that are not actively playing.
- [x] Reject drawing and clear actions from non-drawers.
- [x] Reject guess actions from the drawer.
- [x] Reject drawing, clear, and guess actions from unknown participants.
- [x] Compare guesses case-insensitively after trimming.
- [x] Score correct guesses as 100.
- [x] Score incorrect guesses as 0.
- [x] Prevent repeated correct guesses by the same participant from increasing score beyond 100.
- [x] Add `POST /rooms/:code/drawing`.
- [x] Add `POST /rooms/:code/clear`.
- [x] Add `POST /rooms/:code/guesses`.

## Frontend Tasks

- [x] Update frontend room snapshot types with scores, drawing state, and guess history.
- [x] Add API methods for drawing update, clear canvas, and submit guess.
- [x] Add room-store actions for drawing update, clear canvas, and submit guess.
- [x] Add game-page polling while `/game` is mounted.
- [x] Stop game-page polling on unmount.
- [x] Replace canvas placeholder with an HTML canvas.
- [x] Enable pointer drawing only for the drawer.
- [x] Keep canvas read-only for non-drawers.
- [x] Send drawing state to the backend after drawer drawing changes.
- [x] Render drawing state received from polling.
- [x] Add a clear-canvas button visible or enabled only for the drawer.
- [x] Wire clear-canvas action to backend and snapshot update.
- [x] Wire `GuessForm` to submit guesses through room store.
- [x] Trim and reject empty guesses client-side.
- [x] Disable guess submission for the drawer.
- [x] Render score list from room snapshot.
- [x] Render synced guess history from room snapshot.
- [x] Display clear feedback for failed drawing, clear, or guess actions.

## Test Tasks

- [x] Add backend tests for score initialization.
- [x] Add backend tests for drawing update by drawer.
- [x] Add backend tests for drawing update rejection by non-drawer.
- [x] Add backend tests for canvas clear by drawer.
- [x] Add backend tests for canvas clear rejection by non-drawer.
- [x] Add backend tests for empty guess rejection.
- [x] Add backend tests for trimmed guess storage.
- [x] Add backend tests for case-insensitive correct guesses.
- [x] Add backend tests for correct guess scoring 100.
- [x] Add backend tests for incorrect guess scoring 0.
- [x] Add backend tests for repeated correct guess score cap.
- [x] Add backend tests for guess history in snapshots.
- [x] Add schema tests for drawing, clear, and guess payload validation.
- [x] Add frontend API tests for new endpoints.
- [x] Confirm frontend component-test setup is not present; covered frontend behavior with API tests, TypeScript build, and source-level wiring.
- [x] Confirm scoreboard and guess-history rendering compile against the expanded snapshot contract.
- [x] Run backend tests.
- [x] Run frontend tests.
- [x] Run backend build.
- [x] Run frontend build.
- [x] Run whitespace diff check.

## Manual Validation Checklist

- [x] Start a 2-player game.
- [x] Confirm all scores start at 0.
- [x] Draw as drawer and confirm drawing state is stored.
- [x] Confirm drawing appears for a guesser through polling snapshot.
- [x] Clear as drawer and confirm canvas state clears.
- [x] Confirm cleared canvas appears for a guesser through polling snapshot.
- [x] Confirm non-drawer cannot draw or clear.
- [x] Submit an empty guess and confirm a clear error.
- [x] Submit an incorrect guess and confirm score remains 0.
- [x] Submit a correct guess with different casing and confirm score becomes 100.
- [x] Confirm guess history is visible to all participants through polling.

Note: The implementation includes browser-side canvas interaction and read-only non-drawer rendering. Scenario verification was performed through the backend HTTP API because it directly validates the shared state that polling clients consume.

## Completed Verification

```sh
cd backend && npm test
cd frontend && npm test
cd backend && npm run build
cd frontend && npm run build
git diff --check
```

## Scenario Verification

- Backend REST: scores initialized to 0, drawer drawing stored, non-drawer draw rejected, drawing visible through fetched room snapshot, drawer clear resets drawing, empty guess rejected, drawer guess rejected, incorrect guess scores 0, case-insensitive correct guess scores 100, repeated correct guess remains capped at 100, and guess history is returned in snapshots.

Latest verification result:

```json
{
  "verified": true,
  "score": 100,
  "guessCount": 3,
  "drawingAfterClear": 0,
  "wrongScoreDelta": 0,
  "correctScoreDelta": 100
}
```

## Speckit Verify: Scenario 3

Verified against the requested scenario:

- [x] Round starts with drawer and guesser scores at 0.
- [x] Drawer drawing state is stored and visible in the drawer response.
- [x] Drawing state is visible to the guesser through a fetched polling snapshot.
- [x] Drawer clear resets the drawing state.
- [x] Cleared drawing state is visible to the guesser through a fetched polling snapshot.
- [x] Empty guesses are rejected with a 400 response and not added to history.
- [x] Guess text is trimmed before storage.
- [x] Guesses are compared case-insensitively.
- [x] Incorrect guesses add 0.
- [x] Correct guesses add 100.
- [x] Guess history is synced to drawer and guesser snapshots.

Latest requested verification result:

```json
{
  "verified": true,
  "initialScores": [0, 0],
  "drawingSynced": 1,
  "clearSynced": 0,
  "emptyGuessStatus": 400,
  "trimmedGuess": "pizza",
  "wrongScoreDelta": 0,
  "correctScoreDelta": 100,
  "finalScore": 100,
  "historyCounts": [2, 2]
}
```
