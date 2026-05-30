# Quickstart: Scenario 3 Gameplay Interaction

## Prerequisites

- Node.js 18+ and npm 9+
- At least two browser tabs
- Scenario 1 room flow and Scenario 2 round-start behavior working locally

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

## Validate Scenario 3

1. Open the frontend in Tab A and create a room.
2. Join the same room from Tab B.
3. Start the game from Tab A and confirm Tab A is the drawer.
4. Draw on the shared surface in Tab A and confirm Tab B sees the same drawing
   within one polling cycle.
5. Attempt to draw from Tab B and confirm the shared canvas does not change.
6. Clear the canvas from Tab A and confirm both tabs return to an empty canvas.
7. Submit a whitespace-only guess from Tab B and confirm it is rejected with a
   clear validation message.
8. Submit an incorrect trimmed guess from Tab B and confirm it appears once in
   shared history with `0` points.
9. Submit the correct word from Tab B using different letter casing than the
   drawer sees in Tab A.
10. Confirm the guess is treated as correct, appears in shared history, and
    awards `100` points.
11. Refresh or wait for polling in both tabs and confirm canvas state, guess
    history, and score totals stay aligned.
12. Repeat the same flow in a second room and confirm drawing, history, and
    scores remain isolated by room.

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
