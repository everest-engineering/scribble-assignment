# Implementation Plan: Room Setup and Lobby

**Branch**: `001-room-setup-and-lobby` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-room-setup-and-lobby/spec.md`

## Summary

Deliver Scenario 1 lobby behavior on the existing brownfield stack: track room host on creation, tighten player-name validation (trim, 1–24 chars, reject empty), enforce 8-participant cap on join, expose `hostParticipantId` in snapshots, add automatic 2 s lobby polling via `useRoomPolling`, gate Start button to host with 2+ players, remove manual refresh, and ensure default API URL is correct. No backend game-start endpoint in this scenario.

## Technical Context

**Language/Version**: TypeScript (Node 18+, strict) on backend and frontend

**Primary Dependencies**: Express, Zod, React 18, React Router v6, Vite, Vitest

**Storage**: In-memory `Map` in `roomStore.ts` only (no persistence)

**Testing**: Vitest in `backend/src/**/*.test.ts` and `frontend/src/**/*.test.ts`

**Target Platform**: Local dev — backend `:3001`, frontend `:5173`

**Project Type**: Web application (Express REST + React SPA)

**Performance Goals**: Polling every 2000 ms ± 100 ms; endpoint responses < 50 ms p95 locally

**Constraints**: HTTP polling only; no WebSockets, DB, or auth; snapshot via `toRoomSnapshot` only

**Scale/Scope**: Up to 8 participants per room; Scenario 1 lobby scope only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Scenario 1 compliance |
|-----------|----------------------|
| I. Code Quality | Typed boundaries; mutations in `roomStore.ts`; no new dependencies |
| II. Testing | New Zod schemas + `roomStore` helpers get Vitest coverage per constitution |
| III. UX | Form errors via `.form__error`; auto-sync replaces manual refresh; role clarity on Start |
| IV. Performance | Single `useRoomPolling` at 2000 ms; visibility pause; cap 8 enforced server-side |
| Non-negotiable | No WebSockets/DB/auth; no start-round backend in this scenario |

**Gate status**: PASS — no constitutional exceptions required.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-and-lobby/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── rooms-api.md
├── spec.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/src/
├── models/game.ts          # add hostParticipantId; extend RoomSnapshot
├── services/roomStore.ts   # host on create, cap check, name validation helper
├── services/roomStore.test.ts
├── api/schemas.ts          # playerNameSchema with trim + length
├── api/schemas.test.ts
└── api/rooms.ts            # 409 on cap; pass host in snapshot

frontend/src/
├── services/api.ts         # hostParticipantId type; default URL
├── services/api.test.ts
├── hooks/useRoomPolling.ts # new shared polling hook
├── state/roomStore.ts      # fetchRoom without toggling isLoading for poll
├── pages/LobbyPage.tsx     # polling, host gating, remove refresh
├── pages/CreateRoomPage.tsx # client-side name trim validation
└── pages/JoinRoomPage.tsx  # client-side code + name validation
```

**Structure Decision**: Extend existing monorepo layout; one new hook file only.

## State Model Changes

### Room (backend `game.ts`)

| Field | Change |
|-------|--------|
| `hostParticipantId` | **Add** — set to creator's participant id in `createRoom` |
| `status` | Unchanged (`"lobby"` only in Scenario 1) |

### RoomSnapshot (backend + frontend types)

| Field | Change |
|-------|--------|
| `hostParticipantId` | **Add** — lets clients determine host for UI gating |

### roomStore service

| Function | Change |
|----------|--------|
| `createRoom` | Set `hostParticipantId`; validate name via shared helper |
| `joinRoom` | Reject when `participants.length >= 8`; validate name |
| `toRoomSnapshot` | Include `hostParticipantId`; keep viewer hook for future Scenario 2 |
| `normalizePlayerName` | **New** pure helper — trim, reject empty, enforce 1–24 |

### Frontend state

| Concern | Change |
|---------|--------|
| Polling | `useRoomPolling` calls `roomStore.fetchRoom()` every 2000 ms on lobby |
| Loading | Poll uses silent fetch (no `isLoading` flip) to avoid button flicker |
| Start gating | `participantId === room.hostParticipantId && participants.length >= 2` |

## Data Flow

```text
CreateRoomPage --POST /rooms--> createRoom --> hostParticipantId set --> LobbyPage
JoinRoomPage --POST /rooms/:code/join--> joinRoom (cap/validation) --> LobbyPage
LobbyPage --useRoomPolling 2000ms--> GET /rooms/:code?participantId= --> toRoomSnapshot
LobbyPage --Start (host, 2+)--> navigate /game (UI only; no start API in Scenario 1)
```

## File-Level Implementation Sequence

1. **Backend model** — `hostParticipantId` on `Room` and `RoomSnapshot`
2. **Backend validation** — `playerNameSchema` in `schemas.ts`; `normalizePlayerName` in `roomStore.ts`
3. **Backend store** — host assignment, cap check, snapshot field
4. **Backend routes** — map cap overflow to `HttpError(409, ...)`
5. **Backend tests** — schemas + roomStore happy/reject paths
6. **Frontend types/api** — mirror snapshot; verify default URL
7. **Frontend hook** — `useRoomPolling.ts` with visibility pause
8. **Frontend pages** — Lobby polling + gating; Create/Join client validation
9. **Frontend tests** — api default URL test; hook test with fake timers

## Complexity Tracking

> No violations — table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
