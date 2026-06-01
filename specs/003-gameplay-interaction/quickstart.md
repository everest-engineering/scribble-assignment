# Quickstart: Gameplay Interaction

## Prerequisites

- Backend dependencies installed in `backend/`
- Frontend dependencies installed in `frontend/`
- Scenario 2 game start and drawer flow implemented
- A working local backend on `http://localhost:3001` and frontend on `http://localhost:5173`

## Test-First Implementation Flow

1. Add backend tests for:
   - whitespace-only guesses are rejected
   - guesses are trimmed before evaluation
   - guess comparison is case-insensitive
   - correct guesses score `100`
   - incorrect guesses score `0`
   - guess history is appended and returned in the active round snapshot
   - guesses cannot be submitted when the room is not in progress

2. Add frontend tests for:
   - `GuessForm` validation rejects empty or whitespace-only submissions
   - API service sends `POST /rooms/:code/guesses` with `participantId` and normalized text
   - room store updates `guessHistory` after a successful guess
   - the game page displays new guesses within one polling cycle
   - the drawer can clear the local canvas and continue drawing

3. Implement backend changes:
   - add request validation and scoring logic for guesses
   - append validated guesses to `currentRound.guessHistory`
   - return viewer-safe room snapshots after guess submission

4. Implement frontend changes:
   - extend `GuessForm` to submit guesses and display validation errors
   - preserve the canvas placeholder for drawer interaction and clear actions in the UI
   - ensure room polling refreshes the shared `guessHistory`
   - update `GamePage` to render guess history and current round status

5. Run validation:

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

3. Open two browser tabs at `http://localhost:5173`.

4. In tab 1, create a room as `Alice`.

5. In tab 2, join the same room as `Bob`.

6. In tab 1, start the game.

7. Confirm both tabs see the active round after polling.

8. Confirm the drawer can interact with the local canvas and clear it.

9. In tab 2, submit a whitespace-only guess and confirm it is rejected.

10. In tab 2, submit a trimmed guess matching `rocket` and confirm it is scored as correct.

11. Confirm guess history appears in both tabs within one polling update.

## Expected Scope Boundaries

- No backend canvas stroke persistence is required yet.
- The drawer's canvas is local to the drawer's screen in this scenario.
- No multiplayer drawing sync beyond the drawer's local UI is required.
- No result screen or restart flow is required.
- No WebSockets, database storage, or authentication are allowed.
