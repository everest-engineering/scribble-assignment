# Project Reflection — Scribble Assignment

## Overview

This project started from a deliberately incomplete brownfield scaffold for a multiplayer drawing-and-guessing game. Four feature specs were written and implemented incrementally using Spec Kit, each building on the one before it.

---

## What the Starter App Already Had

### Backend

- In-memory room store (`Map<string, Room>`) with structural cloning to prevent mutation
- Three API routes: `POST /api/rooms` (create), `POST /api/rooms/:code/join`, `GET /api/rooms/:code`
- Zod validation on all request bodies; centralised `HttpError` + error handler in `router.ts`
- Seed data: 5 words (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) and 2 roles (`drawer`, `guesser`)
- Unique 4-character room code generation (ambiguous characters excluded, collision-safe)
- `RoomStatus` typed only as `"lobby"` — no `"playing"` or `"ended"` states
- `toRoomSnapshot` accepted a `viewerParticipantId` argument but immediately discarded it (`void viewerParticipantId`)

### Frontend

- React Router v6 route tree with five pages: Start, Create Room, Join Room, Lobby, Game
- Create-room and join-room flows that called the API and navigated to `/lobby`
- Lobby page with participant list and a **manual** "Refresh Room" button (no polling)
- Observable `RoomStore` class using `useSyncExternalStore` + React context
- Typed `fetch` wrapper (`api.ts`) with generics and JSON error extraction
- Shared presentational components: `AppShell`, `PageHeader`, `Card`, `RoomCodeBadge`
- `GamePage` was an empty layout shell — canvas was a static `<div>`, `GuessForm.handleSubmit` was a no-op, `Scoreboard` showed hardcoded zeroes, `ResultPanel` was a placeholder

### Known Starter Bug

`frontend/src/services/api.ts` had a deliberate defect in the fallback API base URL:

```ts
const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3001/bug";
```

Every API call would hit `/bug/rooms/…` unless `VITE_API_URL` was set in a `.env` file. This was fixed as part of Spec 001.

---

## What Was Added via Specs and Tasks

### Spec 001 — Room Setup & Lobby

**Goal**: Formalise the host concept, add input validation on the frontend, wire automatic lobby polling, and gate the "Start Game" button.

- Added `hostId` field to the `Room` model; creator is always the first host
- Frontend form validation — empty/whitespace-only names and codes now show inline errors before any API call is made
- Replaced the manual refresh button with a `setInterval`-based poll (~2 s) that clears on unmount
- "Start Game" button rendered only for the host and gated behind a minimum of 2 participants
- Join requests to a room in `"playing"` status now return a clear error ("Game already in progress")

### Spec 002 — Game Start & Drawer Flow

**Goal**: Implement the actual game-start transition, deterministic word selection, role assignment, and per-viewer word masking.

- Added `"playing"` to `RoomStatus`; added `currentDrawerId`, `currentWord`, and `roundNumber` to `Room`
- `POST /api/rooms/:code/start` endpoint: validates host, ≥2 participants, room is in lobby; sets `currentDrawerId = hostId`, selects word deterministically (`words[(roundNumber - 1) % words.length]`), sets `roundNumber = 1`
- `toRoomSnapshot` now uses `viewerParticipantId`: `currentWord` is only included in the response when the viewer is the drawer; guessers receive `null`
- Frontend `GamePage` updated to show participant list with Drawer/Guesser labels; drawer sees the secret word, guessers see a "word chosen" placeholder
- Poll on `GamePage` drives automatic navigation once status changes

### Spec 003 — Gameplay Interaction

**Goal**: Build the interactive drawing canvas, implement guess submission with scoring, and sync the full game state to all players.

- Added `strokes: CanvasState`, `guesses: Guess[]`, and `scores: Record<string, number>` to the `Room` model
- `POST /api/rooms/:code/guess`: trims and case-insensitively compares the submitted word to `currentWord`; awards 100 points on a correct guess, 0 on incorrect; appends the guess to `room.guesses`
- `POST /api/rooms/:code/strokes`: replaces the full canvas state server-side
- `DrawingCanvas` component wired with mouse-event handlers for freehand drawing; canvas is read-only for guessers
- "Clear Canvas" action resets strokes both locally and on the server
- `GuessForm` now actually submits; correct/incorrect feedback displayed immediately without waiting for the next poll
- `Scoreboard` renders live participant scores; `ResultPanel` shows the chronological guess history, all sourced from the polled room snapshot

### Spec 004 — Result, Restart & Final Validation

**Goal**: Close the game loop — end-of-round transitions, the result screen, and a host-driven restart that returns everyone to the lobby.

- Added `"ended"` to `RoomStatus` and `revealedWord` to `Room` / `RoomSnapshot`
- `POST /api/rooms/:code/end`: host-only action (403 for non-host, 409 if not playing); sets `status = "ended"` and `revealedWord = currentWord`
- `submitGuess` auto-ends the round on the first correct answer — same state transition without manual intervention
- `ResultPage` added: displays the revealed word, full guess history with submitter names and correct/incorrect indicators, and a ranked scoreboard
- Poll on `GamePage` detects `status === "ended"` and auto-navigates all participants to `/result` within one polling interval
- `POST /api/rooms/:code/restart`: host-only (403/409 guards); resets `status → "lobby"`, clears `strokes`, `guesses`, `revealedWord`, `currentWord`, `currentDrawerId`, `roundNumber`; resets all scores to zero while preserving participants
- Poll on `ResultPage` detects `status === "lobby"` and auto-navigates everyone back to `LobbyPage`
- "Restart Game" and "End Round" buttons are visible only to the host

---

## Overall Arc

| Stage          | What changed                                                      |
| -------------- | ----------------------------------------------------------------- |
| Starter        | Routing, room CRUD, manual lobby refresh — no real game mechanics |
| After Spec 001 | Validated input, auto-polling lobby, host gating                  |
| After Spec 002 | Real game start, role assignment, secret word masking             |
| After Spec 003 | Interactive canvas, functional guessing, live scoreboard          |
| After Spec 004 | End-of-round result screen, restart loop, full game cycle         |

The starter provided the skeleton — data flow, API shape, and page layout — but almost every meaningful gameplay behaviour was absent. The four specs progressively filled in the game model, server logic, and frontend interactivity until a complete one-shot multiplayer game loop was working end-to-end.
