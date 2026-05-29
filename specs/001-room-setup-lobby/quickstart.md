# Quickstart: Room Setup and Lobby

Manual acceptance test walkthrough for Scenario 001.

## Prerequisites

- Node.js 18+ (see `.nvmrc`)
- Two browser windows/tabs

## Start the servers

```bash
# Terminal 1 — backend
cd backend && npm install && npm run dev

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

Backend runs on `http://localhost:3001`.
Frontend runs on `http://localhost:5173`.

## Acceptance test: two-tab walkthrough

### Tab A — Create a room

1. Open `http://localhost:5173` in Tab A.
2. Click **Create Room**.
3. Enter a name (e.g., `Alice`) and submit.
4. **Expected**: Lobby screen loads. A 4-character uppercase room code is displayed. Alice appears in the participant list. A **Start Game** button is visible.

### Tab B — Join the room

5. Open `http://localhost:5173` in Tab B.
6. Click **Join Room**.
7. Enter the room code shown in Tab A (any case — e.g., `ab3x` or `AB3X`).
8. Enter a name (e.g., `Bob`) and submit.
9. **Expected**: Tab B shows the lobby. Both Alice and Bob are listed. No **Start Game** button is visible for Bob.

### Live polling check

10. **Expected (without refreshing)**: Within ~4 seconds of step 8, Tab A shows Bob in the participant list.

### Start Game

11. In Tab A, click **Start Game**.
12. **Expected**: Both tabs transition away from the lobby screen.

## Validation checks

| Check | Expected result |
|-------|----------------|
| Submit empty name on create | Error message shown; no redirect |
| Submit empty code on join | Client-side error; no server call |
| Submit code with symbols (e.g., `AB!3`) | Client-side error; no server call |
| Submit unknown code (e.g., `ZZZZ`) | "Room not found" message |
| Click Start Game with only 1 player | Button disabled or error; game does not start |
| Join a room after game started (via Join form) | "Game already in progress" message |

## Run automated tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

Both must pass with zero failures before any commit.
