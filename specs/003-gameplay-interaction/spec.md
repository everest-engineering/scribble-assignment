# Feature Specification: Gameplay Interaction

This feature specification details the requirements, validation rules, edge cases, and acceptance criteria for drawing synchronization, guess validation, scoring, and message history sync.

## 1. Description and Goal
The goal of this feature is to enable the core gameplay loop. The designated drawer must be able to draw lines on their canvas and clear their canvas, with these actions synchronizing immediately to all other guessers. At the same time, guessers must be able to submit text guesses that are validated and matched against the secret word, scoring points on success.

## 2. Detailed Requirements

### 2.1 Interactive Drawing Canvas
* The drawer has write access to the drawing canvas. They can click/drag to draw freehand.
* The drawer has a "Clear Canvas" button that wipes the canvas.
* Guessers have read-only access to the canvas. They cannot draw or clear.
* The drawer's strokes must be serialized and sent to the server. The guesser clients poll the server and redraw the canvas content to mirror the drawer's canvas.

### 2.2 Guess Submission and Validation
* Guessers can type guesses into a text input.
* Empty guesses or guesses consisting only of whitespaces must be rejected.
* Guesses must be trimmed (strip leading/trailing whitespaces) and matched case-insensitively against the secret word. For example, if the word is "guitar", guesses of " Guitar ", "GUITAR", or "guitar" must all be marked as correct.
* The drawer cannot submit guesses.

### 2.3 Guess History & Polling Sync
* All guess submissions are stored in a chronological history list on the backend.
* Every client polls the room state (~2 seconds) and displays the guess history log.
* The guess log shows the player name, their guess, and whether it was correct or incorrect.

### 2.4 Scoring & Game Transition
* When a guesser submits a correct guess, they are awarded 100 points.
* Correct guesses update the room status to `"result"` immediately, ending the round.
* Incorrect guesses award 0 points.

## 3. Input Validation Rules & Edge Cases
* **Double Guessing**: (Edge Case) Guesses are blocked once a player has guessed the correct word.
* **Canvas Size**: The canvas rendering should adapt or be of a fixed ratio to prevent drawings from rendering differently across different screen sizes.

## 4. Acceptance Criteria
* **AC 1**: Drawer can draw, and drawings sync to guessers' screens via polling.
* **AC 2**: Clear Canvas action wipes the board on all screens.
* **AC 3**: Guess inputs are trimmed and matched case-insensitively.
* **AC 4**: Guess history log is updated and synced via polling for all players.
* **AC 5**: Correct guess awards 100 points and triggers the result state transition.
