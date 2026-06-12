# Implementation Plan: Room Creation and Join

**Branch**: `001-create-join-room` | **Date**: 2026-06-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Enable players to create and join isolated drawing-game rooms via unique 4-character codes. The creator becomes the host. The lobby auto-refreshes via HTTP polling (~2s). Only the host can start the game once at least 2 players are present. Invalid or empty inputs are rejected with clear feedback. The implementation extends the existing Express backend and React frontend starter without rewriting core structure.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Node.js 22 (from `.nvmrc`), TypeScript 5.6

**Primary Dependencies**: Express 4.21, React 18.3, React Router 6.30, Vite 5.4, Zod 3.23

**Storage**: In-memory only (no database; `Map<string, Room>` in `backend/src/services/roomStore.ts`)

**Testing**: vitest 3.1 (backend and frontend)

**Target Platform**: Modern web browsers (ES2022+)

**Project Type**: Web application (backend + frontend)

**Performance Goals**: Room create/join < 2s; lobby refresh < 500ms per poll

**Constraints**: HTTP polling only (no WebSockets/SSE); in-memory state must be explicitly cleaned up; no authentication/session persistence

**Scale/Scope**: Single-server deployment; concurrent rooms bounded by memory; expected < 100 concurrent rooms for evaluation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Evaluation | Notes |
|-----------|------------|-------|
| I. TypeScript-First & Strict Typing | Pass | All changes use strict types; Zod validates requests/responses |
| II. In-Memory State Discipline | Pass | Room store remains a `Map`; cleanup added for 0-player and idle rooms |
| III. HTTP Polling Only | Pass | Lobby refresh uses `setInterval` + `fetch` (~2s); no WebSockets introduced |
| IV. Extend the Starter | Pass | Edits confined to existing `roomStore.ts`, `rooms.ts`, schemas, `LobbyPage.tsx`, `api.ts`, `roomStore.ts` (state) |
| V. Phased Implementation | Pass | This is the first feature group (Room Setup); Game Start / Gameplay follow in later features |

**Post-Design Re-check**: Pass — all principles upheld by the design. No new dependencies, no real-time protocols, in-memory cleanup planned, strict typing preserved, changes scoped to existing files.

## Project Structure

### Documentation (this feature)

```text
specs/001-create-join-room/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts
│   │   ├── router.ts
│   │   ├── schemas.ts
│   │   └── schemas.test.ts
│   ├── models/
│   │   └── game.ts
│   ├── services/
│   │   ├── roomStore.ts
│   │   └── roomStore.test.ts
│   ├── seed/
│   │   └── starterData.ts
│   ├── app.ts
│   └── server.ts
└── package.json

frontend/
├── src/
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── Card.tsx
│   │   ├── GuessForm.tsx
│   │   ├── PageHeader.tsx
│   │   ├── ResultPanel.tsx
│   │   ├── RoomCodeBadge.tsx
│   │   └── Scoreboard.tsx
│   ├── pages/
│   │   ├── StartPage.tsx
│   │   ├── CreateRoomPage.tsx
│   │   ├── JoinRoomPage.tsx
│   │   ├── LobbyPage.tsx
│   │   └── GamePage.tsx
│   ├── routes/
│   │   └── index.tsx
│   ├── services/
│   │   ├── api.ts
│   │   └── api.test.ts
│   ├── state/
│   │   └── roomStore.ts
│   ├── styles/
│   │   └── app.css
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

**Structure Decision**: Option 2 — Web application with separate `backend/` and `frontend/` packages. This matches the existing monorepo layout. All feature work stays within the established directories.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations.
