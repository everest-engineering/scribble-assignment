# Feature Specification: Gameplay Interaction

## Description
During active gameplay, the drawer creates a visual representation on a shared canvas, and guessers submit written guesses. All guesses are synced to all players via polling. Guesses are validated (trimmed, non-empty), compared case-insensitively, and scored (100 points for correct, 0 for incorrect). The drawing and guess history are visible to all participants.

---

## User Stories

### US-11 Interactive Drawing Canvas
As the drawer,
I want to draw on an interactive canvas,
so that I can create visual representations for guessers.

### US-12 Clear Canvas
As the drawer,
I want to clear the canvas,
so that I can start over or fix mistakes.

### US-13 Canvas Visibility
As any participant,
I want to see the drawer's canvas in real-time via polling,
so that I know what is being drawn.

### US-14 Guess Submission
As a guesser,
I want to submit a guess in text form,
so that I can attempt to identify the word.

### US-15 Guess Validation
As the system,
I want to reject empty or whitespace-only guesses,
so that only valid attempts are recorded.

### US-16 Case-Insensitive Comparison
As the system,
I want to compare guesses case-insensitively,
so that "Rocket", "rocket", and "ROCKET" are all correct.

### US-17 Guess Scoring
As a guesser,
I want correct guesses to award 100 points,
so that accurate guessing is rewarded.

### US-18 Guess History Sync
As any participant,
I want to see all guesses made by all players,
so that I can follow the game progress.

---

## Acceptance Criteria

### AC-16
Canvas is interactive for the drawer and allows freehand drawing.

### AC-17
Clear button removes all canvas content.

### AC-18
Canvas updates from the drawer are synced to all guessers via polling (~2s).

### AC-19
Submitted guesses are trimmed of whitespace.

### AC-20
Empty or whitespace-only guesses are rejected with an error message.

### AC-21
Guess comparison is case-insensitive ("Rocket" == "rocket").

### AC-22
Correct guess awards 100 points to the guesser.

### AC-23
Incorrect guess awards 0 points.

### AC-24
Guess history shows all guesses with player name, message, and correctness.

### AC-25
Guess history is synced to all participants via polling.

### AC-26
Only guessers can submit guesses; drawer submission is blocked.

---

## Edge Cases

### EC-10
Drawer draws, clears multiple times, each state should sync properly.

### EC-11
Guesser submits "  " (spaces only) — should be rejected.

### EC-12
Guesser submits "RoCkEt" — should match "rocket" and score 100.

### EC-13
Multiple guesses submitted in quick succession should all appear in history.

### EC-14
Guess from incorrect guesser (wrong answer) should show in history with isCorrect: false.

### EC-15
If a guesser is also the drawer (edge case, should not happen) — drawer cannot submit guess.

---

## Data Requirements

### Canvas
- lines: string[] (serialized drawing data)
- updatedAt: timestamp

### Guess
- id (UUID)
- participantId (UUID)
- playerName (string)
- message (trimmed string, non-empty)
- isCorrect (boolean)
- createdAt (timestamp)

### Participant Score
- score (number, incremented by 100 on correct guess)

---

## Non-Goals
- Drawing bonuses or speed bonuses
- Hint system
- Undo/redo on canvas
- Canvas history or replay
- Drawing tools beyond pen/eraser
