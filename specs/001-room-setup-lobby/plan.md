# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-10 | **Spec**: `specs/001-room-setup-lobby/spec.md`

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Players can create or join a drawing game room via a unique 4-character alphanumeric code. The creator is designated as host. Invalid/empty codes are rejected with clear feedback. Rooms are fully isolated via in-memory Map. The lobby refreshes via HTTP polling (~2s). Only the host can start the game once at least 2 players are present — this transitions the room from `"lobby"` to `"playing"` status, signaling all clients to navigate to the game view. Room cleanup runs every 5 minutes for inactive rooms.

## Technical Context

**Language/Version**: TypeScript 5.6 (backend, Node.js) / TypeScript (frontend, browser)

**Primary Dependencies**: Express 4.21 + Zod 3.23 (backend), React 18 + React Router 6 + Vite (frontend)

**Storage**: N/A — in-memory only (Map<string, Room> in roomStore)

**Testing**: Vitest 3.1 (both backend and frontend, co-located *.test.ts files)

**Target Platform**: Node.js 20+ (backend), modern browsers (frontend)

**Project Type**: Web application (frontend + backend, monorepo)

**Performance Goals**: Room creation <2s, join visibility <3s, lobby refresh <3s, error feedback <1s

**Constraints**: In-memory state only — lost on restart; no WebSockets; no auth; no database; 5-min room cleanup; ~2s polling interval

**Scale/Scope**: Single server process; no max players per room; unbounded room count (bounded by 5-min cleanup)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Assessment |
|-----------|--------|------------|
| **I. TypeScript-First** | PASS | All code is fully typed; strict mode enabled; no `any` usage |
| **II. RESTful HTTP Polling** | PASS | Lobby refresh uses HTTP GET polling at ~2s; non-host clients detect game start on next poll when status transitions to `"playing"`; no WebSockets |
| **III. In-Memory State Only** | PASS | Room state in-memory Map; status transitions in-memory; 5-min cleanup of inactive rooms |
| **IV. Deterministic Game Logic** | PASS | Room code generation uses random selection (standard for lobby); game logic (word selection, scoring) not yet in scope |
| **V. Incremental Implementation** | PASS | Following Spec Kit phases; feature is self-contained |
| **Out-of-Scope Boundaries** | PASS | No WebSockets, databases, auth, deployment, or other prohibited features |

**Result**: ALL GATES PASS — no violations. Complexity Tracking section omitted.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── router.ts
│   │   ├── rooms.ts
│   │   ├── schemas.ts
│   │   └── schemas.test.ts
│   ├── models/
│   │   └── game.ts
│   ├── services/
│   │   ├── roomStore.ts
│   │   ├── roomStore.test.ts
│   │   └── cleanup.ts          # NEW: room cleanup interval
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
│   │   ├── PageHeader.tsx
│   │   ├── RoomCodeBadge.tsx
│   │   ├── GuessForm.tsx
│   │   ├── Scoreboard.tsx
│   │   └── ResultPanel.tsx
│   ├── pages/
│   │   ├── StartPage.tsx
│   │   ├── CreateRoomPage.tsx
│   │   ├── JoinRoomPage.tsx
│   │   ├── LobbyPage.tsx        # MODIFY: add auto-polling, host indicator, start game
│   │   └── GamePage.tsx
│   ├── routes/
│   │   └── index.tsx
│   ├── services/
│   │   └── api.ts
│   ├── state/
│   │   └── roomStore.ts
│   ├── styles/
│   │   └── app.css
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

**Structure Decision**: Web application (frontend + backend) — Option 2 from template. Backend uses existing Express routes/services pattern. Frontend uses existing pages/components/state pattern.

## Complexity Tracking

*Intentionally omitted — no constitution violations to justify.*
