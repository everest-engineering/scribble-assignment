# Quickstart: Secret Word Drawer

## Prerequisites

- Node.js and npm installed
- Backend and frontend dependencies installed

## Run the app

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

3. Open the frontend in a browser and use two tabs or windows to simulate the
   drawer and a guesser.

## Manual validation checklist

1. Create a room and confirm the creator becomes the drawer for the first
   round.
2. Join the same room from a second tab and confirm both players share the
   same room snapshot.
3. Choose a starter word from the host tab and start the round.
4. Confirm the drawer sees the secret word and the second tab does not.
5. Try blank or whitespace-only player names and confirm they are rejected
   with a clear error.

## Notes

- The backend stores room state in memory, so restarting it clears active
  rooms.
- Room snapshots are expected to vary by viewer so the drawer can see the
  secret word while guessers cannot.
- The host chooses the word from the starter list before starting the round,
  which keeps the feature easy to test.
