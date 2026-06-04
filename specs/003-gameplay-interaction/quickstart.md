# Quickstart

## Prerequisites

- Node.js installed.
- Backend and frontend dependencies installed in their respective folders.

## Run

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

## Validate the feature

1. Open the app in two browser tabs.
2. Create a room in tab A and join the same room in tab B.
3. Start the game from the host tab.
4. Confirm the drawer sees the secret word and the guesser does not.
5. Draw a stroke as the drawer.
6. Wait for one polling cycle and confirm the guesser sees the same stroke on the canvas.
7. Submit an incorrect guess from the guesser.
8. Confirm the guess appears in the shared guess history on both tabs and the score does not change.
9. Submit the correct guess from the guesser.
10. Confirm the guess appears in the history on both tabs, the score increases by exactly 100, and the guesser cannot submit again.

## Expected results

- Drawing state stays synchronized through polling.
- Guess history shows only server-accepted guesses.
- Scores update on the next poll and remain visible on the scoreboard.
- Empty guesses are blocked client-side and validated server-side.

## Useful checks

- `cd backend && npm test`
- `cd frontend && npm test`
