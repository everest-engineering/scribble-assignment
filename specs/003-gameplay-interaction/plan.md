# Implementation Plan: Scribble Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-gameplay-interaction/spec.md`

## Summary

Add the core gameplay loop to the existing Scribble application: an interactive freehand drawing canvas (drawer-only) that syncs to all players via polling, a guess submission flow with deterministic trim-and-compare scoring (100 pts correct / 0 pts incorrect), a shared guess history with green highlighting for correct entries, a live scoreboard, and automatic round termination when all guessers guess correctly or the 90-second timer expires. All state stays in-memory. Three new backend routes (`PUT/DELETE /canvas`, `POST /guesses`) and five new `RoomSnapshot` fields deliver the full gameplay state through the existing polling loop.

## Technical Context

**Language/Version**: TypeScript 5.6 (strict); Node.js 24 (backend); React 18.3 (frontend)

**Primary Dependencies**:
- Backend: Express 4.21, Zod 3.23, tsx (dev), Vitest 3.1
- Frontend: React 18, React Router DOM 6.30, Vite 5.4, Vitest 3.1 (jsdom), Zod (shared/)

**Storage**: In-memory `Map<string, Room>` in `backend/src/services/roomStore.ts` — no persistence (Constitution Principle V)

**Testing**: Vitest — backend (node env), frontend (jsdom env); ≥ 80% line/branch coverage gate; TDD required (Red-Green-Refactor)

**Target Platform**: Browser (Chrome/Firefox/Safari) + Node.js 24 server; single-host deployment

**Project Type**: Web application (frontend + backend monorepo with shared Zod schemas)

**Performance Goals**: Canvas state and guesses visible to all players within 3 seconds (SC-001, SC-004); guess submission round-trip completes in under 10 seconds (SC-005)

**Constraints**: Bundle ≤ 150 KB gzipped (Constitution Principle V); no persistence; `strict: true` TypeScript; no WebSocket (polling only)

**Scale/Scope**: Single-server, up to 4 players per room; ~15 modified/new source files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Gate | Status | Notes |
|---|------|--------|-------|
| 1 | TypeScript strict mode | ✅ PASS | `strict: true` in both tsconfigs; all new types explicit (`string \| null`, `Record<string, number>`, `Set<string>`) |
| 2 | Functional components & existing patterns | ✅ PASS | All new components are function components; `DrawingCanvas` follows existing component conventions; state via hooks |
| 3 | TDD (Vitest ≥ 80%) | ✅ PLANNED | All new `roomStore` operations and UI components get failing tests before production code |
| 4 | Accessibility (WCAG 2.1 AA) | ✅ PLANNED | Canvas has `aria-label`; clear button accessible; guess feed uses `aria-live`; axe-core in component tests |
| 5 | No persistence introduced | ✅ PASS | All new state (`canvasDataUrl`, `guesses`, `scores`, `correctGuessers`) stays in `Map<string, Room>`; `Set<string>` is in-memory |
| 6 | Zod contracts present | ✅ PLANNED | `shared/schemas/room.ts` updated with `guessSnapshotSchema` + new `roomSnapshotSchema` fields before any implementation |
| 7 | Error boundary coverage | ✅ PASS | `PageErrorBoundary` already wraps all pages; no new pages introduced |

**Post-design re-check**: No violations. All new `RoomSnapshot` fields are additive. `"finished"` status addition is backward-compatible (existing `status === "in-progress"` guards on frontend correctly treat `"finished"` as disabled). `Set<string>` is server-internal only — not serialised to wire.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api-contracts.md # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (modified and new files)

```text
shared/
└── schemas/
    └── room.ts                    # Add guessSnapshotSchema; add "finished" to roomStatusSchema;
                                   # add 5 new fields to roomSnapshotSchema

backend/
└── src/
    ├── seed/
    │   └── starterData.ts         # Add ROUND_DURATION_SECONDS = 90
    ├── models/
    │   └── game.ts                # Add Guess interface; extend Room with canvasDataUrl,
    │                              # guesses, scores, correctGuessers, roundStartedAt
    ├── services/
    │   ├── roomStore.ts           # Add updateCanvas(), clearCanvas(), submitGuess(),
    │   │                          # checkRoundExpiry(); extend startRoom(), toRoomSnapshot()
    │   └── roomStore.test.ts      # TDD tests for all new operations
    └── api/
        ├── rooms.ts               # Add PUT /:code/canvas, DELETE /:code/canvas,
        │                          # POST /:code/guesses routes
        └── schemas.ts             # Add updateCanvasSchema, clearCanvasSchema, submitGuessSchema

frontend/
└── src/
    ├── services/
    │   └── api.ts                 # Add updateCanvas(), clearCanvas(), submitGuess()
    ├── state/
    │   └── roomStore.ts           # Add updateCanvas(), clearCanvas(), submitGuess() actions
    ├── pages/
    │   ├── GamePage.tsx           # Mount DrawingCanvas; pass hasGuessedCorrectly to GuessForm
    │   └── GamePage.test.tsx      # Update/add tests for new gameplay layout
    └── components/
        ├── DrawingCanvas.tsx      # NEW — freehand drawing (pointer events), clear button,
        │                          # read-only polling view; role-aware (drawer vs guesser)
        ├── GuessForm.tsx          # Wire submit to roomStore.submitGuess(); disable when
        │                          # correct/drawer/finished
        ├── Scoreboard.tsx         # Render room.scores per participant name
        └── ResultPanel.tsx        # Render room.guesses; correct entries in green
```

**Structure Decision**: Web application (existing `backend/` + `frontend/` monorepo with `shared/` for Zod contracts). No new top-level directories. One new frontend component (`DrawingCanvas.tsx`).

## Complexity Tracking

No Constitution violations. No entries required.
