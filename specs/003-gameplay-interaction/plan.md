# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-gameplay-interaction/spec.md`

## Summary

Deliver Scenario 3 on the brownfield stack: extend `CurrentRound` with strokes, guesses, scores; add `appendStroke`, `clearStrokes`, `submitGuess` in `roomStore.ts`; widen `RoomStatus` to include `"result"`; expose `POST /rooms/:code/strokes`, `POST /rooms/:code/strokes/clear`, `POST /rooms/:code/guess`; extend `toRoomSnapshot` with strokes, guess history, scores (secret word still drawer-only). Frontend: new `Canvas.tsx` (600×400, drawer-only draw, straight-line segments, client point decimation), wire `GuessForm`, `Scoreboard`, `ResultPanel` to polled state; disable guesses when not `playing`. First correct guess transitions to `result` per A3; no restart UI (Scenario 4).

## Technical Context

**Language/Version**: TypeScript (Node 18+, strict) on backend and frontend

**Primary Dependencies**: Express, Zod, React 18, React Router v6, Vite, Vitest

**Storage**: In-memory `Map` in `roomStore.ts` only

**Testing**: Vitest — extend `roomStore.test.ts`, `schemas.test.ts`, `api.test.ts` per constitution

**Target Platform**: Local dev — backend `:3001`, frontend `:5173`

**Project Type**: Web application (Express REST + React SPA)

**Performance Goals**: 2000 ms polling; caps 500 strokes / 200 guesses / 250 points per stroke; endpoints < 50 ms p95

**Constraints**: HTTP polling only; snapshot purity for secret word; no WebSockets/DB/auth

**Scale/Scope**: Single round gameplay — draw, guess, score, result transition; no restart

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Scenario 3 compliance |
|-----------|----------------------|
| I. Code Quality | `appendStroke`, `clearStrokes`, `submitGuess` in `roomStore.ts`; typed Stroke/Guess; deterministic scoring (A3) |
| II. Testing | Happy/reject paths for each helper; schema tests; api client tests; cap enforcement tests |
| III. UX | Drawer-only canvas/clear; guess trim client+server; `.form__error`; disable guess when not playing |
| IV. Performance | Reuse `useRoomPolling`; canvas redraw on stroke ref change; client decimates points |
| Non-negotiable | No WebSockets/DB/auth; no restart endpoint; no drawer rotation |

**Gate status**: PASS — no constitutional exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── rooms-api.md
├── spec.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/src/
├── models/game.ts              # Stroke, Guess, scores; RoomStatus + result
├── services/roomStore.ts         # appendStroke, clearStrokes, submitGuess, init scores on start
├── services/roomStore.test.ts
├── api/schemas.ts              # strokeSchema, guessSchema
├── api/schemas.test.ts
└── api/rooms.ts                # POST strokes, strokes/clear, guess

frontend/src/
├── components/Canvas.tsx       # NEW: 600×400 drawer canvas + read-only render
├── components/GuessForm.tsx    # submitGuess wired
├── components/Scoreboard.tsx   # scores from snapshot
├── components/ResultPanel.tsx  # guess history list
├── services/api.ts             # appendStroke, clearStrokes, submitGuess clients
├── services/api.test.ts
├── state/roomStore.ts          # actions + types
└── pages/GamePage.tsx          # Canvas, polling for playing+result, status UI
```

**Structure Decision**: Web app — extend existing backend/frontend paths; one new component file (`Canvas.tsx`).

## Data Flow

```text
Drawer pointer move/end → Canvas decimates points → roomStore.appendStroke → POST /strokes
  → roomStore.appendStroke → poll GET /rooms/:code → all clients redraw strokes

Guesser submit → trim client → roomStore.submitGuess → POST /guess
  → compare case-insensitive → append guess, maybe +100, maybe status=result
  → poll → Scoreboard + ResultPanel update

Drawer clear → POST /strokes/clear → strokes=[] → poll → empty canvas all tabs
```

## Implementation Sequence

1. Backend models + caps constants
2. `startRound` initializes scores map (all 0)
3. Service helpers + tests
4. Zod schemas + routes + error mapping
5. Extend `toRoomSnapshot` with strokes, guesses, scores
6. Frontend API clients + tests
7. `Canvas.tsx` + GamePage integration
8. GuessForm, Scoreboard, ResultPanel wiring
9. GamePage poll when `playing` or `result`; disable guess when not `playing`

## Risks

| Risk | Mitigation |
|------|------------|
| Large stroke payloads | Client decimation; 250-point cap; 500-stroke cap |
| Race on dual correct guesses | Server serializes; second gets 409 round ended |
| Canvas coordinate drift | Normalize to canvas width/height on send |

## Complexity Tracking

No constitutional violations.
