# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement the result state and game restart flow. This includes displaying the final word, scores, and guesses when a round ends, and allowing the host to trigger a restart which clears the game state and returns all players to the lobby, preserving the room and players list. This relies purely on HTTP polling and in-memory state manipulation.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Express (backend), React, React Router, Zustand (frontend), Zod

**Storage**: In-memory only (no databases)

**Testing**: N/A (standard manual verification with multi-tab)

**Target Platform**: Web browsers

**Project Type**: Web Application (React + Express)

**Performance Goals**: Instant state transition upon HTTP polling interval

**Constraints**: No WebSockets, strict HTTP polling, minimalistic state size

**Scale/Scope**: Small group rooms

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **TypeScript First**: All additions strictly typed.
- [x] **Minimal In-Memory & Polling**: Uses existing polling; clears memory arrays on restart. No DB used. No WebSockets used.
- [x] **Extend, Don't Replace**: Extends `RoomService` and React components.
- [x] **Strict Scope Guardrails**: No out-of-scope features (no multiple rounds implemented here, just returning to lobby).
- [x] **AI & Review Discipline**: Granular commits planned.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── state/
```

**Structure Decision**: Standard web application with distinct backend and frontend directories as outlined in the Constitution.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
