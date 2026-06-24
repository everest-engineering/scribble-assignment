# Reflection Report

## What did the starter app already have?

The starter provided a runnable Scribble-branded shell with React Router pages for Start, Create Room, Join Room, Lobby, and Game. The backend exposed `GET /health`, `POST /rooms`, `POST /rooms/:code/join`, and `GET /rooms/:code` with in-memory room storage. Create and join flows worked for the happy path, and the lobby displayed participants with a manual refresh button. The game screen had placeholder UI for canvas, guesses, scoreboard, and results but no functional gameplay.

## What did you add?

### Spec Kit artifacts
- Discovery notes documenting starter gaps, assumptions, and relevant files
- Constitution covering engineering principles, polling-only sync, and AI usage rules
- Four feature spec/plan/tasks sets aligned to Scenarios 1–4

### Scenario 1 — Room Setup & Lobby
- Host tracking (`hostId`) assigned on room creation
- Room code validation with clear error messages
- Automatic lobby polling every ~2 seconds
- Host-only start game with 2-player minimum via `POST /rooms/:code/start`
- Fixed frontend API base URL bug (`/bug` suffix removed)

### Scenario 2 — Game Start & Drawer Flow
- Trimmed player name validation on create/join (frontend and backend)
- Drawer assignment (host becomes drawer) and deterministic secret word selection
- Viewer-specific snapshots: secret word visible only to drawer during play

### Scenario 3 — Gameplay Interaction
- Interactive SVG drawing canvas with stroke sync via polling
- Clear canvas action for drawer
- Guess submission with trim, case-insensitive matching, and synced guess history
- Correct guesses award 100 points and end the round

### Scenario 4 — Result, Restart & Final Validation
- Result panel showing revealed word, final scores, and full guess history
- Host-only restart via `POST /rooms/:code/restart` returning all players to lobby with round state cleared

## AI-assisted workflow decisions

- Worked phase-by-phase: specify → plan → tasks → implement → validate before moving on
- Kept commits granular and mapped to logical slices (artifacts, backend service, routes, frontend UI)
- Extended the starter's existing patterns (Zod validation, roomStore class, page structure) rather than rewriting
- Used HTTP polling exclusively for all multi-player sync as required by the lab constraints

## Tradeoffs

- **Stroke-based drawing over pixel canvas**: Strokes sync efficiently as JSON over REST but may produce large payloads for long drawings. Acceptable for a single-round lab scope.
- **Deterministic word from room code**: Simple and testable; same room always gets the same word, which aids debugging but is predictable if codes are reused after restart (word changes only when a new game starts with fresh assignment).
- **Polling at 2s**: Simple and within spec, but drawing and guesses can appear slightly delayed compared to real-time push (intentionally out of scope).

## Validation performed

- Backend and frontend unit tests pass (`npm test`)
- Production builds succeed (`npm run build`)
- Pre-evaluation artifact structure verified (constitution, 4 spec folders, reflection)
