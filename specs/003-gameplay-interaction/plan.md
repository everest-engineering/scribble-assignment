# Plan 003 — Gameplay Interaction

## State model

`Round` fields declared earlier are now actively written:
```
Round {
  drawerId, word,
  strokes: Stroke[]    // replaced wholesale on each canvas PUT (clear = [])
  guesses: Guess[]     // appended per accepted guess
  winnerId: string|null // set to the first correct guesser
}
Stroke { color: string, width: number, points: {x,y}[] }
Guess  { id, participantId, playerName, text, correct, createdAt }
```
A correct guess: `participant.score += 100`, `round.winnerId = participantId`,
`room.status = "results"`.

## Data flow

```
Drawer draws → DrawingCanvas commits strokes → store.updateCanvas
            → PUT /rooms/:code/canvas → round.strokes = strokes
Guesser polls (2s) → snapshot.strokes → DrawingCanvas renders (read-only)
Guesser guesses → GuessForm → store.submitGuess
            → POST /rooms/:code/guesses → validate, score, maybe end round
All poll (2s) → snapshot.guesses + participant scores → history + scoreboard
```
Authority: the server validates drawer-only canvas writes, drawer-cannot-guess,
empty-guess rejection, and scoring. The client mirrors validation for UX only.

## File-level plan

Backend:
- `api/schemas.ts` — `strokeSchema` (color/width/points), `canvasUpdateSchema`
  `{ participantId, strokes }`, `guessSchema` `{ participantId, text(trim,nonempty) }`.
- `services/roomStore.ts` — `updateCanvas(code, participantId, strokes)` (drawer +
  active-round guards) and `submitGuess(code, participantId, text)` (guesser guard,
  case-insensitive compare, scoring, round end).
- `api/rooms.ts` — `PUT /:code/canvas`, `POST /:code/guesses`.

Frontend:
- `services/api.ts` — `updateCanvas(code, participantId, strokes)`,
  `submitGuess(code, participantId, text)`.
- `state/roomStore.ts` — `updateCanvas`, `clearCanvas`, `submitGuess` actions.
- `components/DrawingCanvas.tsx` (new) — interactive canvas for the drawer (pointer
  strokes + commit on stroke-end), read-only render for guessers.
- `components/GuessForm.tsx` — trim, block empty, call `submitGuess`; disabled for
  the drawer.
- `components/Scoreboard.tsx` — render participants + live scores, drawer marker.
- `components/GuessHistory.tsx` (new) — render synced guesses (correct highlighted).
- `pages/GamePage.tsx` — wire canvas (+clear for drawer), guess form, scoreboard,
  guess history.

## Testing strategy

- Backend unit tests:
  - `submitGuess`: empty rejected; case-insensitive correct scores 100 + ends round;
    incorrect adds 0; drawer cannot guess; guessing after end → 409.
  - `updateCanvas`: non-drawer rejected; drawer replaces strokes; clear empties.
- Manual two-tab: drawer draws → guesser sees it; clear works; guesser guesses
  wrong then right; scoreboard + history update on both tabs.

## Risks / mitigations

- **Polling overwriting the drawer's in-progress drawing:** the canvas keeps the
  drawer's strokes as local authority and only follows synced strokes for
  guessers; the drawer commits on stroke-end.
- **Double scoring / race on the winning guess:** the round ends (status→results)
  on the first correct guess; subsequent guesses hit the active-round guard (409).
- **Coordinate drift across screen sizes:** strokes are stored in the canvas's
  fixed logical coordinate space and scaled on render, so guessers see the same
  drawing regardless of element size.
