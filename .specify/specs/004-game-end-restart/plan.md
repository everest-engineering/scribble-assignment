# Implementation Plan: Round End and Game Restart

**Branch**: `004-game-end-restart` | **Date**: 2026-06-03 | **Spec**: [.specify/specs/004-game-end-restart/spec.md](spec.md)

## Summary
The goal is to implement round termination logic (manual by host and automatic when all active guessers succeed) and a game restart flow. Key technical highlights include:
1. **Backend**: Host-only endpoints for `/end` and `/restart`, automatic completion logic in the guess handler, and robust "First to Server" transition guards.
2. **Frontend UI**: A new `RoundEndedModal` following a strict vertical layout with max-height constraints (200px) and a host "End Round" button integrated into the existing `button-row`.
3. **UX Flow**: Non-blocking toast errors for host actions and automatic client-side navigation back to `/lobby` upon detection of a successful restart.

## Technical Context
**Language/Version**: TypeScript 5.x, Node.js 18+

**Primary Dependencies**: React 18, Vite, Express, Zod, Vitest

**Storage**: In-memory (Room Store)

**Testing**: Vitest (Unit and Integration)

**Target Platform**: **Desktop Web ONLY** (Mobile/Tablet out of scope)

**Performance Goals**: Restart perception < 1s; Navigation triggered via 2s polling interval

**Constraints**: Principle II (HTTP Polling), Principle VI (90% Coverage). Accessibility is explicitly out of scope.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Ensure compliance with [Scribble Assignment Constitution](.specify/memory/constitution.md):
1. **TypeScript**: Strict mode enabled (Principle I). ✅
2. **Stack**: Frontend (React 18/Vite), Backend (Node/Express/Zod/HTTP Polling). No WebSockets, DBs, Auth (Principle II). ✅
3. **Architecture**: Clean separation (api/services/models/state), functional components, immutable structures (Principle III). ✅
4. **Minimalism**: Minimal memory footprint, no extra features, no unjustified dependencies (Principle IV). ✅
5. **Scope**: Strictly adhere to defined features. No unrelated refactors (Principle V). ✅
6. **Testing**: Vitest for all tests, minimum 90% code coverage, and mandatory automated verification before merge (Principle VI). ✅

## Project Structure

### Documentation (this feature)

```text
.specify/specs/004-game-end-restart/
├── plan.md              # This file
├── research.md          # Modal decisions, UI placement, and Device Scope
├── data-model.md        # State transition triggers and Terminology
├── quickstart.md        # Step-by-step implementation guide
├── contracts/           
│   └── api.md           # /end and /restart endpoints
└── tasks.md             # Implementation tasks
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── services/        # roomStore.ts (End/Restart logic)
│   └── api/             # rooms.ts (Endpoints + Guess trigger)
└── tests/

frontend/
├── src/
│   ├── components/      # RoundEndedModal.tsx
│   ├── pages/           # GamePage.tsx (End button + Navigation)
│   ├── services/        # api.ts (Endpoints)
│   └── state/           # roomStore.ts (Actions)
└── tests/
```

**Structure Decision**: Standard full-stack web structure.

## Host Verification Strategy

To ensure authorized access to host-only actions (End Round, Restart Game):
- Always utilize the `isHost` boolean property provided by the `RoomSnapshot` object fetched from the backend (`room.isHost`).
- Do NOT derive host status from participant list data (`participantId === hostId` logic inside the UI), as `isHost` is the authoritative flag provided by the API for the current viewer.
