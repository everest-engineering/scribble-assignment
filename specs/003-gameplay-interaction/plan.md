# Plan 003 — Gameplay Interaction

## State model

- `Room.guesses: Guess[]` with `{ id, participantId, playerName, text, correct, createdAt }`
- `Room.strokes: DrawingStroke[]` with point arrays
- End round: on correct guess set `status = "result"` and expose `correctWord` to all in snapshot

## API

- `POST /rooms/:code/guesses` body `{ text }` — guesser only, playing only
- `PUT /rooms/:code/drawing` body `{ strokes }` — drawer only
- `DELETE /rooms/:code/drawing` — drawer clears strokes

## Frontend

- `DrawingCanvas.tsx` — HTML canvas, pointer events, debounced PUT
- `GuessForm` — calls store `submitGuess`
- `Scoreboard` — maps participants with scores
- `ResultPanel` — lists guesses (during play); full history in result phase
- `GamePage` — polling interval, role-based layout

## Testing

- roomStore: correct guess +100, wrong +0, case insensitive, empty rejected
- Drawer PUT rejected for guesser

## Risks

Large stroke payloads — acceptable for lab; clear resets array.
