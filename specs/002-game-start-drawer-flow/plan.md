# Implementation Plan: Game Start & Drawer Flow

**Branch**: `sdd-2-scribble-assignment` (single-branch workflow) | **Date**: 2026-06-01 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/002-game-start-drawer-flow/spec.md`

## Summary

Build on the existing game-start flow (Scenario 1) to: (a) trim player names and reject empty/whitespace-only names, (b) assign the host as the drawer when round 1 begins and display this to all players, (c) deterministically select a secret word from the starter list and show it only to the drawer. The existing `POST /rooms/:code/start` endpoint needs to be extended to assign roles and select the word. The `GET /rooms/:code` response needs per-participant filtering so the word only reaches the drawer.

## Technical Context

**Language/Version**: TypeScript 5.x (backend + frontend)  
**Primary Dependencies**: Backend: Express 4, Zod 3, cors. Frontend: React 18, React Router 6, Vite 5.  
**Storage**: In-memory only (no database — per constitution)  
**Testing**: vitest (both backend and frontend)  
**Target Platform**: Modern web browser (Chrome, Firefox, Safari, Edge)  
**Project Type**: Web application (frontend + backend REST API)  
**Performance Goals**: Secret word and role assignment visible within 1s of game start; drawer identity visible to all players within 2s of game start  
**Constraints**: No WebSockets, no databases, no authentication, HTTP polling only, in-memory state  
**Scale/Scope**: 8–10 concurrent players per room, small-scale lab environment

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Clean Code & Atomic Commits** ✅ — Additive changes to existing files; each slice committed independently.
- **II. Deterministic & Testable Game Logic** ✅ — Word selection is deterministic (same room → same word for round 1); drawer assignment is a pure function of room state; testable with two browser tabs.
- **III. TypeScript Strictness** ✅ — All new code fully typed; `any` forbidden; strict mode enabled.
- **IV. Spec-Artifact Consistency** ✅ — Plan written before implementation; artifacts will be kept in sync.
- **V. Brownfield Respect** ✅ — No starter rewrites; existing endpoints and the GamePage are extended, not replaced.
- **No WebSockets** ✅ — Polling only.
- **No Databases** ✅ — In-memory only.
- **No Authentication** ✅ — No auth.
- **No New Top-Level Dependencies** ✅ — No new libraries required.
- **No Feature Branches** ✅ — Single branch.

**Result**: All gates pass. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer-flow/
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
│   │   └── game.ts           # Room, Participant, RoomSnapshot types (+ roles, round)
│   ├── services/
│   │   ├── roomStore.ts      # Room CRUD, join, start, role/word assignment
│   │   └── roomStore.test.ts
│   └── api/
│       ├── rooms.ts          # POST /rooms/:code/start (extends), GET /rooms/:code (filter word per role)
│       ├── schemas.ts        # Zod validation schemas
│       └── schemas.test.ts

frontend/
├── src/
│   ├── components/
│   │   └── ...               # Existing components (no new components needed)
│   ├── pages/
│   │   ├── LobbyPage.tsx     # Name trimming on create/join flow
│   │   ├── GamePage.tsx      # Show drawer indicator + secret word (per role)
│   │   └── JoinRoomPage.tsx  # Name trimming on join
│   ├── services/
│   │   └── api.ts            # Types for roles and word in RoomSnapshot
│   └── state/
│       └── roomStore.ts      # Role-aware state consumption
```

**Structure Decision**: Option 2 — Web application with backend/ + frontend/ layout matching the existing starter structure and Scenario 1 patterns.

## Complexity Tracking

> All constitution gates pass. No violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
