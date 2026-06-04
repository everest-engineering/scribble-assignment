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
3. Start the round from the host tab.
4. Play until a correct guess ends the round.
5. Confirm both tabs show the result screen with the revealed secret word, final scores, and full guess history.
6. Click Restart or Play Again from the host tab.
7. Wait for one polling cycle and confirm both tabs return to the lobby.
8. Confirm the same participants are still present and no one had to re-enter a name or room code.
9. Confirm drawing, guess history, current word, current drawer, and scores were cleared for the next round.

## Expected results

- The result state is shared across all connected players.
- The host is the only player who can restart the room.
- Restart preserves the room and participant list while clearing round-specific state.
- The lobby after restart is clean, with scores reset to `0`.

## Useful checks

- `cd backend && npm test`
- `cd frontend && npm test`
