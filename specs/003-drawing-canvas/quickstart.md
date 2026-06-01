# Quickstart: Drawing Canvas and Guess Scoring

## Prerequisites

- Node.js installed locally
- Backend and frontend dependencies installed with `npm install` in each app

## Run the apps

1. Start the backend:

```bash
cd backend
npm run dev
```

2. Start the frontend:

```bash
cd frontend
npm run dev
```

## Manual verification flow

1. Create a room from the start page.
2. Join the room from a second tab or browser window.
3. Start the round as the drawer.
4. Confirm the drawer can see the canvas controls and that the guess field is
   hidden for the drawer.
5. Draw on the canvas and then clear it.
6. Submit guesses from a guesser, including:
   - an empty guess
   - a guess with extra spaces
   - a mixed-case guess
7. Confirm the guess history updates for both viewers after polling.
8. Confirm correct guesses award 100 points and incorrect guesses award 0
   points.

## Test commands

```bash
cd backend
npm test
```

```bash
cd frontend
npm test
```

## Expected result

- The drawer can draw and clear the canvas during an active round.
- The drawer does not see the guess input.
- Guessers can submit trimmed, case-insensitive guesses.
- Empty guesses are rejected.
- Guess history and scores stay synchronized across viewers through polling.
