# Implementation Plan: Result, Restart & Final Validation

**Branch**: `004-result-restart` | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-result-restart/spec.md`

## Summary

When a round ends (host clicks "Reveal & End Round"), all participants see the correct word, final scores, and full guess history. The host can then restart the game — all participants return to lobby with players preserved and all round state cleared. Backend: new `"result"` room status + reveal and restart endpoints. Frontend: "Reveal & End Round" button for host during play → result view component with "Restart" button → lobby navigation on restart.

## Technical Context

**Language/Version**: TypeScript (Node.js backend with `tsx`, React 18 frontend with Vite)

**Primary Dependencies**: Express + Zod (backend), React 18 + React Router v6 + Vite (frontend), Zustand (state management)

**Storage**: N/A — all data in-memory via `roomStore.ts` (Room Map)

**Testing**: Vitest (both backend and frontend, `npm test` runs `vitest run`)

**Target Platform**: Linux server (backend on port 3001), modern browsers (frontend on port 5173)

**Project Type**: Web application — REST API backend + React SPA frontend

**Performance Goals**: Simple ~2s polling cycle; lab-scale (<10 concurrent participants, single room)

**Constraints**: <200 lines per file; in-memory only; no WebSockets, databases, or auth per Strict Boundaries

**Scale/Scope**: Lab-scale, single room, single round at a time

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript First | ✅ PASS | All new code fully typed; existing patterns already TS |
| II. Immutability & Purity | ✅ PASS | Round-end detection and result state are pure checks; side effects confined to roomStore |
| III. Test-First (NON-NEGOTIABLE) | ✅ PASS | Tests required before implementation; existing Vitest patterns |
| IV. Validated REST API | ✅ PASS | New endpoints need Zod validation (e.g., restart participantId) |
| V. Strict Boundaries | ✅ PASS | No WebSockets (polling only), no DB (in-memory), no auth, no scope creep |

No violations. All gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts              # Add "result" to RoomStatus type; add correctWord to RoomSnapshot
│   ├── services/
│   │   └── roomStore.ts         # Add round-end detection, revealRound, restartGame; auto-detect all-correct in submitGuess; populate correctWord in snapshot
│   │   └── roomStore.test.ts    # Add tests for reveal, auto-detect, restart, result snapshot
│   └── api/
│       └── rooms.ts             # Add POST /:code/reveal and POST /:code/restart endpoints
│       └── schemas.ts           # Add reveal and restart query schemas

frontend/
└── src/
    ├── components/
    │   └── ResultView.tsx        # New: result state display (correct word, scores, history) + Restart button for host
    ├── pages/
    │   └── GamePage.tsx          # Update: render ResultView when status="result"; add "Reveal & End Round" button for host during playing; navigate to lobby on restart
    ├── services/
    │   └── api.ts               # Add revealRound and restartGame API calls
    └── state/
        └── roomStore.ts         # Add revealRound and restartGame methods
```

**Structure Decision**: Web application — backend (Express API) + frontend (React SPA). Files to modify are highlighted above. All new code follows existing patterns.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
