# Implementation Plan: Game Start & Drawer Flow

**Branch**: `bhaskar_scribble_assigment` | **Date**: 2026-06-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-game-start-drawer/spec.md`

## Summary

Transition room from lobby to playing by assigning the host as drawer, selecting a secret word deterministically from the starter list, and revealing the word only to the drawer. All participants see their role on the game screen via polling.

## Technical Context

**Language/Version**: TypeScript 5.6, Node.js 18+

**Primary Dependencies**: Express 4 (backend), React 18 + React Router 6 (frontend), Zod 3 (validation)

**Storage**: In-memory (RoomStore Map). No database.

**Testing**: Vitest (both backend and frontend)

**Target Platform**: Web (Chrome/Firefox/Safari — latest 2 major versions)

**Project Type**: Web application (frontend + REST backend)

**Performance Goals**: Game state poll completes within 500ms; role/word display within 3s of Start click

**Constraints**: No real-time protocols (polling only), <200ms API response time for start-game endpoint

**Scale/Scope**: Single room game, max 8 participants

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript-First | PASS | All existing code is typed; new code follows same pattern |
| II. Incremental Brownfield | PASS | Enhances existing `startRoom`, `GamePage`, `RoomSnapshot` |
| III. Deterministic Game Logic | PASS (see below) | Drawer assignment (host is drawer) and word selection need deterministic algorithm |
| IV. Polling-First | PASS | Game state already uses polling; will document cadence at ~2s |
| V. Critical Self-Review | PASS | All changes validated via two-tab testing per workflow |

**Deterministic rules to enforce**:
- Drawer: host (earliest-joined participant) → always deterministic
- Word: index-based on room code (e.g., `hash(code) % 5`) - must be a fixed formula applied to immutable room state

## GATE Evaluation

**Result: PASS** — No constitution violations. Existing `startRoom` assigns non-host as drawer (bug) and uses `STARTER_WORDS[0]` always — both will be corrected to comply with Principle III (deterministic) and FR-001/FR-002.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — design decisions
├── data-model.md        # Phase 1 — entity definitions
├── quickstart.md        # Phase 1 — validation guide
├── contracts/
│   └── api-v1.md        # API contract changes
└── tasks.md             # (/speckit.tasks output)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── router.ts        # No change
│   │   ├── rooms.ts         # Minor: no new endpoints needed
│   │   └── schemas.ts       # No change
│   ├── models/
│   │   └── game.ts          # No change (roles, secretWord already exist)
│   ├── services/
│   │   └── roomStore.ts     # Fix: drawer=host, deterministic word selection
│   └── seed/
│       └── starterData.ts   # No change

frontend/
├── src/
│   ├── components/
│   │   ├── Canvas.tsx        # NEW — interactive canvas for drawer
│   │   └── WordDisplay.tsx   # NEW — secret word badge (drawer only)
│   ├── pages/
│   │   ├── LobbyPage.tsx    # No change
│   │   ├── GamePage.tsx     # Major update: role-based rendering, polling, word
│   │   └── StartPage.tsx    # No change
│   ├── services/
│   │   └── api.ts           # No change (startGame exists)
│   ├── state/
│   │   └── roomStore.ts     # Minor: expose viewer role + drawer identity
│   └── styles/
│       └── app.css          # Add canvas, word-display styles

tests/
├── backend/
│   └── roomStore.test.ts    # Update: test drawer=host, deterministic word
└── frontend/
    └── (manual two-tab)
```

**Structure Decision**: Option 2 (Web application) — existing frontend/backend split. No restructuring needed.

## Complexity Tracking

*No constitution violations to justify; Complexity Tracking left empty.*

## Phase 0: Research & Design Decisions

See [research.md](research.md) for detailed findings.

**Key decisions**:
1. **Drawer assignment**: Host is drawer (matching FR-001). Fix `startRoom` to assign host as drawer, not first non-host.
2. **Word selection**: Index-based on sum of char codes of room code modulo 5. This produces a deterministic, room-dependent word.
3. **Game state polling**: Reuse existing RoomStore.polling mechanism at ~2s interval; add role-aware snapshot filtering for guessers (strip `secretWord`).
4. **Canvas**: Create a new `Canvas` component using HTML `<canvas>` element with basic brush and color picker.
5. **Word display**: Create `WordDisplay` component shown only when `viewer.role === "drawer"`.

## Phase 1: Design & Contracts

### Data Model

See [data-model.md](data-model.md) — no new entities needed; existing `Room`, `Participant`, `RoomSnapshot` cover the feature.

### API Contracts

See [contracts/api-v1.md](contracts/api-v1.md) — the existing `POST /rooms/:code/start` endpoint already exists. Minor behavioral change: fix drawer assignment and word selection logic on server side.

### Quickstart

See [quickstart.md](quickstart.md) — validation scenarios for two-tab testing.
