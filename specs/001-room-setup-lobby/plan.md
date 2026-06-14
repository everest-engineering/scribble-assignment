# Implementation Plan: Room Setup & Lobby

**Branch**: `scribble-lab` | **Date**: 2026-06-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

## Summary

Deliver the full Room Setup & Lobby slice on the existing scaffold: create/join with non-empty name and code, server-issued participant identity, host designation tied to the creator, room-isolated state, ~2s lobby polling on the client, and a host-only `start` action gated on ≥2 participants. All sync stays HTTP polling; all state stays in-memory; no auth; no new top-level dependencies — per the project constitution.

## Technical Context

**Language/Version**: TypeScript (Node 20 backend via `tsx`; frontend Vite + React 18). Version pinned by `.nvmrc`.

**Primary Dependencies**: Backend — Express, Zod. Frontend — React 18, React Router v6, Vite. Both ESM. No additions for this feature.

**Storage**: In-memory only. Single `Map<code, Room>` in `backend/src/services/roomStore.ts`. No persistence, no DB.

**Testing**: Vitest on both packages (already configured). Backend unit tests for `roomStore` and Zod schemas; frontend unit tests for `services/api.ts` helpers, the polling hook, and pure-function form validators extracted from page modules.

**Target Platform**: Local dev — backend `http://localhost:3001`, frontend `http://localhost:5173`. Browsers: evergreen Chrome / Firefox / Safari.

**Project Type**: Web application (separate `backend/` and `frontend/` packages in one repo).

**Performance Goals**: Lobby update visible to other clients within ~2s of a join (driven by ~2s poll cadence). Tens of concurrent rooms, ≤10 participants per room is sufficient.

**Constraints**:
- HTTP polling only — no WebSockets/SSE/long-poll (Constitution Principle II).
- All data in process memory — no DB, no file persistence (Principle II).
- No auth/sessions/JWT — identity is the opaque `participantId` (Principle II).
- TypeScript strict; `any` forbidden; Zod validates every request payload (Principle III).
- No new top-level dependencies; extend existing modules (Principle IV).

**Scale/Scope**: Lab-scale. Single Node process; no horizontal scaling.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Evaluated against `.specify/memory/constitution.md` v1.0.0:

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Lab-Scope Discipline | PASS | No out-of-scope items in this feature (no DB, no auth, no WebSockets, no rotation/timers/spectators). |
| II | Polling-Only, In-Memory, Stateless | PASS | FR-011 mandates ~2s polling; storage is the existing in-memory `Map`; identity is `participantId`. |
| III | TypeScript-First with Zod-Validated Boundaries | PASS | Tightening existing Zod schemas (`createRoomSchema`, `joinRoomSchema`, `roomCodeParamsSchema`) and adding `startRoomSchema`. Wire types kept in sync between `backend/src/models/game.ts` and `frontend/src/services/api.ts`. |
| IV | Extend, Don't Replace | PASS | All changes extend existing modules: `roomStore.ts`, `rooms.ts`, `schemas.ts`, `LobbyPage.tsx`, `api.ts`. One new file (`frontend/src/hooks/useLobbyPolling.ts`) and colocated test files. No new dependencies. |
| V | Spec-First, Traceable Slices | PASS | Every implementation task traces to FR-001…FR-018; Vitest covers validation, host gating, isolation, and polling cadence. |

**Result**: All gates PASS. Complexity Tracking remains empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── spec.md
├── plan.md              # this file
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── rooms-api.md
├── checklists/
│   └── requirements.md
└── tasks.md             # output of /speckit.tasks
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── router.ts        # mounts /rooms (unchanged)
│   │   ├── rooms.ts         # extend with POST /:code/start; tighten 404 messages
│   │   └── schemas.ts       # tighten name/code; add startRoomSchema
│   ├── models/
│   │   └── game.ts          # add hostParticipantId; add ParticipantView with isHost; extend RoomSnapshot
│   ├── services/
│   │   └── roomStore.ts     # set host on create; case-insensitive lookup; add startRoom()
│   ├── app.ts
│   └── server.ts
└── src/**/*.test.ts         # Vitest specs colocated

frontend/
├── src/
│   ├── pages/
│   │   ├── CreateRoomPage.tsx       # require non-empty name; export validator helper
│   │   ├── JoinRoomPage.tsx         # require non-empty name + code; surface "Room not found"
│   │   └── LobbyPage.tsx            # auto-poll; host badge; host-only Start with ≥2 gate
│   ├── services/
│   │   └── api.ts                   # mirror snapshot fields; add startRoom()
│   ├── state/
│   │   └── roomStore.ts             # rehydrate participantId+code from sessionStorage; clear on 404
│   └── hooks/
│       └── useLobbyPolling.ts       # NEW — interval + visibility-aware
└── src/**/*.test.{ts,tsx}            # Vitest specs colocated
```

**Structure Decision**: Keep the existing two-package layout. Changes are additive: one new endpoint (`POST /rooms/:code/start`), one new field on the `Room` model (`hostParticipantId`), three derived snapshot fields (`hostParticipantId`, `viewerIsHost`, `canStart`) plus per-row `isHost`, and one new client polling hook. No new top-level packages, no new dependencies.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

_None. No deviations from the constitution._
