# Plan — Feature Group 3 (Gameplay Interaction)

Extends the Group 2 room with guesses and per-player scores. Drawing stays
client-side. No new dependencies.

## State model changes

Backend (`backend/src/models/game.ts`)
- `Participant` gains `score: number` (0 on creation).
- New `Guess`: `{ id, participantId, playerName, text, correct, createdAt }`.
- `Room` gains `guesses: Guess[]` (empty on creation).
- `RoomSnapshot` gains `guesses: Guess[]`; participants carry `score`.

Frontend (`frontend/src/services/api.ts`)
- Mirror `score` on `Participant`, add the `Guess` type, add `guesses` to
  `RoomSnapshot`.

## Data flow

1. Guess: `POST /rooms/:code/guess` with `{ participantId, text }`. The service
   checks the room is `playing`, the sender is a participant and not the drawer,
   trims the text, compares case-insensitively to `secretWord`, appends a `Guess`,
   and awards 100 on a correct guess.
2. Sync: `GamePage` polls `fetchRoom()` ~2s; the snapshot carries the latest
   `guesses` and participant `score`s, so the scoreboard and history converge.
3. Canvas: a `DrawingCanvas` component renders an interactive `<canvas>` for the
   drawer (mouse strokes) with a clear button; entirely local state.

## File-level changes

Backend
- `models/game.ts` — add `score`, `Guess`, `guesses`.
- `services/roomStore.ts` — init `score: 0` and `guesses: []`; add
  `submitGuess(code, participantId, text)`; include `guesses` in `toRoomSnapshot`.
- `api/schemas.ts` — `guessSchema` (`participantId`, trimmed non-empty `text`).
- `api/rooms.ts` — `POST /:code/guess` route with error mapping.
- `services/roomStore.test.ts` — correct/incorrect scoring, drawer-cannot-guess,
  not-playing rejection, history accumulation.

Frontend
- `services/api.ts` — types + `submitGuess(code, id, text)`.
- `state/roomStore.ts` — `submitGuess` action.
- `components/DrawingCanvas.tsx` (new) — interactive canvas + clear (drawer only).
- `components/GuessForm.tsx` — wire to a submit handler; trim + empty guard +
  error display; disabled for the drawer.
- `components/Scoreboard.tsx` — render participants + scores from props.
- `components/ResultPanel.tsx` — render the synced guess history (the "Activity"
  card).
- `pages/GamePage.tsx` — ~2s polling; show canvas (drawer) / placeholder
  (guesser); wire guess submit; pass data to Scoreboard and history.

## Testing strategy

- Unit: `submitGuess` scoring (100 correct / 0 incorrect, case-insensitive +
  trim), drawer rejection, not-playing rejection, history order.
- Manual (two tabs): AC5 history sync and AC6 scoreboard.

## Risks / mitigations

- Word leaking via history text → acceptable in this group (round does not end);
  Group 4 ends the round on a correct guess. Documented as a design decision.
- Canvas redraw/polling interplay → canvas is local state, untouched by polling;
  only history/scores update from the snapshot.
- Score double-awarding → award only when a guess flips to correct; covered by a
  test.
