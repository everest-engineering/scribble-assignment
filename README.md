# Scribble Starter

This repository is a scaffold for the Scribble lab.

It already provides:

- `frontend/`: Vite + React + TypeScript client
- `backend/`: Node.js + Express + TypeScript service
- starter routes and screens for Start, Create Room, Join Room, Lobby, and Game
- starter room API with in-memory state
- starter seed data:
  - words: `rocket`, `pizza`, `castle`, `guitar`, `sunflower`
  - roles: `drawer`, `guesser`

It does not implement the required room and gameplay features described in your lab module. Those are for learners to build in four phases.

The current UI uses Scribble branding and presentational copy, but the supported behavior is still the scaffold described in this document.

## Current Implementation

The current branch is scaffold-only.

Implemented today:

- app shell and page routing
- branded landing page and cleaned starter UI
- create room flow
- join room by code flow
- fetch room snapshot flow
- in-memory room storage on the backend
- lobby participant display from the latest fetched snapshot
- game screen placeholders for canvas, guess input, scoreboard, and results
- basic light UI styling

Not implemented yet:

- host behavior or host-only permissions
- automatic lobby polling
- start game flow
- drawer assignment
- secret word visibility rules
- drawing interaction
- clear canvas action
- guess submission and synced history
- scoring
- result state
- restart flow

## API Included In The Starter

Backend endpoints currently available:

- `GET /health`
- `POST /rooms`
- `POST /rooms/:code/join`
- `GET /rooms/:code`

The backend stores all room data in memory only. Restarting the backend clears all rooms.

## Run The Backend

```bash
cd backend
npm install
npm run dev
```

The backend runs on `http://localhost:3001`.

## Run The Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

If needed, point the frontend at a different backend with `VITE_API_URL`.

## Quick Verification

Use this to confirm the starter works from a clean clone:

1. Start the backend and confirm `http://localhost:3001/health` returns `{ "ok": true }`.
2. Start the frontend and open `http://localhost:5173`.
3. Confirm the Start screen shows `Create Room` and `Join Room`.
4. Create a room and confirm you land on the Lobby screen.
5. Open another tab, join the same room, and use the Lobby refresh button to load the latest participant list.
6. Open the Game screen and confirm the canvas, guess input, scoreboard, and result areas are placeholders only.
7. Treat any start-page marketing copy as presentational only; use this README for actual supported scope.

## What Learners Build In Four Phases

The required work follows the four feature groups described in your lab module.

### Phase 1: Room Setup And Lobby

Learners implement:

- `R1` Create room with automatic host join
- `R2` Join room validation and clear errors
- `R3` Multi-room isolation
- `R4` Lobby polling with refresh within about 2 seconds
- `R5` Host-only start game with minimum 2 players

Expected outcome:

- room lifecycle works correctly
- lobby updates automatically
- host gating exists

### Phase 2: Game Start And Drawer Flow

Learners implement:

- `G1` Player name validation
- `G2` Drawer assignment
- `G3` Deterministic secret word selection from the starter list
- `G4` Drawer-only word visibility

Expected outcome:

- game start produces a valid drawer and word
- only the drawer can see the secret word

### Phase 3: Gameplay Interaction

Learners implement:

- `G5` Local drawing on canvas
- `G6` Clear canvas
- `G7` Guess submission
- `G8` Synced guess history through polling
- `G9` Deterministic scoring

Expected outcome:

- drawer can draw
- guesses can be submitted and observed by all clients
- score updates match the assignment rules

### Phase 4: Result, Restart, And Final Validation

Learners implement:

- `G10` Shared result state
- `G11` Restart flow back to lobby with preserved players and cleared round state

Expected outcome:

- all clients see the round result
- host can restart cleanly
- validation evidence is complete

## Explicitly Out Of Scope

These should stay out of the learner implementation because the lab module marks them out of scope:

- WebSockets or live stroke broadcast
- databases or persistent storage
- authentication or accounts
- deployment, CI, or Docker work
- multiple rounds
- drawer rotation
- timers or countdowns
- speed or drawer bonus scoring
- custom or random word packs
- spectator mode
- moderation features
- room passwords or invite links

## Build Validation

Run both builds before handing off changes:

```bash
cd backend
npm run build
```

```bash
cd frontend
npm run build
```

## Troubleshooting

- If the frontend cannot reach the backend, verify the backend is running on port `3001`.
- If the backend port is already in use, run `PORT=<new-port> npm run dev`.
- If local commands are missing, rerun `npm install` in the relevant app directory.
