# Quickstart: Round Drawing, Guessing, and Scoring Validation

## Prerequisites

- Node.js 22 (run `nvm use` from repo root if using nvm)
- Three browser tabs or windows (one for drawer, two for guessers)

## Start the Application

1. **Backend**:
   ```bash
   cd backend && npm run dev
   ```
   Expected: `Backend listening on http://localhost:3001`

2. **Frontend**:
   ```bash
   cd frontend && npm run dev
   ```
   Expected: Vite dev server URL (usually `http://localhost:5173`)

## Validation Scenarios

### Scenario 1: Drawer Draws on the Canvas

1. Open the frontend URL in **Tab 1** and create a room as `Alice`.
2. In **Tab 2**, join the room as `Bob`.
3. In **Tab 1** (host), click **Start Game**.
4. In **Tab 1** (drawer), verify the canvas area is interactive.
5. Click and drag on the canvas to draw a freehand stroke.
6. **Expected**: The stroke is rendered and remains visible on the canvas in Tab 1.
7. Wait ~2 seconds and check **Tab 2**.
8. **Expected**: The same stroke appears on the canvas in Tab 2 (synced via polling).

### Scenario 2: Drawer Clears the Canvas

1. Continue from Scenario 1 with strokes visible on the canvas in both tabs.
2. In **Tab 1** (drawer), click a **Clear Canvas** button or action.
3. **Expected**: All strokes disappear from the canvas in Tab 1 immediately.
4. Wait ~2 seconds and check **Tab 2**.
5. **Expected**: The canvas is blank in Tab 2 as well.

### Scenario 3: Guesser Submits Correct Guess

1. Continue from a clean game state (drawer is Alice, guesser is Bob).
2. In **Tab 2** (guesser), type `rocket` into the guess input and submit.
3. **Expected**: The guess appears in the Activity/History panel in both tabs within ~3 seconds.
4. **Expected**: Bob's score increases by 100 in the Scoreboard, visible in both tabs.
5. **Expected**: Alice's score remains 0.
6. **Expected**: The room status transitions to `results` in both tabs; no further guesses can be submitted.

### Scenario 4: Guesser Submits Case-Variant Correct Guess

1. In **Tab 2** (or a fresh guesser tab), submit `Rocket` (mixed case).
2. **Expected**: The guess is treated as correct. If this is Bob's first correct guess, 100 points are awarded.

### Scenario 5: Empty or Whitespace-Only Guess Is Rejected

1. In **Tab 2** (guesser), submit a guess containing only spaces `   `.
2. **Expected**: A clear error message is shown. No points are awarded. Nothing is added to the guess history.
3. Submit a guess with leading/trailing spaces: `  pizza  `.
4. **Expected**: The guess is trimmed to `pizza` and processed normally.

### Scenario 6: Incorrect Guess Is Recorded Without Points

1. In **Tab 2** (guesser), submit `castle` (incorrect for the current word `rocket`).
2. **Expected**: The guess appears in the Activity/History panel with a neutral/incorrect indicator.
3. **Expected**: Bob's score does not change (0 points awarded).

### Scenario 7: Drawer Cannot Submit a Guess

1. In **Tab 1** (drawer), attempt to submit a guess.
2. **Expected**: The guess input is either disabled or the submission is rejected with a clear message that the drawer cannot guess.

### Scenario 8: Guess History Syncs Across All Players

1. In **Tab 2**, submit `guitar`.
2. In **Tab 3** (a third guesser tab), join the same room and submit `pizza`.
3. Wait ~2 seconds.
4. **Expected**: All three tabs show both guesses in the same chronological order.

### Scenario 9: Scoreboard Reflects All Participants

1. With multiple guessers in the room, verify the Scoreboard panel.
2. **Expected**: Every participant is listed with their current score.

### Scenario 10: Drawer Leaves Mid-Round

1. Start the game with at least 2 players.
2. Submit a few guesses and draw some strokes.
3. In **Tab 1** (drawer), navigate back to the lobby or close the tab.
4. Wait ~2 seconds in the remaining tab(s).
5. **Expected**: Remaining players are redirected to the lobby. The room status returns to `lobby`. Scores, guess history, and canvas strokes are cleared.

## Automated Tests

Run the existing test suites to verify contracts:

```bash
cd backend && npm test
cd frontend && npm test
```

## Acceptance Gate

All scenarios above must pass before proceeding to the next feature group (Results/Restart).
