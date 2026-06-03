# Feature Spec: Gameplay Interaction

**Feature**: `004-gameplay-interaction`
**Parent Assignment Spec**: `specs/001-scribble-game/spec.md`

## User Story

As players in an active round, I want the drawer to draw and guessers to submit guesses so that the group can play the round and produce shared scores.

## Acceptance Criteria

1. Given the viewer is the drawer, when they draw on the canvas, then the drawing is stored in room state.
2. Given a guesser is viewing the same active room, when polling refreshes, then the guesser sees the updated drawing.
3. Given the viewer is the drawer, when they clear the canvas, then the cleared drawing state is stored and visible after polling.
4. Given the viewer is a guesser, when they submit an empty or whitespace-only guess, then the guess is rejected and no history entry is added.
5. Given the viewer is a guesser, when they submit an incorrect trimmed guess, then the guess is added to shared history and scores remain unchanged.
6. Given the viewer is a guesser, when they submit the correct word with any casing, then the guess is marked correct and the guesser receives 100 points.
7. Given the viewer is the drawer, when they attempt to guess, then the action is unavailable or rejected.
8. Given a correct guess is submitted, then the room transitions to result state.

## Requirements

- Only the drawer MUST be allowed to update drawing state.
- Only the drawer MUST be allowed to clear drawing state.
- Guess submission MUST be available only to guessers during active state.
- Guess text MUST be trimmed before comparison and persistence.
- Empty guesses MUST be rejected.
- Guess comparison MUST be case-insensitive.
- Incorrect guesses MUST be stored with 0 score delta.
- Correct guesses MUST be stored with 100 score delta and must end the round.
- Scores and guess history MUST synchronize through polling.

## Entities

- Drawing state: ordered strokes, each with points.
- Guess: id, participant id, participant name, text, correctness, score delta, timestamp.
- Score map: participant id to score.

## Validation

Automated validation covers drawer-only drawing, clear canvas, empty guesses, drawer guess rejection, incorrect guesses, correct guesses, score updates, and result transition. Frontend tests cover drawing path rendering, guess normalization, score rendering, and guess history rendering.
