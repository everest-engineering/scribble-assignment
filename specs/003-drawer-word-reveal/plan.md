# Implementation Plan: Game Start — Drawer Assignment and Word Reveal

**Branch**: `003-drawer-word-reveal` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-drawer-word-reveal/spec.md`

## Summary

When a game starts, the host is designated as the drawer and the first word from the starter list is the secret word. The game screen shows the word only to the drawer and displays role labels (Drawer / Guesser) to all participants. All required data (`hostId`, `availableWords`) is already present in the `RoomSnapshot`; this feature is a **frontend-only rendering change** to `GamePage.tsx` — no backend work needed.

## Technical Context

**Language/Version**: TypeScript (strict). React 18 (frontend only).

**Primary Dependencies**: React Router 6, existing `useRoomState()` hook. All already installed.

**Storage**: N/A — no new data stored; derived from in-memory `RoomSnapshot`.

**Testing**: Vitest (frontend). Manual two-tab browser verification per constitution Principle IV.

**Target Platform**: Local development. Frontend on `localhost:5173`.

**Project Type**: Web application — frontend change only (`frontend/src/`).

**Performance Goals**: Role and word display must appear within 1 second of game screen load (SC-004).

**Constraints**: No new libraries. No backend changes. Single file change: `frontend/src/pages/GamePage.tsx`.

**Scale/Scope**: 2–8 players, single round, in-memory.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked post-design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield-First | ✅ Pass | Single edit to existing `GamePage.tsx`; no new files created. All existing imports preserved. |
| II. Spec-Driven Development | ✅ Pass | `spec.md` exists with 7 FRs and 2 user stories. |
| III. Deterministic Game Rules | ✅ Pass | Drawer = `hostId` (deterministic). Word = `availableWords[0]` (deterministic). |
| IV. Incremental Validation | ✅ Pass | Both user stories independently testable in two browser tabs. |
| V. Simplicity & Scope | ✅ Pass | Zero backend changes, zero new dependencies, one file. |

**Post-design re-check**: No violations. Purely a rendering concern in one existing file.

## Project Structure

### Documentation (this feature)

```text
specs/003-drawer-word-reveal/
├── plan.md              # This file
├── research.md          # Phase 0: decisions and rationale
├── data-model.md        # Phase 1: derived state, no model changes
├── contracts/
│   └── api.md           # Phase 1: no API changes; UI contract documented
└── tasks.md             # Phase 2 output (/speckit-tasks — not yet created)
```

### Source Code

```text
frontend/src/
└── pages/
    └── GamePage.tsx      # Only file changed — add isDrawer, secretWord, role labels, word card
```

**Structure Decision**: Web application (existing layout). No new directories or files in source code.

## Complexity Tracking

> No constitution violations — table not required.
