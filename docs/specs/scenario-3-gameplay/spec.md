# Scenario 3 - Gameplay Interaction

## User Story

As a player, I want to draw on a canvas (if I am the drawer) or submit guesses (if I am a guesser) so that I can participate in the round and score points.

## Acceptance Criteria

### AC-01 Canvas Drawing

Given a round is active and the viewer is the drawer

When the drawer draws on the canvas

Then the drawing appears on the drawer's screen in real time.

### AC-02 Clear Canvas

Given the drawer has drawn on the canvas

When the drawer clicks the clear button

Then the canvas is wiped clean and ready for new drawing.

### AC-03 Guess Submission

Given a round is active and the viewer is a guesser

When the guesser submits a guess

Then the guess is recorded and compared against the secret word.

### AC-04 Guess Validation

Given a guesser submits a guess

When the guess is empty or whitespace-only

Then the guess is rejected with a clear error message.

When the guess is non-empty

Then the guess is trimmed and compared case-insensitively against the secret word.

### AC-05 Scoring

Given a guess is submitted

When the trimmed lowercase guess matches the secret word exactly

Then the guesser scores 100 points.

When the trimmed lowercase guess does not match

Then the guesser scores 0 points for that attempt.

### AC-06 Synced Guess History

Given guesses have been submitted by players

When any player polls the room data

Then the full guess history (who guessed what) is visible to all players.

## Edge Cases

- Empty guess or whitespace-only guess is rejected.
- "Rocket", "ROCKET", "rocket" all count as correct.
- " rocket " (with surrounding spaces) is trimmed and matches.
- Multiple guessers can guess correctly — each gets 100 points.
- Drawer cannot submit guesses (guess form is hidden from drawer).
- A player who already guessed correctly can continue guessing (no lockout).
- All scores start at 0 when the round begins.

## Data Requirements

- Room stores a guesses array: each entry has guesser id, guesser name, guess text, and whether it was correct.
- Room stores scores per participant.
- RoomSnapshot includes the guesses list and current scores.
- Canvas is client-side only on the drawer's browser — not synced to the server.
- Scoring: correct = 100, incorrect = 0. Only the first correct guess per player scores points.

## Clarifications

### C-01 Canvas Is Drawer-Only

The canvas exists only on the drawer's screen. Guessers do not see the drawing. They guess based on the word length underscores shown from Scenario 2. Canvas data is not sent to the server or polled.

### C-02 Case-Insensitive Comparison

Comparison is done by trimming both the guess and the secret word, then converting both to lowercase before checking equality.

### C-03 Guess History

The guess history is stored on the room and returned in every room snapshot. All players see the same history via polling.

### C-04 Scoring Per Player

Each guesser gets 100 points the first time they guess the word correctly. Subsequent correct guesses by the same player do not award additional points. Incorrect guesses always award 0.

### C-05 No Round End On Correct Guess

A correct guess does not end the round. The round continues until the host or system triggers the result state (Scenario 4).

## Non-Goals

- Real-time canvas sync to guessers.
- Timer or countdown for drawing phase.
- Speed bonuses for fast guesses.
- Multiple rounds or drawer rotation.
- Guesser locking after correct answer.
- Spectator mode.
