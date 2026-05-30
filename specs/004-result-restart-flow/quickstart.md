# Quickstart: Scenario 4 Result State and Restart

## Prerequisites

- Node.js 18+ and npm 9+
- At least two browser tabs
- Scenario 1, Scenario 2, and Scenario 3 behavior working locally

## Run the apps

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

## Validate Scenario 4

1. Open the frontend in Tab A and create a room.
2. Join the same room from Tab B.
3. Start the game from Tab A and confirm Tab A is the drawer.
4. Submit one incorrect guess from Tab B and confirm the room stays in active
   play.
5. Submit the correct word from Tab B.
6. Confirm both tabs enter the result state within one polling cycle.
7. Confirm both tabs now show the correct word, the same final scores, and the
   full accepted guess history.
8. Confirm drawing and guess submission are no longer available in the result
   state.
9. Attempt restart from Tab B and confirm it is rejected with clear feedback.
10. Restart from Tab A and confirm both tabs return to the lobby with the same
    player roster and room code.
11. Confirm the restarted lobby no longer exposes the previous word, drawing
    state, guess history, drawer assignment, or prior scores.
12. Repeat the flow with a second room active and confirm ending or restarting
    one room does not affect the other.

## Automated checks

```bash
cd backend
npm test
npm run build
```

```bash
cd frontend
npm test
npm run build
```
