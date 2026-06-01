# Feature 003 — Gameplay Interaction

## User story

During an active round, the drawer draws on a canvas and guessers submit guesses; everyone sees synced guess history and scores update on correct answers.

## Acceptance criteria

### Canvas (drawer)

- **Given** the viewer is the drawer and status is `playing`, **When** they draw or clear the canvas, **Then** strokes update locally and sync to the server for other clients to receive on poll.

### Guesses

- **Given** a guesser submits a guess, **When** text is trimmed and non-empty, **Then** it is compared case-insensitively to the secret word.
- **Given** an empty or whitespace guess, **When** submitted, **Then** `400` and UI error.
- **Given** a correct guess, **When** processed, **Then** that guesser’s score increases by 100 and room moves to `result` (single-round lab).
- **Given** an incorrect guess, **When** processed, **Then** score unchanged (+0) and guess appears in history.

### Sync

- **Given** status is `playing` or `result`, **When** on the game screen, **Then** poll ~2s updates guesses, scores, and strokes for all participants.

### Drawer cannot guess

- **Given** the viewer is the drawer, **Then** guess form is disabled.

## Edge cases

- Multiple incorrect guesses allowed until one correct ends the round.
- Guess history order preserved (append-only).

## Out of scope

Partial stroke websockets, eraser tools beyond clear, chat.
