# Quickstart: Round Results & Restart

## Prerequisites

- Install backend dependencies with `cd backend && npm install` if needed.
- Install frontend dependencies with `cd frontend && npm install` if needed.
- Complete or include the earlier lobby, round-start, and active-round play
  flows needed to create a playing room with drawings, guesses, and scores.
- Use the existing round lifecycle or test helper to transition an active round
  into ended results; timers and manual end-round controls are outside this
  feature.

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
3. Add drawing marks and submit at least one incorrect guess and one correct
   guess so the round has visible score and history data.
4. End the active round through the available round lifecycle trigger.
5. Confirm Player A and Player B both see the result view after polling.
6. Confirm both players see the correct word.
7. Confirm both players see the same final scores, including any player with 0
   points.
8. Confirm both players see the same complete valid guess history in submission
   order.
9. Refresh either browser and confirm the same result view is restored.
10. Attempt to draw, clear, or guess after the round has ended and confirm the
    action is unavailable or rejected without changing results.
11. Attempt to join the room from a third browser session while results are
    displayed and confirm the join is rejected with clear feedback.
12. Attempt to restart as Player B if Player B is not the Host and confirm the
    restart is rejected with clear feedback.
13. Restart as Player A if Player A is the Host.
14. Confirm all current players return to the lobby after polling.
15. Confirm the same players, display names, room code, and Host identity are
    preserved in the lobby.
16. Confirm prior drawings, guesses, scores, drawer assignment, and secret word
    are absent from the lobby-ready room state.
17. Confirm normal lobby joining rules apply again after restart.

## Permission Checks

1. Non-host restart from results is rejected and leaves results unchanged.
2. Host restart from results succeeds and returns the room to lobby.
3. Restart when no ended result is available is rejected with clear feedback.
4. Drawing, clearing, and guessing after round end cannot change final results.

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
