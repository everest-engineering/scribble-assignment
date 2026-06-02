# Reflection Report

## What did the starter app already have?

The starter provided a runnable monorepo with:

- **Backend**: Express API with three endpoints (`POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`), in-memory room storage via a `Map`, Zod schemas for basic validation, and seed data (5 words, 2 roles).
- **Frontend**: Vite + React + TypeScript with five routes (Start, Create Room, Join Room, Lobby, Game), a custom `RoomStore` using React Context, and placeholder UI for canvas, guess input, scoreboard, and results.
- **Working flows**: Create room, join by code, manual lobby refresh, and client-side navigation to a static game page.

## What did you add?

### Spec Kit Artifacts
- `.specify/memory/constitution.md` — engineering principles, AI usage rules, review discipline
- `specs/000-discovery/notes.md` — gaps, assumptions, relevant files
- Four feature folders (`001`–`004`) each with `spec.md`, `plan.md`, and `tasks.md`

### Backend
- Extended state model: `hostId`, `drawerId`, `secretWord`, `strokes`, `guesses`, `scores`, and `RoomStatus` (`lobby` | `playing` | `result`)
- New endpoints: start, strokes, clear, guess, restart
- Viewer-aware snapshots (secret word for drawer only; revealed word for all in result)
- Deterministic word selection via room code hash
- Input validation: trimmed names, room code format, authorization checks

### Frontend
- Fixed API base URL bug (`/bug` → `http://localhost:3001`)
- `useRoomPolling` hook (~2s interval) on lobby and game pages
- Host-only start with 2-player minimum; host badge in lobby
- `DrawingCanvas` component with stroke sync via polling
- Wired guess form, live scoreboard, and result panel with restart
- Role-based game UI (drawer vs guesser vs result)

## AI Usage Decisions and Tradeoffs

- **Spec-before-code**: Each feature group was specified, planned, and task-listed before implementation to keep commits traceable.
- **Stroke-based canvas**: Chose storing stroke arrays over bitmap images — simpler to sync via JSON polling, no image encoding overhead, easy to clear/redraw.
- **Deterministic word via hash**: Ensures reproducibility for testing and avoids server-side randomness beyond room code generation.
- **Silent polling**: Lobby/game polls use silent fetch to avoid loading spinners every 2 seconds; manual actions still show loading state.
- **Known limitation**: Page refresh loses session (no persistence per lab scope).

## Spec Deviations

None. Implementation follows the four business scenarios and out-of-scope boundaries.
