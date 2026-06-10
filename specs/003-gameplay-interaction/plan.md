# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-gameplay-interaction/spec.md`

## Summary

Replace the canvas placeholder div with a functional native HTML canvas supporting freehand drawing, add three new backend endpoints (`POST /rooms/:code/guess`, `POST /rooms/:code/stroke`, `POST /rooms/:code/clear`), extend the `Room` model with `guesses`, `scores`, and `strokes`, and update `GamePage` to render role-appropriate views with 2-second polling syncing guess history, scores, and canvas strokes to all clients.

## Technical Context

**Language/Version**: TypeScript (strict mode) — Node.js 18+ backend, React 18 frontend

**Primary Dependencies**: Express (backend), Vite + React (frontend), Zod (validation — already in use), native HTML Canvas API (no new npm deps)

**Storage**: In-memory `Map<string, Room>` — existing pattern, no changes to persistence layer

**Testing**: Existing test files (`schemas.test.ts`, `roomStore.test.ts`, `api.test.ts`) — extend with new cases

**Target Platform**: Local dev — Node.js server + Vite dev server

**Project Type**: Brownfield web application (frontend + backend)

**Performance Goals**: 2-second polling cycle for all clients; no sub-second requirements

**Constraints**: No new top-level npm dependencies; no WebSockets; in-memory only; TypeScript strict mode throughout; both `npm run build` must pass before any task is marked done

**Scale/Scope**: Single game session, small player count (2–6), in-memory; no persistence

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|---|---|---|
| Brownfield discipline: existing code read before extending | PASS | All relevant files read: `game.ts`, `rooms.ts`, `roomStore.ts`, `schemas.ts`, `GamePage.tsx`, `api.ts`, `state/roomStore.ts` |
| No wholesale rewrites of starter code | PASS | Extending existing models and files only; no file is deleted or replaced |
| Scope bounded by README "Explicitly Out Of Scope" | PASS | No WebSockets, no persistence, no authentication, no restart flow |
| Spec-driven development order followed | PASS | spec → clarify → plan → tasks → implement |
| Deterministic game rules | PASS | Scoring is fixed (100/0), no randomness introduced |
| No new top-level npm dependencies | PASS | Native Canvas API used; Zod already present |
| TypeScript strict mode | PASS | All new code follows strict mode; `any` prohibited |
| Polling at 2-second intervals | PASS | `setInterval(2000)` in `GamePage` mirrors lobby pattern |

**Post-design re-check**: All gates still pass. Three new endpoints are additive. `Room` model extension is backward-compatible (new fields initialised in `startGame`). Canvas component is a new file, not a rewrite.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions and rationale
├── data-model.md        # Phase 1 — entity definitions and extensions
├── quickstart.md        # Phase 1 — validation scenarios
├── contracts/
│   └── api.md           # Phase 1 — endpoint contracts
└── tasks.md             # Phase 2 — /speckit-tasks output (not yet created)
```

### Source Code

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts              # extend Room, RoomSnapshot; add Point, Guess types
│   ├── api/
│   │   ├── schemas.ts           # add guessSchema, strokeSchema
│   │   └── rooms.ts             # add POST /:code/guess, /:code/stroke, /:code/clear routes
│   └── services/
│       └── roomStore.ts         # add submitGuess(), addStroke(), clearStrokes(); extend startGame(); extend toRoomSnapshot()

frontend/
├── src/
│   ├── services/
│   │   └── api.ts               # extend RoomSnapshot type; add api.submitGuess(), api.addStroke(), api.clearStrokes()
│   ├── components/
│   │   └── DrawingCanvas.tsx    # NEW — canvas element, mouse event handlers, stroke callbacks
│   ├── state/
│   │   └── roomStore.ts         # add submitGuess(), addStroke(), clearStrokes() actions
│   └── pages/
│       └── GamePage.tsx         # wire DrawingCanvas, GuessForm, Scoreboard, polling, role-based rendering
```

## Complexity Tracking

No constitution violations. No justification required.

---

## Phase 0 Outputs

See [research.md](research.md) for all decisions and rationale. Key resolved questions:

- **Canvas sync**: per-stroke POST on `mouseup`; full stroke list returned in GET poll; guessers redraw on each cycle
- **Clear sync**: `POST /rooms/:code/clear` resets server strokes; optimistic local clear for drawer
- **Stroke format**: `Point = { x, y }` raw pixel offsets; `strokes: Point[][]`
- **Guess attribution**: `playerName` in POST body (consistent with existing identity pattern)
- **Scores**: `Record<string, number>` in `Room`; cumulative running total
- **Canvas component**: `DrawingCanvas.tsx` with `onStrokeComplete` / `onClear` callbacks + `strokes` prop for redraw

---

## Phase 1 Outputs

- [data-model.md](data-model.md) — `Room`, `RoomSnapshot`, `Point`, `Guess` definitions and extensions
- [contracts/api.md](contracts/api.md) — full request/response contracts for all three new endpoints plus GET snapshot extension
- [quickstart.md](quickstart.md) — 7 end-to-end validation scenarios with curl smoke tests
