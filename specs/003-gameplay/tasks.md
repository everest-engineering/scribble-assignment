# Tasks: Gameplay Interaction

## Dependencies

- 002-game-start (playing status, drawerId, secretWord)

## Ordered Tasks

1. [ ] Add Stroke and Guess types to backend models
2. [ ] Implement addStroke, clearCanvas, submitGuess in roomStore
3. [ ] Add Zod schemas for stroke, clear, guess payloads
4. [ ] Add POST routes for strokes, clear, guess
5. [ ] Extend toRoomSnapshot with strokes, guesses, participant scores
6. [ ] Extend frontend API with addStroke, clearCanvas, submitGuess
7. [ ] Extend roomStore with game actions
8. [ ] Create DrawingCanvas component with normalized coordinates
9. [ ] Wire GuessForm to submitGuess with validation
10. [ ] Update Scoreboard with live scores
11. [ ] Update ResultPanel with guess history
12. [ ] Update GamePage: role-based canvas/guess UI, polling while playing
13. [ ] Add backend tests for scoring and guess validation
14. [ ] Validate draw/guess/score sync in two tabs
