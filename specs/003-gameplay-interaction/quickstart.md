# Quickstart: Gameplay Interaction

## Prerequisites

- Previous features (Room Setup & Lobby, Game Start & Drawer Flow) fully implemented
- Backend running: `cd backend && npm run dev`
- Frontend running: `cd frontend && npm run dev`

## Validation Scenarios

### Scenario 1 — Canvas Drawing (US1)

1. Open Tab A → Create Room → Start Game (as host/drawer)
2. Open Tab B → Join Room (as guesser)
3. **Verify**: Tab A and Tab B both show a drawing canvas
4. Tab A: Draw on the canvas (click, drag, release)
5. **Verify**: Tab A's canvas shows the drawing in real-time
6. Wait up to 2 seconds
7. **Verify**: Tab B's canvas shows the same drawing
8. Tab A: Press the clear button
9. Wait up to 2 seconds
10. **Verify**: Both canvases are cleared

### Scenario 2 — Guess Submission (US2)

1. Follow Scenario 1 setup
2. Tab B (guesser): Type the correct word in the guess input → Submit
3. **Verify**: Tab B sees feedback "Correct! You scored 100 points."
4. Tab B: Type an incorrect word → Submit
5. **Verify**: Tab B sees feedback "Incorrect guess. Try again!"
6. Tab B: Submit an empty guess
7. **Verify**: Tab B sees error "Guess cannot be empty"
8. Tab B: Submit the correct word again (already correct)
9. **Verify**: Tab B sees "Already guessed correctly"

### Scenario 3 — Scoring and History (US3)

1. Follow Scenario 1 setup with Tab C as a second guesser
2. Tab B: Submit correct word
3. Wait up to 2 seconds
4. **Verify**: Tab A sees "Tab B guessed correctly" in guess history
5. **Verify**: Tab C sees Tab B's score as 100
6. Tab C: Submit correct word
7. Wait up to 2 seconds
8. **Verify**: Tab C's score is also 100
9. **Verify**: Tab A and Tab B see Tab C's score updated
10. **Verify**: All tabs see both guesses in the history

### Scenario 4 — Drawer Cannot Guess

1. Follow Scenario 1 setup
2. Tab A (drawer): Try to submit a guess
3. **Verify**: Tab A sees error "Only guessers can submit guesses"

### Scenario 5 — Guesser Cannot Draw

1. Follow Scenario 1 setup
2. Tab B (guesser): Try to draw on the canvas or submit strokes
3. **Verify**: Tab B's canvas is read-only (no drawing interaction)

### Scenario 6 — Polling Continues

1. Follow Scenario 1 setup
2. Open DevTools → Network tab
3. **Verify**: `GET /rooms/:code?participantId=...` continues at ~2s intervals
4. **Verify**: Responses include `strokes`, `guesses`, and `scores` fields
