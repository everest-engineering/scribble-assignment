# Quickstart: Scribble Game Completion

## Prerequisites

- Node.js 18+
- npm 9+
- Two browser tabs for manual multiplayer validation

## Install

```bash
cd backend
npm install
cd ../frontend
npm install
```

## Run Backend

```bash
cd backend
npm run dev
```

Expected:

- Backend listens on `http://localhost:3001`
- `GET http://localhost:3001/health` returns `{ "ok": true }`

## Run Frontend

```bash
cd frontend
npm run dev
```

Expected:

- Frontend listens on `http://localhost:5173`
- Frontend uses the local backend URL

## Automated Checks

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

## Manual Two-Browser Validation

1. Open frontend in tab 1.
2. Create a room as `Alice`.
3. Confirm Alice is shown as host in the lobby.
4. Open frontend in tab 2.
5. Join the same room as `Bob`.
6. Confirm both tabs show both players within about 2 seconds.
7. Confirm Bob cannot start the game.
8. Confirm Alice can start once Bob has joined.
9. Confirm Alice is the drawer and sees the secret word.
10. Confirm Bob is a guesser and does not see the secret word.
11. Draw from Alice's tab and confirm Bob sees drawing after polling.
12. Clear drawing from Alice's tab and confirm Bob sees the cleared state.
13. Submit an empty guess from Bob and confirm clear feedback.
14. Submit an incorrect guess and confirm history updates with 0 points.
15. Submit `ROCKET` from Bob and confirm the round moves to result state with 100 points.
16. Confirm both tabs show correct word, scores, and guess history.
17. Confirm Bob cannot restart.
18. Restart from Alice's tab.
19. Confirm both tabs return to lobby, players remain, and round state is cleared.

## Validation Notes

Record final validation notes in a markdown reflection/report file before PR
submission.

