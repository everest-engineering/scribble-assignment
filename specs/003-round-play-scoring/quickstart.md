# Quickstart: Round Play and Scoring

## Prerequisites

- Install backend dependencies with `cd backend && npm install` if needed.
- Install frontend dependencies with `cd frontend && npm install` if needed.
- Complete or include the lobby and round-start flows needed to create an active
  round with a drawer and secret word.

## Run Locally

1. Start the backend:

   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend in a second terminal:

   ```bash
   cd frontend
   npm run dev
   ```

3. Open the frontend in a browser at `http://localhost:5173`.

## Manual Validation Flow

1. Create a room as Player A and join with Player B in a second browser session.
2. Start the game so an active round exists with Player A as drawer.
3. Confirm every active-round participant starts with score 0.
4. As Player A, draw freehand marks using at least two colors and two stroke
   sizes.
5. Confirm Player A sees the marks immediately.
6. Wait for Player B to poll, then confirm Player B sees the same canvas state.
7. Clear the canvas as Player A.
8. Confirm the canvas becomes blank for both players after polling, while scores
   and guess history remain.
9. Submit an empty or whitespace-only guess as Player B and confirm clear
   feedback appears with no history entry.
10. Submit an incorrect valid guess and confirm it appears in history with no
    score change.
11. Submit a correct guess using different letter casing from the secret word.
12. Confirm Player B receives exactly 100 points and the correct guess appears in
    history.
13. Submit another correct guess as Player B and confirm no additional points are
    awarded.
14. Attempt to join the room from a new browser session after the round is
    active and confirm the join is rejected with clear feedback.

## Permission Checks

1. Attempt to draw or clear as a non-drawer.
2. Confirm the action is rejected and canvas state is unchanged.
3. Attempt to submit a scoring guess as the drawer.
4. Confirm the action is rejected and scores/history are unchanged.

## Automated Validation

Run focused tests after implementation:

```bash
cd backend
npm run test
npm run build
```

```bash
cd frontend
npm run test
npm run build
```
