# Implementation Plan: Lobby & Host Management

**Branch**: `assignment` | **Date**: 2026-06-08 | **Spec**: `specs/001-lobby-host-management/spec.md`

**Input**: Feature specification from `specs/001-lobby-host-management/spec.md`

## Summary

Add host tracking (`isHost` flag on participants, `hostId` on rooms), player name validation (empty/whitespace reject, trim, max 30 chars), lobby auto-polling (2s interval via HTTP), and host-only game start (start endpoint, host-gated UI). Approach: additive changes to existing room model, room store, and lobby page — no new dependencies.

## Technical Context

**Language/Version**: TypeScript ES2022+ (strict mode enabled in both tsconfigs)

**Primary Dependencies**: Backend: Express 4, Zod 3; Frontend: React 18, React Router 6, Vite 5

**Storage**: In-memory (Map in `roomStore.ts`) — no database

**Testing**: Vitest (both backend and frontend)

**Target Platform**: Web browser (Chrome/Firefox/Safari) + Node.js server (v18+)

**Project Type**: Web application (monorepo with `backend/` Express API + `frontend/` React SPA)

**Performance Goals**: Lobby poll interval ~2s (FR-007); lobby updates visible within 3s (SC-002); no visual flicker on refresh (FR-008)

**Constraints**: No WebSockets (HTTP polling only — Constitution III); no database (Constitution IV); no auth (AGENTS.md); all state lossy on restart

**Scale/Scope**: Single-server, small multiplayer game lobbies (dozens of rooms, hundreds of participants max)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. TypeScript Strictness** | ✅ PASS | Strict mode enabled. All new types (host field, name validation) use typed interfaces + Zod schemas. |
| **II. Brownfield Enhancement** | ✅ PASS | Additive changes only: field additions to existing models, new endpoint, new UI logic. No rewrites. |
| **III. HTTP Polling** | ⚠️ NOT YET VIOLATED | Currently manual refresh only. Phase 1/2 will implement auto-polling. No WebSockets introduced. |
| **IV. In-Memory State** | ✅ PASS | Room store already in-memory. Host field stored in Map. No database introduced. |
| **V. Incremental & Verifiable** | ✅ PASS | Spec has Given/When/Then scenarios. Each FR is independently testable. |

**Gate Decision**: PASS — all principles satisfied or will be satisfied by the implementation.

## Project Structure

### Documentation (this feature)

```text
specs/001-lobby-host-management/
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
│   ├── models/game.ts           # Add hostId to Room, RoomStatus "playing", ParticipantSnapshot type
│   ├── services/roomStore.ts    # Host assignment on create, validation, host transfer, room cleanup
│   └── api/rooms.ts             # Add POST /rooms/:code/start endpoint
│   └── api/schemas.ts           # Update/create Zod schemas for name validation, start game
└── tests/
    └── services/roomStore.test.ts  # Add host, validation, transfer tests

frontend/
├── src/
│   ├── pages/LobbyPage.tsx      # Auto-polling, host-only start button, participant-host visual
│   ├── pages/JoinRoomPage.tsx   # Inline error messages for validation
│   ├── pages/CreateRoomPage.tsx # Inline error messages for validation
│   ├── services/api.ts          # Add startGame method
│   └── state/roomStore.ts       # Add startGame action, polling hook logic
└── tests/
    └── services/api.test.ts     # Add startGame test
```

**Structure Decision**: Web application structure (Option 2) — backend Express API + frontend React SPA. This matches the existing codebase layout.

## Complexity Tracking

No constitutional violations to justify. All changes are additive and within the existing architectural boundaries.

### Key Dependencies

| Dependency | Scope | Notes |
|------------|-------|-------|
| `structuredClone` | Backend (roomStore) | Used for snapshot derivation in `toRoomSnapshot`; must not mutate live room state |
| `Zod` validation | Backend + Frontend | Runs before any room state mutation to prevent partial corruption under concurrent requests |

### Server Lifecycle

- **Startup**: Room store initialises as empty `Map`. No persistence across restarts.
- **Shutdown**: All in-memory state is lost. Clients detect this on next poll (HTTP 404) and are redirected to the join page per FR-021.
- **Constitution IV compliance**: No database dependency. State is ephemeral by design. No cleanup/shutdown hooks required.

### Polling Load Assessment

| Factor | Estimate | Notes |
|--------|----------|-------|
| Target scale | ~100 rooms × ~400 participants | Per Plan §Scale/Scope |
| Poll interval | 2s (1.5–2.5s tolerance) | Per FR-007 |
| Polls/second at scale | 100 rooms × 0.5 Hz = 50 req/s | GET /rooms/:code is a lightweight in-memory lookup |
| Expected CPU impact | Negligible (< 1% per core) | No DB queries, no I/O blocks; key lookup in `Map` |
| Network bandwidth | ~400 bytes per response × 50 req/s ≈ 20 KB/s | Trivial for a single Node.js process |
