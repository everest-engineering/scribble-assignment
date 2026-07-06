# Implementation Plan: Host Start Control

**Branch**: `005-host-start-control` | **Date**: 2026-07-06 | **Spec**: `specs/005-host-start-control/spec.md`

**Input**: Feature specification from `specs/005-host-start-control/spec.md`

## Summary

Restrict the "Start Game" button on the Lobby page: only the host (identified by `isHost` flag from Feature 001) can see and click it. The button is disabled when fewer than 2 participants are in the room. Non-host participants see a waiting message instead. Purely frontend — no backend changes needed.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, modern browsers

**Primary Dependencies**: React 18 (useState, useEffect), React Router v6 (useNavigate), existing RoomStore (getSnapshot for isHost + participant count)

**Storage**: N/A — no data model changes. Uses existing `Participant.isHost` and `Room.participants.length`.

**Testing**: Vitest — existing frontend tests at `frontend/src/services/api.test.ts`

**Target Platform**: Modern browsers via Vite dev server and production build

**Project Type**: Web application (frontend React SPA)

**Performance Goals**: No performance impact — purely conditional rendering based on existing state

**Constraints**: No backend changes. No new data fields. Must use existing `participant.isHost` and `participantId` from roomStore.

**Scale/Scope**: Single feature — Lobby page button visibility and enabled state only.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Deterministic Game Logic | ✅ Pass | Host is always the creator — deterministic per Feature 001. Button visibility derives purely from state. |
| II. RESTful Synchronization | ✅ Pass | No new sync mechanism — uses existing HTTP polling from Feature 004 |
| III. Validation Rigor | ✅ Pass | Minimum player count enforced client-side; consistent with existing patterns |
| IV. Brownfield Enhancement | ✅ Pass | Extend existing LobbyPage button rendering; no new files or dependencies |
| V. State Isolation & Immutability | ✅ Pass | Read-only check of existing state; no mutations |

**No violations** — Complexity Tracking section not required.

## Project Structure

### Documentation (this feature)

```text
specs/005-host-start-control/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── pages/
│   │   └── LobbyPage.tsx      # Conditional Start Game button visibility + enabled state
│   └── state/
│       └── roomStore.ts        # No changes needed (participantId + isHost already available)
```

**Structure Decision**: Web application layout (Option 2). Only the frontend is affected — specifically `LobbyPage.tsx`. No backend changes.

## Complexity Tracking

> Not required — all Constitution Check gates pass with no violations.
