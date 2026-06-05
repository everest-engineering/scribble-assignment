# Implementation Plan: Scribble Guessing Game

**Branch**: `001-scribble-game` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-scribble-game/spec.md`

## Summary

Enhance the brownfield Scribble starter so two or more players can create/join an isolated room,
gather in a self-refreshing lobby, start a single round with a deterministic secret word and one
drawer, draw and guess with synchronized history and fixed scoring, then see a shared result and
restart back to the lobby. The approach extends the existing in-memory `roomStore` state model and
the four existing REST endpoints with host tracking, round lifecycle, and guess/score state, and
adds client-side polling (~2s) to the existing `RoomStore`. No new runtime dependencies, no
persistence, no real-time transport — consistent with the constitution's scope boundaries.

## Technical Context

**Language/Version**: TypeScript 5.6 (Node.js 18+ backend, React 18 frontend)

**Primary Dependencies**: Backend — Express 4, Zod 3 (already present). Frontend — React 18,
react-router-dom 6 (already present). No new top-level dependencies.

**Storage**: In-memory only (`Map<string, Room>` in `backend/src/services/roomStore.ts`); cleared
on backend restart. No database.

**Testing**: Vitest (already configured in both `backend` and `frontend`).

**Target Platform**: Local dev — backend `http://localhost:3001`, frontend `http://localhost:5173`.

**Project Type**: Web application (existing `backend/` + `frontend/` split).

**Performance Goals**: Lobby and guess-history updates visible to all players within ~2s (polling
cadence). No throughput targets — small-group local play.

**Constraints**: Polling-only sync (no WebSockets); deterministic word selection; fixed 100/0
scoring; in-memory state; enhance — do not rewrite — the starter.

**Scale/Scope**: Small rooms (typically 2–8 players), one active round per session.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Spec-Driven Workflow | Spec + acceptance criteria exist before this plan; plan ties to real files | ✅ PASS — [spec.md](./spec.md) drives this plan |
| II. Brownfield Discipline & Scope | No rewrite; no out-of-scope features; no unjustified deps; in-memory only | ✅ PASS — extends existing modules, zero new deps |
| III. Deterministic Game Rules | Deterministic word, trimmed/case-insensitive guesses, 100/0 scoring, ~2s sync | ✅ PASS — encoded in data-model + contracts |
| IV. Reviewed AI-Assisted Development | Granular traceable commits; deviations documented | ✅ PASS — task slices map to user stories |
| V. Incremental Delivery & Validation | Scenario-ordered slices; two-tab validation; builds pass | ✅ PASS — see quickstart + tasks ordering |

**Initial gate**: PASS. No violations — Complexity Tracking left empty.

**Post-design re-check**: PASS. The design adds fields to the existing `Room` model and new actions
on existing endpoints rather than new infrastructure; word selection is index-based on the seeded
list (deterministic); sync is client polling against the existing `GET /rooms/:code`.

## Project Structure

### Documentation (this feature)

```text
specs/001-scribble-game/
├── plan.md              # This file (/speckit-plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── rooms-api.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts            # EXTEND: add host, round/drawer, word, guesses, scores; RoomStatus union
│   ├── services/
│   │   └── roomStore.ts       # EXTEND: host on create, deterministic word, startRound, submitGuess, restart
│   ├── api/
│   │   ├── schemas.ts         # EXTEND: name/guess validation (trim, non-empty), new action payloads
│   │   ├── rooms.ts           # EXTEND: start, guess, restart routes; host-only guards
│   │   └── router.ts          # WIRE new routes if needed
│   └── seed/
│       └── starterData.ts     # REUSE: STARTER_WORDS (deterministic source)
└── tests (vitest): roomStore.test.ts, schemas.test.ts  # EXTEND with new behavior

frontend/
├── src/
│   ├── services/
│   │   └── api.ts             # EXTEND: types (host, round, guesses, scores); startGame/submitGuess/restart calls
│   ├── state/
│   │   └── roomStore.ts       # EXTEND: polling (~2s), startGame/submitGuess/restart, derived viewer state
│   ├── pages/
│   │   ├── LobbyPage.tsx      # host-only start (≥2 players), auto-refresh roster
│   │   └── GamePage.tsx       # canvas + clear, guess form, scoreboard, result, restart wiring
│   └── components/
│       ├── GuessForm.tsx      # guess validation wiring
│       ├── Scoreboard.tsx     # render scores
│       └── ResultPanel.tsx    # render correct word + final scores + history
└── tests (vitest): api.test.ts                          # EXTEND with new calls
```

**Structure Decision**: Web application — keep the existing `backend/` + `frontend/` split. All work
is an in-place extension of existing files (no new top-level directories, no new packages),
satisfying Principle II. The canvas drawing surface is added inside `GamePage.tsx`/a small component
using the browser's native `<canvas>` — no drawing library (out-of-scope dependency avoidance).

## Complexity Tracking

> No constitution violations. No entries required.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
