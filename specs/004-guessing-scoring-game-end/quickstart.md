# Quickstart: Guessing, Scoring & Game End

## Prerequisites

- Backend and frontend running per project README
- A game room created with at least 2 participants
- Game round started (host clicks "Start Game")

## Validation Scenarios

### Scenario 1: Guesser Submits a Guess

1. Open the game as a guesser
2. Type a word in the guess input field
3. Click "Submit Guess"
4. **Expected**: The guess appears in the shared guess history within 2 seconds for all participants (including the drawer)

### Scenario 2: Empty Guess Rejection

1. Open the game as a guesser
2. Click "Submit Guess" with an empty input (or whitespace only)
3. **Expected**: An inline error message is shown; the guess is not recorded

### Scenario 3: Case-Insensitive Correct Guess

1. Note the secret word (visible only to drawer)
2. As a guesser, submit the secret word in a different case (e.g., "PIZZA" instead of "pizza")
3. **Expected**: The guess is marked as correct with a green checkmark; the round ends

### Scenario 4: Incorrect Guess Visual

1. As a guesser, submit a word that does not match the secret word
2. **Expected**: The guess appears with a red X icon; the round continues

### Scenario 5: First Correct Wins

1. Two guessers submit the correct word simultaneously (or in quick succession)
2. **Expected**: The first guess processed by the server ends the round; only that guesser receives 100 points

### Scenario 6: Result Screen Reveals Secret Word

1. After a correct guess (round ends), observe the screen
2. **Expected**: All participants see the secret word, the full guess history with correct/incorrect indicators, and the final scores

### Scenario 7: Host Restarts Game

1. On the result screen, the host clicks "Back to Lobby" or "Play Again"
2. **Expected**: All participants are returned to the lobby; the participant list is preserved; the drawing canvas, guesses, and scores are cleared

### Scenario 8: Non-Host Cannot Restart

1. As a non-host guesser, attempt to trigger restart (e.g., by calling the restart API directly)
2. **Expected**: The request is rejected with a 403 error; the room state does not change

### Scenario 9: Drawer Cannot Guess

1. Open the game as the drawer
2. Attempt to submit a guess
3. **Expected**: The guess input is disabled or the submission is rejected

## Running Tests

```bash
# Backend round flow tests
cd backend && npx vitest run src/tests/round.test.ts

# Frontend guess form component tests
cd frontend && npx vitest run src/tests/GuessForm.test.tsx

# Full build validation
cd backend && npm run build
cd frontend && npm run build
```

## API Reference

See [contracts/api.md](./contracts/api.md) for endpoint schemas.
