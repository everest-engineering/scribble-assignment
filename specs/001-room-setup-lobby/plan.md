# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

## Summary

Add host tracking and start-game gating to the existing room creation/join flow, replace
the manual Refresh button in the Lobby with automatic ~2 s polling, and enforce all
missing input validations (empty name, empty/unknown code). The approach is a targeted
brownfield edit: extend the backend `Room` model and Zod schemas, update the three
service/store functions that mutate room state, add one new `POST /rooms/:code/start`
endpoint, and update the two frontend pages (`LobbyPage`, `CreateRoomPage`,
`JoinRoomPage`) plus the shared API client and state store.

## Technical Context

**Language/Version**: TypeScript 5.6, Node.js 18+

**Primary Dependencies**:
- Backend: Express 4, Zod 3, tsx (dev runner), Vitest (tests)
- Frontend: React 18, React Router v6, Vite 5, Vitest (tests)

**Storage**: In-memory `Map<string, Room>` in `backend/src/services/roomStore.ts` — no
database, no file system.

**Testing**: Vitest (`npm run test`) in both `backend/` and `frontend/`.

**Target Platform**: Local development — backend on `http://localhost:3001`, frontend on
`http://localhost:5173`.

**Project Type**: Web application (REST backend + React SPA frontend).

**Performance Goals**: All API responses under 100 ms on localhost. Lobby polling at
~2 s intervals with no UI jank.

**Constraints**: No WebSockets, no database, no authentication, no new npm dependencies.

**Scale/Scope**: Lab-scale — small number of simultaneous rooms, browser-tab-level
isolation, single-round gameplay.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript First | ✅ PASS | All new files `.ts`/`.tsx`; no `any` introduced |
| II. In-Memory Only | ✅ PASS | `hostId` added to the in-memory `Room` struct only |
| III. HTTP Polling Only | ✅ PASS | Lobby uses `setInterval` + `GET /rooms/:code` |
| IV. Validate at Boundaries (Zod) | ✅ PASS | All new inputs validated via Zod in `schemas.ts` |
| V. Incremental, Spec-Driven | ✅ PASS | Plan follows spec exactly; no scope beyond Scenario 1 |

**Post-design re-check**: ✅ All principles hold after Phase 1 design — no new
violations introduced.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md          ← this file
├── research.md      ← Phase 0 findings
├── data-model.md    ← Phase 1 entity model
├── quickstart.md    ← Phase 1 verification guide
├── contracts/
│   └── api.md       ← Phase 1 HTTP contract
└── tasks.md         ← Phase 2 (created by /speckit.tasks)
```

### Source Code (files touched by this feature)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts              ← add hostId to Room; extend RoomSnapshot; extend RoomStatus
│   ├── services/
│   │   ├── roomStore.ts         ← createRoom stores hostId; new startRoom() function
│   │   └── roomStore.test.ts    ← new tests for hostId, startRoom, validation
│   └── api/
│       ├── schemas.ts           ← tighten createRoom/joinRoom (non-empty name); startRoom schema
│       ├── schemas.test.ts      ← new schema validation tests
│       └── rooms.ts             ← add POST /rooms/:code/start endpoint

frontend/
└── src/
    ├── services/
    │   └── api.ts               ← add startRoom(); fix API_BASE_URL (/bug → empty)
    ├── state/
    │   └── roomStore.ts         ← add startRoom(); expose isHost helper
    └── pages/
        ├── CreateRoomPage.tsx   ← client-side empty-name validation
        ├── JoinRoomPage.tsx     ← client-side empty-name/code validation
        └── LobbyPage.tsx        ← replace manual refresh with setInterval polling;
                                    host indicator; conditional Start button
```
