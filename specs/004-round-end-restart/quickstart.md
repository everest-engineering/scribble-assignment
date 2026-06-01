# Quickstart: Round End and Restart

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

1. Create a room from the start page and join it from a second tab.
2. Start a round as the host.
3. Submit guesses from the guesser until one guess is correct.
4. Confirm every viewer switches into the end-of-round summary.
5. Confirm the correct word, full guess history, and final scores are visible
   to all players.
6. Try submitting another guess or drawing after the round ends and confirm the
   room does not change.
7. Restart the game as the host and confirm everyone returns to the lobby with
   the same player list preserved.
8. Confirm the round-specific data is cleared after restart.

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

- The first correct guess ends the round immediately.
- All players can see the correct word, final scores, and guess history after
  the round ends.
- Only the host can restart the room.
- Restart returns everyone to the lobby while preserving participants and
  clearing the previous round state.
