# Implementation Plan: Result, Restart & Final Validation

**Branch**: `004-gameplay-interaction` | **Date**: 2026-06-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-result-restart-validation/spec.md`

## Summary

Enable multi-round gameplay: after a round ends, participants see results (`round_end` state), the host returns everyone to the lobby, and the host can start new rounds (up to N, where N = participant count). After the final round, a `game_over` state displays final standings. Participants can leave mid-session; host transfer is handled on departure.

## Technical Context

**Language/Version**: TypeScript 5.6, Node.js 18+

**Primary Dependencies**: Express 4 (backend), React 18 + React Router 6 (frontend), Zod 3 (validation)

**Storage**: In-memory (RoomStore Map + game session state per room). No database.

**Testing**: Vitest (backend unit tests), manual two-tab (frontend)

**Target Platform**: Web (Chrome/Firefox/Safari — latest 2 major versions)

**Project Type**: Web application (frontend + REST backend)

**Performance Goals**: State transitions reflected on all clients within 2s of host action; results view visible within 2s of round end

**Constraints**: No real-time protocols (polling only), no new state/routing libraries, all data in-memory

**Scale/Scope**: Single room, max 8 participants, max 8 rounds (N rounds for N participants)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript-First | PASS | All new types/interfaces fully typed with no `any` |
| II. Incremental Brownfield | PASS | Extends existing Room model, RoomSnapshot, roomStore, lobby endpoints |
| III. Deterministic Game Logic | PASS (see below) | Drawer rotation uses fixed round-robin; round count = participant count; word selection cycles deterministically |
| IV. Polling-First | PASS | All transitions reflected via existing polling mechanism; no new real-time protocols |
| V. Critical Self-Review | PASS | Two-tab validation of results, lobby return, new round start, final standings |

**Deterministic rules to enforce**:
- Drawer rotation: round-robin through participant list in join order, advancing by 1 each round
- Round limit: N rounds where N = participant count at first round start
- Word selection: cycle through 5-word list, never repeat consecutive rounds
- Score cumulative: carry forward across all rounds, never reset mid-session
- Host transfer: next participant in join order if host leaves

## GATE Evaluation

**Result: PASS** — No constitution violations. Existing patterns (polling, in-memory storage, typed models, room state machine) are followed. New game session state extends the existing Room model. No new libraries or architectural changes needed.

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart-validation/
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
│   │   ├── router.ts        # NEW: lobby-return, start-round, leave-room routes
│   │   ├── rooms.ts         # MAJOR: extend snapshot with round state, session scores
│   │   └── schemas.ts       # NEW: lobby-return, start-round, leave-room schemas
│   ├── models/
│   │   └── game.ts          # NEW: RoundResult, GameSession types; extend Room state machine
│   ├── services/
│   │   └── roomStore.ts     # MAJOR: multi-round state transitions, drawer rotation, session tracking
│   └── seed/
│       └── starterData.ts   # No change

frontend/
├── src/
│   ├── components/
│   │   ├── ResultPanel.tsx   # MAJOR: adapt from 003 result view; show round_end results
│   │   ├── Lobby.tsx         # MAJOR: extend for post-round lobby (start new round, waiting message)
│   │   ├── FinalStandings.tsx# NEW: ranked scoreboard with winner highlight
│   │   └── LeaveButton.tsx   # NEW: leave room action (results/lobby/standings)
│   ├── pages/
│   │   └── GamePage.tsx      # MAJOR: handle round_end / game_over states, conditionally render views
│   ├── services/
│   │   └── api.ts            # NEW: returnToLobby, startNewRound, leaveRoom
│   ├── state/
│   │   └── roomStore.ts      # MAJOR: add room state machine transitions, session state
│   └── styles/
│       └── app.css           # Add final-standings, leave-button, waiting-message styles

tests/
├── backend/
│   └── roomStore.test.ts     # NEW: multi-round, drawer rotation, word cycling, host transfer, leave logic
└── frontend/
    └── (manual two-tab)
```

**Structure Decision**: Option 2 (Web application) — existing frontend/backend split. No restructuring needed.

## Complexity Tracking

*No constitution violations to justify; Complexity Tracking left empty.*

## Phase 0: Research & Design Decisions

See [research.md](research.md) for detailed findings.

**Key decisions**:
1. **Room state transitions**: Extend room status to `lobby`, `playing`, `round_end`, `game_over`; replace `finished` from spec 003
2. **Game session tracking**: Round counter on Room, incremented on each new round start
3. **Drawer rotation**: Index pointer on Room (`currentDrawerIndex`) advances by 1 each round, wraps around via `% participants.length`
4. **Word selection**: Index pointer into starter word list (`wordIndex`), advanced by 1 each round, wraps around; skip if same as previous round
5. **Lobby return**: `POST /rooms/:code/return-to-lobby` — host only; transitions `round_end` → `lobby`
6. **Start new round**: `POST /rooms/:code/start-round` — host only; transitions `lobby` → `playing`; validates round count < participant count
7. **Leave room**: `POST /rooms/:code/leave` — any participant; removes from participant list; triggers host transfer if host leaves
8. **Host transfer**: On host leave, reassign to participant at index 0 of remaining list (join order preserved)
9. **Polling integration**: Existing ~2s polling loop picks up state transitions; no dedicated endpoints needed for results/standings views

## Phase 1: Design & Contracts

### Data Model

See [data-model.md](data-model.md) — new and extended entities: `GameSession`, `RoundResult`, `Room` state machine fields.

### API Contracts

See [contracts/api-v1.md](contracts/api-v1.md) — new endpoints: return-to-lobby, start-round, leave-room. Extended room snapshot with round state, session scores, and final standings.

### Quickstart

See [quickstart.md](quickstart.md) — validation scenarios for two-tab testing of results viewing, lobby return, new round, final standings, leave, host transfer.
