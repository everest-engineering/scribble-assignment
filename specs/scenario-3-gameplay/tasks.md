# Tasks - Scenario 3 Gameplay Interaction

## Phase 1 - Backend Changes

### T-001 Add Guesses And Scores To Model

Files

- backend/src/models/game.ts
- backend/src/services/roomStore.ts

Dependencies

- None

Goal

- Add guesses array to room.
- Add score field to each participant.

### T-002 Add Submit Guess Endpoint

Files

- backend/src/services/roomStore.ts
- backend/src/api/schemas.ts
- backend/src/api/rooms.ts

Dependencies

- T-001

Goal

- Add submitGuess function that validates, compares, and scores guesses.
- Add POST /:code/guess route.

### T-003 Include Guesses And Scores In Snapshot

Files

- backend/src/services/roomStore.ts

Dependencies

- T-001

Goal

- Update toRoomSnapshot to return guesses list and participant scores.

## Phase 2 - Frontend Changes

### T-004 Update Frontend Types

Files

- frontend/src/services/api.ts
- frontend/src/state/roomStore.ts

Dependencies

- T-001

Goal

- Add guesses and score fields to frontend types.
- Add submitGuess method to room store.

### T-005 Update Guess Form

Files

- frontend/src/components/GuessForm.tsx

Dependencies

- T-002
- T-004

Goal

- Wire GuessForm to call submitGuess API.
- Add frontend validation that rejects empty guesses.

### T-006 Add Interactive Canvas

Files

- frontend/src/pages/GamePage.tsx
- frontend/src/styles/app.css

Dependencies

- None

Goal

- Replace canvas placeholder with real HTML5 Canvas for the drawer.
- Add mouse drawing handlers and a Clear Canvas button.

### T-007 Update Scoreboard And Add Guess History

Files

- frontend/src/components/Scoreboard.tsx
- frontend/src/pages/GamePage.tsx

Dependencies

- T-003
- T-004

Goal

- Show each player's name and score in the Scoreboard.
- Add guess history list visible to all players.

## Phase 3 - Testing

### T-008 Test Guess Validation And Scoring

Dependencies

- T-002

Goal

- Correct guess awards 100 points.
- Incorrect guess awards 0.
- Empty and whitespace-only guesses are rejected.
- Case-insensitive comparison works.

### T-009 Test Drawer Cannot Guess

Dependencies

- T-002

Goal

- Drawer submitting a guess is rejected by the backend.

### T-010 Test Snapshot Includes Guesses And Scores

Dependencies

- T-003

Goal

- Room snapshot always includes guesses list and scores.

### T-011 Test Frontend Display

Dependencies

- T-005
- T-006
- T-007

Goal

- Drawer sees interactive canvas and clear button.
- Guesser sees guess input and submit button.
- Scoreboard shows scores updated via polling.
- Guess history shows all guesses.
