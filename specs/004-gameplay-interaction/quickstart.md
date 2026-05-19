# Quickstart: Phase 3 Gameplay Interaction

## Prerequisites

- Install dependencies in both apps.
- Use branch `004-gameplay-interaction`.

## Start the backend

```bash
cd backend
npm run dev
```

Backend expected URL: `http://localhost:3001`

## Start the frontend

```bash
cd frontend
npm run dev
```

Frontend expected URL: `http://localhost:5173`

## Manual Validation Flow

### Story 1: Drawer can draw and clear locally

1. Open the app in two browser sessions and create a room from the first session.
2. Join the same room from the second session.
3. Start the game as the host from the first session.
   Expected: both sessions enter `/game`; the host is the drawer.
4. In the drawer session, draw visible marks on the canvas.
   Expected: marks appear locally for the drawer.
5. In the guesser session, inspect the canvas area.
   Expected: no drawing interaction is available there.
6. In the drawer session, clear the canvas.
   Expected: all local marks disappear; scores and guess history remain unchanged.

### Story 2: Guesses validate and sync

1. In the guesser session, submit a blank or whitespace-only guess.
   Expected: a clear validation message appears and no guess is recorded.
2. Submit a guess with surrounding spaces, such as `  tree  `.
   Expected: the stored guess appears trimmed as `tree`.
3. Wait up to 2 seconds in the drawer session.
   Expected: the new guess appears in shared activity/history there as well.
4. Submit one or more incorrect guesses.
   Expected: scores remain `0` for all players and the room stays in `playing`.

### Story 3: First correct guess ends the round

1. In the guesser session, submit the secret word with a different letter case.
   Expected: the backend still accepts it as correct.
2. Confirm the winning guesser score becomes `100`.
3. Confirm the room leaves `playing` and moves into `result`.
4. Refresh the drawer and guesser sessions.
   Expected: both still show the same winner, final scores, and ended-round status.
5. Confirm the guesser still does not receive the drawer's secret word in the UI.

### Isolation check

1. Create and play a second room in another browser pair.
   Expected: guess history, winner identity, and scores from room A never appear in
   room B, and vice versa.

## Build Validation

```bash
cd backend
npm run build
```

```bash
cd frontend
npm run build
```
