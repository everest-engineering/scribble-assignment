# Implementation Plan: Room Setup & Lobby

**Branch**: `sdd-2-scribble-assignment` (single-branch workflow) | **Date**: 2026-06-01 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

## Summary

Add host tracking, lobby auto-polling, and host-only game start on top of the existing `POST /rooms`, `POST /rooms/:code/join`, and `GET /rooms/:code` endpoints. The starter lacks: (a) `hostId` on the Room model, (b) automatic lobby polling (currently manual refresh button), (c) a start-game endpoint, and (d) duplicate name disambiguation. These map to additive changes in backend model, service, API, and frontend LobbyPage.

## Technical Context

**Language/Version**: TypeScript 5.x (backend + frontend)  
**Primary Dependencies**: Backend: Express 4, Zod 3, cors. Frontend: React 18, React Router 6, Vite 5.  
**Storage**: In-memory only (no database — per constitution)  
**Testing**: vitest (both backend and frontend)  
**Target Platform**: Modern web browser (Chrome, Firefox, Safari, Edge)  
**Project Type**: Web application (frontend + backend REST API)  
**Performance Goals**: Lobby polling at ~2s intervals; room code generation sub-100ms; join confirmation visible within 1s  
**Constraints**: No WebSockets, no databases, no authentication, HTTP polling only, in-memory state  
**Scale/Scope**: 8–10 concurrent players per room, small-scale lab environment

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Clean Code & Atomic Commits** ✅ — Additive changes to existing files; each slice committed independently.
- **II. Deterministic & Testable Game Logic** ✅ — Room/join/start logic is pure state-machine; can be tested with two browser tabs.
- **III. TypeScript Strictness** ✅ — All new code fully typed; `any` forbidden; strict mode enabled.
- **IV. Spec-Artifact Consistency** ✅ — Plan written before any implementation; artifacts will be kept in sync.
- **V. Brownfield Respect** ✅ — No starter rewrites; endpoints are extended, not replaced.
- **No WebSockets** ✅ — Polling only.
- **No Databases** ✅ — In-memory only.
- **No Authentication** ✅ — No auth.
- **No New Top-Level Dependencies** ✅ — No new libraries required.
- **No Feature Branches** ✅ — Single branch.

**Result**: All gates pass. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts           # Room, Participant, RoomSnapshot types
│   ├── services/
│   │   ├── roomStore.ts      # Room CRUD, join, start logic
│   │   └── roomStore.test.ts
│   └── api/
│       ├── rooms.ts          # POST /rooms, POST /rooms/:code/join, GET /rooms/:code
│       ├── schemas.ts        # Zod validation schemas
│       └── schemas.test.ts

frontend/
├── src/
│   ├── components/
│   │   ├── RoomCodeBadge.tsx # Room code display badge
│   │   ├── PageHeader.tsx
│   │   └── AppShell.tsx
│   ├── pages/
│   │   ├── StartPage.tsx      # Landing page with Create/Join links
│   │   ├── CreateRoomPage.tsx # Create room form
│   │   ├── JoinRoomPage.tsx   # Join room form
│   │   ├── LobbyPage.tsx      # Lobby view with participant list + polling
│   │   └── GamePage.tsx       # Game screen (post-start transition)
│   ├── services/
│   │   ├── api.ts             # API client for room endpoints
│   │   └── api.test.ts
│   └── state/
│       └── roomStore.ts       # Room session state store
```

**Structure Decision**: Option 2 — Web application with backend/ + frontend/ layout matching the existing starter structure.

## Complexity Tracking

> All constitution gates pass. No violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
