# Reflection — Scribble Lab

## What did the starter app already have?

The starter provided a runnable React + Express scaffold with routing across Start, Create Room, Join Room, Lobby, and Game screens. The backend exposed `POST /rooms`, `POST /rooms/:code/join`, and `GET /rooms/:code` with an in-memory room store. Players could create a room, join by code, and manually refresh the lobby participant list. The game screen had placeholder UI for canvas, guesses, scoreboard, and results but no functional gameplay.

## What did you add?

I added Spec Kit artifacts (constitution, four feature spec/plan/task groups, discovery notes) and implemented all four business scenarios:

1. **Room & lobby** — Host tracking, name/code validation, ~2s lobby polling, host-only start with 2-player minimum.
2. **Game start** — Deterministic secret word selection, drawer assignment (host), viewer-specific word visibility.
3. **Gameplay** — HTML5 drawing canvas with stroke sync, clear canvas, guess submission with case-insensitive scoring (+100 correct), synced guess history via polling.
4. **Result & restart** — Shared result state for all players, host restart back to lobby with round state cleared and participants preserved.

Backend changes extended the room model and added five new endpoints (`start`, `strokes`, `clear`, `guess`, `restart`). Frontend changes added `useRoomPolling`, `DrawingCanvas`, and wired all pages to the API.

## Spec Kit workflow

Each feature group followed specify → plan → tasks → implement → validate. The constitution constrained scope (no WebSockets, no DB, polling-only sync). Commits map to individual tasks — artifacts were written before or alongside their corresponding implementation slice.

## AI-assisted workflow

Cursor/AI helped explore the starter quickly and draft initial artifact structure. I manually reviewed and adjusted:

- **Word selection algorithm** — Chose stable hash of room code modulo word list length for determinism.
- **Stroke model** — Normalized 0–1 coordinates so canvas renders consistently across screen sizes; strokes POST on pointer-up to limit request volume.
- **Viewer filtering** — Kept secret-word filtering on the backend in `toRoomSnapshot`, not the frontend, so guessers cannot inspect network responses for the answer during play.

## Tradeoffs

- Polling at 2s introduces visible latency for strokes and guesses but matches lab constraints and keeps implementation simple.
- Single stroke POST per drag gesture balances sync fidelity with request count.
- Host-always-drawer simplifies role logic for a single-round game.

## What I would do differently

Add a lightweight integration test script that simulates two-player API flows end-to-end, reducing reliance on manual two-tab testing alone.
