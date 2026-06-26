# Implementation Plan: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer-flow` | **Date**: 2026-06-26 | **Spec**: specs/002-game-start-drawer-flow/spec.md

**Input**: Feature specification from `specs/002-game-start-drawer-flow/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

When the host starts the game, the room transitions to "playing", the host becomes the drawer, and a secret word is deterministically selected from STARTER_WORDS. The word is visible only to the drawer via server-side filtering in `toRoomSnapshot()`. sessionStorage persists the room code and participant ID across page refreshes.

## Technical Context

**Language/Version**: TypeScript (ES2022, NodeNext module resolution, strict mode)

**Primary Dependencies**: Express 4 + Zod (backend); React 18 + React Router 6 + Vite (frontend)

**Storage**: In-memory only (Map-based room store on backend)

**Testing**: Vitest, minimum 80% line coverage

**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge)

**Project Type**: Web application (Express backend + React frontend)

**Performance Goals**: Game start response under 500ms p95; page refresh recovery under 2s (single fetch). SC-006's "2 seconds" refers to the LobbyPage polling interval — guessers see the drawer identity when the LobbyPage poll detects `status === "playing"` and auto-navigates to GamePage.

**Constraints**: No WebSockets, no databases, no auth, polling-only sync. Backend centralized error handling. Zod for request validation. Functional components with hooks on frontend.

**Polling Model**: The LobbyPage polls `GET /rooms/:code` every 2s (Scenario 1). The GamePage does NOT poll — it performs a single fetch on mount for page-refresh recovery only. SC-006's 2s window is satisfied by the LobbyPage poll detecting `status === "playing"`, which triggers navigation to `/game`.

**Scale/Scope**: Lab project — small scale, no production deployment.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **TypeScript-First (Strict Mode)**: TypeScript strict mode enabled, `any` forbidden.
- **Extend, Don't Rewrite**: All changes extend existing Room/RoomSnapshot models + roomStore service. No rewrites.
- **Spec-Driven Development**: Spec artifacts committed before implementation.
- **Deterministic Game Logic**: Word selection uses `STARTER_WORDS[currentRound - 1]` — deterministic, no randomness.
- **Minimal Dependencies**: No new dependencies required. sessionStorage is a Web API, no library needed.
- **Technical Constraints**: No WebSockets, no DB, no auth, polling-only, Zod validation, functional components, 80% Vitest coverage.
- **No violations detected**: Complexity tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer-flow/
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
│   │   └── game.ts              # Add currentRound, drawerId, secretWord to Room; add to RoomSnapshot
│   ├── services/
│   │   └── roomStore.ts         # Extend startGame() to assign drawer + word; gate word in toRoomSnapshot()
│   ├── api/
│   │   └── rooms.ts             # Pass viewerParticipantId to toRoomSnapshot() in startGame POST handler
│   └── services/
│       └── roomStore.test.ts    # Add tests for drawer assignment + word visibility

frontend/
├── src/
│   ├── pages/
│   │   └── GamePage.tsx         # Differentiate drawer/guesser views; sessionStorage restore on mount. Single fetch only — no polling.
│   ├── services/
│   │   └── api.ts               # Add currentRound, drawerId, secretWord? to RoomSnapshot type
│   ├── state/
│   │   └── roomStore.ts         # Add sessionStorage persistence on create/join; restore on init; add setParticipantId
│   └── components/
│       └── CanvasPlaceholder.tsx # NEW component for non-interactive canvas area
```

**Structure Decision**: Option 2 — Web application (`frontend` + `backend`). All changes extend existing starter files, with one new component.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. Complexity tracking not required.
