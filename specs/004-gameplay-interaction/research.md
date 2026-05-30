# Research: Gameplay Interaction

**Phase 0 output** | **Date**: 2026-05-30

## Overview

All spec ambiguities were resolved during the `/speckit.clarify` session (4 questions answered). No `NEEDS CLARIFICATION` markers remain. This document consolidates the decisions and existing codebase patterns that inform the design.

## Clarification Decisions

| Decision | Resolution | Rationale |
|----------|-----------|-----------|
| Guess submission rate limiting | No limits — guessers can submit as fast as they want | Spec explicitly chosen |
| Incorrect guess feedback | Added to public history marked as incorrect, no additional indicator | Keeps UI simple while confirming receipt |
| Guess identity in history | Guesser's name shown alongside each guess | Standard drawing game pattern; enables social awareness |
| Duplicate guess text | Accept duplicates — each submission processed independently | Avoids complex deduplication logic |

## Existing Patterns & Dependencies

### Backend: game.ts models

Current types include `RoomStatus`, `Participant`, `Round` (with `roundNumber`, `drawerId`, `word`), `Room`, and `RoomSnapshot`. No canvas or guess state exists yet — `Round` must be extended with `strokes` and `guesses`. The `RoomSnapshot` must be extended with `strokes`, `guesses`, and scores.

### Backend: roomStore.ts

- Rooms stored in `Map<string, Room>`; snapshots via `structuredClone` via `toRoomSnapshot(room, viewerParticipantId?)`
- `startGame` already assigns host as drawer for round 1
- `toRoomSnapshot` already conditionally includes `currentWord` for drawer
- Pattern for extending: add fields to `RoomSnapshot`, populate in `toRoomSnapshot`
- Rate limiting exists for create/join but not for gameplay endpoints (per clarification)

### Backend: api/rooms.ts

- Six routes exist: `POST /`, `POST /:code/join`, `GET /:code`, `POST /:code/start`, `POST /:code/rename`, `POST /:code/disband`
- Each route returns `{ room: RoomSnapshot }` in responses
- Need new routes: `POST /:code/guess`, `POST /:code/canvas`, `POST /:code/canvas/clear`

### Backend: api/schemas.ts

- Zod schemas for all existing endpoints
- Need new schemas: `guessBodySchema`, `canvasStrokesSchema`, `canvasClearSchema`

### Frontend: roomStore.ts

- Class-based store with `useSyncExternalStore` for reactivity
- Polling at 2s interval via `startPolling()`/`stopPolling()`
- State model: `{ room, participantId, error, isLoading, pollError }`
- Pattern: each API method calls store method which delegates to `api.ts`, then sets state

### Frontend: api.ts

- Typed `api` object with methods for each endpoint
- Types mirror backend models (`RoomSnapshot`, `Participant`, etc.)
- Need new methods: `submitGuess`, `updateCanvas`, `clearCanvas`

### Frontend: GamePage.tsx

- Already imports `GuessForm`, `ResultPanel`, `Scoreboard`, `DrawerIndicator`
- `GuessForm` is a stub with no API integration
- `ResultPanel` is a placeholder
- `Scoreboard` is a placeholder showing scores as 0
- Canvas area uses a placeholder `<div>` — need actual drawing canvas

### Frontend: components (already exist as stubs)

- `GuessForm.tsx` — input + button, `handleSubmit` is no-op
- `ResultPanel.tsx` — placeholder text
- `Scoreboard.tsx` — placeholder with "Waiting for players..."

## Technology Patterns

- **Validation**: Zod schemas defined in `schemas.ts`, validated in route handlers before service calls
- **Error handling**: `HttpError` class with `statusCode`; centralized error handler in `router.ts`
- **Frontend state**: Class-based store with `subscribe`/`getSnapshot` pattern
- **API responses**: JSON with `room: RoomSnapshot` structure
- **Polling**: `setInterval` at 2000ms in store, `silentFetchRoom` updates state without loading flag

## Key Design Decisions

1. **Extend Round with `strokes[]` and `guesses[]`** — in-memory arrays on the existing Round model. No new store needed.
2. **Canvas state = array of Stroke objects** — each stroke contains `points` (x, y array), `color`, and `width`. Cleared by setting `strokes: []`.
3. **Guess processing** — server-side: trim, case-insensitive compare, update score, add to history. Returns updated RoomSnapshot.
4. **Polling for canvas + history** — `GET /rooms/:code` already polls at 2s. Extend `RoomSnapshot` to include `strokes` (for all players) and `guesses[]`.
5. **No new dependencies** — canvas uses HTML5 Canvas API (no library). All changes use existing Express, Zod, React, and Vite tooling.
6. **Score Map** — store scores as `Map<string, number>` (participantId → score) on the Round, populated during guess processing.
