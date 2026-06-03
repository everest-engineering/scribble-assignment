# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-gameplay-interaction/spec.md`

## Summary

Add the core gameplay interaction loop to the Scribble game: a freehand drawing canvas for the
drawer, a guess submission form for guessers, a shared guess history visible to all participants
via polling, and a live scoreboard. Canvas state is stored server-side as an array of strokes and
synced to all participants on every 2-second poll. Guess evaluation is case-insensitive and trims
whitespace; correct guesses award 100 points (once per guesser per round, enforced server-side).
No new npm packages — HTML Canvas API and existing stack only.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+

**Primary Dependencies**: Express, Zod (backend) · React 18, React Router v6, Vite (frontend) · Vitest (tests)

**Storage**: In-memory `Map<string, Room>` in `backend/src/services/roomStore.ts` — no database

**Testing**: Vitest (backend unit tests in `backend/src/`, frontend unit tests in `frontend/src/`)

**Target Platform**: Local development — macOS/Linux, modern browser (Chrome/Firefox/Safari)

**Project Type**: Web application — Express REST API + React SPA

**Performance Goals**: Canvas strokes and guess history visible on all clients within ≤2 seconds (one polling interval, SC-003, SC-006)

**Constraints**: No WebSockets · No databases · No auth · HTTP polling only · `setInterval` MUST be cleared on unmount · No new runtime npm packages (Principle V)

**Scale/Scope**: Small local sessions (2–5 players, 1 active room at a time during development)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                      | Check                                                                                                                                                         | Status  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| I. TypeScript-First            | All new types (`Point`, `Stroke`, `Guess`, `CanvasState`, `Room`/`RoomSnapshot` additions) carry explicit TypeScript types. No `any`.                         | ✅ PASS |
| II. In-Memory Only             | Canvas strokes, guesses, and scores stored in `room.strokes`, `room.guesses`, `room.scores` — all fields on the existing `Map<string, Room>`. No persistence. | ✅ PASS |
| III. HTTP Polling              | Canvas state delivered to guessers via existing 2-second `GET /rooms/:code` poll. No WebSockets, no SSE. Drawer POSTs canvas updates synchronously.           | ✅ PASS |
| IV. Validate at Every Boundary | `updateCanvasSchema` and `submitGuessSchema` (Zod) added for new endpoints. Client-side empty-guess validation fires before the network request.              | ✅ PASS |
| V. Minimal Footprint           | No new npm packages. HTML Canvas API (built-in). All drawing logic is vanilla DOM events.                                                                     | ✅ PASS |

**Post-design re-check**: Passes. `DrawingCanvas` component is a single-responsibility unit; no abstraction layers beyond what the feature requires.

**Complexity Tracking**: No violations. No justification table needed.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output — 8 decisions resolved
├── data-model.md        # Phase 1 output — Point, Stroke, Guess, Room additions
├── quickstart.md        # Phase 1 output — manual 6-step verification guide
├── contracts/
│   └── api.md           # Phase 1 output — 2 new endpoints + RoomSnapshot extensions
├── checklists/
│   └── requirements.md  # All 16 items checked ✅
└── tasks.md             # Phase 2 output (/speckit.tasks command — NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts              # MODIFY — add Guess, Point, Stroke types; extend Room + RoomSnapshot
│   ├── services/
│   │   ├── roomStore.ts         # MODIFY — add updateCanvas(), submitGuess(); extend startRoom(), toRoomSnapshot()
│   │   └── roomStore.test.ts    # MODIFY — add tests for new service functions
│   ├── api/
│   │   ├── schemas.ts           # MODIFY — add updateCanvasSchema, submitGuessSchema
│   │   ├── schemas.test.ts      # MODIFY — add schema validation tests
│   │   └── rooms.ts             # MODIFY — add PATCH /:code/canvas, POST /:code/guesses routes
│   └── seed/
│       └── starterData.ts       # NO CHANGE

frontend/
├── src/
│   ├── services/
│   │   ├── api.ts               # MODIFY — add Point, Stroke, Guess types; add updateCanvas(), submitGuess()
│   │   └── api.test.ts          # MODIFY — add tests for new api methods
│   ├── components/
│   │   ├── DrawingCanvas.tsx    # NEW — interactive canvas (drawer) + read-only canvas (guessers)
│   │   ├── GuessForm.tsx        # MODIFY — wire up submission, validation feedback, result display
│   │   ├── ResultPanel.tsx      # MODIFY — replace placeholder with real GuessHistory display
│   │   └── Scoreboard.tsx       # MODIFY — accept participants + scores props, render real data
│   ├── pages/
│   │   └── GamePage.tsx         # MODIFY — integrate DrawingCanvas, GuessForm, ResultPanel, Scoreboard
│   └── styles/
│       └── app.css              # MODIFY — canvas, guess history, scoreboard styles
```
