# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction-drawing` | **Date**: 2026-05-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-gameplay-interaction/spec.md`

## Summary

Enable core round gameplay: the drawer draws on an HTML5 canvas with strokes persisted server-side; guessers see the same drawing via ~2s polling; the drawer can clear the canvas; guessers submit trimmed guesses with case-insensitive scoring (+100 correct, +0 incorrect); shared guess history and scores sync through room snapshots. Three new mutation endpoints (`drawing/strokes`, `drawing/clear`, `guess`) extend the existing in-memory room store.

**Prerequisite**: Scenarios 1–2 must provide `playing` status, `drawerId`, `secretWord`, `scores`, game polling, and drawer-only word visibility. Merge or implement those before Scenario 3 if absent on the branch.

## Technical Context

**Language/Version**: TypeScript (Node 18+, ES modules) on backend and frontend  
**Primary Dependencies**: Express, Zod, React 18, React Router v6, Vite  
**Storage**: In-memory `Map` in `roomStore.ts` (no persistence)  
**Testing**: Vitest (backend); manual two-tab validation per quickstart.md  
**Target Platform**: Local dev — backend `:3001`, frontend `:5173`  
**Project Type**: Web application (monorepo `backend/` + `frontend/`)  
**Performance Goals**: Canvas visible on guesser within ~5 s via 2 s polling  
**Constraints**: HTTP polling only; no WebSockets; no new npm dependencies for canvas  
**Scale/Scope**: Single round, ≤8 players, modest stroke/guess counts per room  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md` (Scribble Constitution v1.0.0)

| Gate | Requirement | Pass? |
|------|-------------|-------|
| Brownfield First | Plan extends existing starter files; no rewrite-from-scratch | ✅ |
| Spec traceability | Feature maps to spec acceptance criteria and ordered tasks | ✅ |
| Scope constraints | HTTP polling only; in-memory state; no auth; no out-of-scope items | ✅ |
| TypeScript & Zod | Typed changes; backend payloads validated with Zod | ✅ |
| Deterministic rules | Word selection, scoring, guess validation match spec | ✅ |
| Incremental validation | Slice can be verified manually (e.g., two browser tabs) | ✅ |
| Build health | `npm run build` passes in `backend/` and `frontend/` | ✅ |

Post-design re-check: All gates pass. No constitution violations requiring Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── rooms-api.md     # Phase 1
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts              # + Stroke, Guess, strokes[], guesses[]
│   ├── services/
│   │   ├── roomStore.ts         # appendStroke, clearStrokes, submitGuess
│   │   ├── guessService.ts      # trim, compare, score (+100/0)
│   │   └── roomStore.test.ts    # guess + auth tests
│   └── api/
│       ├── schemas.ts           # stroke, guess, drawing body schemas
│       └── rooms.ts             # POST drawing/strokes, drawing/clear, guess

frontend/
├── src/
│   ├── components/
│   │   ├── DrawingCanvas.tsx    # drawer interactive / guesser read-only
│   │   ├── GuessForm.tsx        # wire submitGuess, validation
│   │   ├── GuessHistory.tsx     # list room.guesses
│   │   └── Scoreboard.tsx       # room.scores from snapshot
│   ├── pages/
│   │   └── GamePage.tsx         # canvas, polling, role-based UI
│   ├── services/
│   │   └── api.ts               # appendStroke, clearDrawing, submitGuess
│   └── state/
│       └── roomStore.ts         # submitGuess, appendStroke, clearDrawing
```

**Structure Decision**: Extend existing monorepo layout per `AGENTS.md`. No new top-level packages.

## Data Flow

```text
Drawer pointerup
  → DrawingCanvas builds Stroke
  → roomStore.appendStroke → POST /rooms/:code/drawing/strokes
  → roomStore updates snapshot

Guesser poll (2s)
  → GET /rooms/:code?participantId=
  → DrawingCanvas replays strokes; GuessHistory/Scoreboard render

Drawer Clear
  → POST /rooms/:code/drawing/clear
  → strokes=[] in snapshot

Guesser Submit
  → POST /rooms/:code/guess
  → server: trim, compare, append guess, maybe +100 score
  → snapshot returned; poll keeps tabs in sync
```

## Implementation Sequence

1. **Prerequisite check**: Ensure Scenario 1–2 fields and routes exist; if not, port from `001`/`002` branches first.
2. **Models**: Add `Stroke`, `Guess`, `Point`; extend `Room` / `RoomSnapshot`.
3. **Services**: `guessService.ts`; `appendStroke`, `clearStrokes`, `submitGuess` in `roomStore.ts`; initialize `strokes`/`guesses` in `startGame`.
4. **API**: Zod schemas + three POST routes; extend `toRoomSnapshot` with gameplay fields.
5. **Tests**: Vitest for guess scoring and role guards.
6. **Frontend API + store**: Mirror endpoints in `api.ts` and `roomStore.ts`.
7. **DrawingCanvas**: Canvas draw + stroke upload on pointer up; replay on prop change.
8. **GamePage integration**: Polling, drawer vs guesser props, clear button (drawer only).
9. **GuessForm + GuessHistory + Scoreboard**: Wire to store and snapshot.
10. **Validate**: quickstart.md checklist; `npm test` + builds.

## Testing Strategy

| Layer | Approach |
|-------|----------|
| Unit | `guessService` / `submitGuess` — trim, case, +100/0 |
| Unit | `appendStroke` / `clearStrokes` — drawer-only, playing-only |
| Manual | quickstart.md §1–§4 with two tabs |
| Build | `npm run build` both apps |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Scenarios 1–2 missing on branch | Document prerequisite; implement or merge before gameplay |
| Large stroke payloads | Stroke-per-pointer-up limits size; lab scale is small |
| Canvas desync | Server is source of truth; full stroke array each poll |
| Drawer tries to guess | Disable UI + 403 on API |

## Complexity Tracking

> No violations. Table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|

## Artifact Index

- [research.md](./research.md) — stroke model, canvas, scoring decisions
- [data-model.md](./data-model.md) — entities and validation
- [contracts/rooms-api.md](./contracts/rooms-api.md) — endpoint contracts
- [quickstart.md](./quickstart.md) — manual validation steps

**Next command**: `/speckit-tasks`
