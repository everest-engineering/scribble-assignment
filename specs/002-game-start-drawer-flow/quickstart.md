# Quickstart: Game Start & Drawer Flow

## Prerequisites

- Backend dependencies installed in `backend/`
- Frontend dependencies installed in `frontend/`
- Scenario 1 lobby behavior available

## Test-First Implementation Flow

1. Add backend tests for:
   - whitespace-only names are rejected and trimmed names are stored
   - non-host cannot start a room
   - host cannot start with fewer than two players
   - host starts first round and becomes drawer
   - first round secret word is `rocket`
   - drawer snapshot includes `secretWord`
   - guesser snapshot omits `secretWord`

2. Add frontend tests for:
   - API service sends `POST /rooms/:code/start`
   - room store updates state after start
   - lobby start action shows backend errors and stays in lobby
   - game page shows drawer name to all players
   - game page shows secret word only to drawer

3. Implement backend model, schema, service, and route changes.

4. Implement frontend API, store, lobby, and game page changes.

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

1. Start backend:

```bash
cd backend
npm run dev
```

2. Start frontend:

```bash
cd frontend
npm run dev
```

3. Open two browser tabs at `http://localhost:5173`.

4. In tab 1, create a room as `Alice`.

5. In tab 2, join the same room as `Bob`.

6. In tab 1, start the game.

7. Confirm both tabs move into or can view the active game state after polling.

8. Confirm `Alice` is clearly identified as the drawer in both tabs.

9. Confirm only Alice sees the word `rocket`.

10. Confirm Bob does not see `rocket`.

## Expected Scope Boundaries

- No drawing behavior is required yet.
- No guess submission is required yet.
- No scoring is required yet.
- No result or restart flow is required yet.
- No WebSockets, databases, authentication, or new top-level dependencies are allowed.
