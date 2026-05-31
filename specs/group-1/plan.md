# Implementation Plan: Group 1 — Room Setup & Lobby

**Branch**: `group-1-room-setup-lobby` | **Date**: 2026-05-31 | **Spec**: [spec.md](spec.md)

---

## Summary

Add `hostId` to the room data model, tighten input validation on player name and room code, wire up automatic 2-second polling in the Lobby, and gate the Start Game button so only the host (with ≥2 participants) can trigger it. All changes extend existing files — no new files, no new dependencies.

---

## Technical Context

**Language/Version**: TypeScript 5.6 (strict mode), Node 18+

**Primary Dependencies**: Express 4, React 18, Zod 3, React Router 6, Vite — all already installed

**Storage**: In-memory `Map<string, Room>` in `backend/src/services/roomStore.ts` — no database

**Testing**: Vitest on both frontend and backend

**Target Platform**: localhost (dev-only); backend port 3001, frontend port 5173

**Project Type**: Fullstack web app (React + Express)

**Performance Goals**: Lobby polling latency ≤2 s per cycle; no throughput requirements for this group

**Constraints**: No WebSockets, no new npm dependencies, TypeScript strict mode must pass after every change

**Scale/Scope**: Single-room session; in-memory only; no persistence across backend restarts

---

## Constitution Check

| Rule | Status | Notes |
|---|---|---|
| Extend existing files only | ✅ | All 6 changed files already exist |
| No new npm dependencies | ✅ | No new packages needed |
| Zod schemas in `api/schemas.ts` | ✅ | Schema changes isolated to that file |
| All API calls through `services/api.ts` | ✅ | No new endpoints; existing functions used |
| Polling via `setInterval`/`clearInterval` only | ✅ | No polling library |
| TypeScript strict, no `any` | ✅ | All new fields are typed |
| No WebSockets | ✅ | Not applicable to this group |
| No database | ✅ | Not applicable to this group |

No constitution violations.

---

## Project Structure

### Source Code (files that change)

```text
backend/src/
├── models/
│   └── game.ts               ← add hostId to Room + RoomSnapshot
├── services/
│   └── roomStore.ts          ← set hostId on createRoom; surface in toRoomSnapshot
└── api/
    ├── schemas.ts            ← tighten playerName + code validation
    └── rooms.ts              ← no structural changes; validation automatic via .parse()

frontend/src/
├── pages/
│   └── LobbyPage.tsx         ← replace manual refresh with setInterval polling; host gate
├── services/
│   └── api.ts                ← no code changes; RoomSnapshot type gains hostId automatically
└── state/
    └── roomStore.ts          ← no code changes; participantId already stored
```

### No new files required.

---

## Phase Design

### Phase 1 — Shared Foundation (must complete before any story work)

**Scope**: Data model changes that every other task depends on. Both backend and frontend TypeScript will fail to compile until `hostId` is on the interfaces.

Tasks: Update `Room` and `RoomSnapshot` in `game.ts` → set `hostId` in `createRoom()` → surface `hostId` in `toRoomSnapshot()`.

**Gate**: `npm run build` passes on the backend. `frontend/src/services/api.ts` must also have `hostId: string` added to its local `RoomSnapshot` interface — it does not import from the backend and owns its own copy of the type. Without this, `room.hostId` is `undefined` in components even though the backend sends it.

---

### Phase 2 — User Story 1: Host Creates Room & Lobby Polls (P1)

**Scope**: `LobbyPage.tsx` — replace manual refresh button with `setInterval` polling; derive `isHost` and render host-gated Start Game button.

Depends on: Phase 1 (needs `room.hostId` in the snapshot).

**Gate**: Open two tabs. Tab A creates a room. Without clicking anything, Tab A's participant list updates within ≤4 seconds of Tab B joining. Tab A sees a disabled Start Game button until Tab B appears, then it enables. Tab B sees "Waiting for host to start..." throughout.

---

### Phase 3 — User Story 2: Player Joins (P1, parallel with Phase 2 on backend)

**Scope**: No backend code changes needed for join itself (already works). This phase is implicitly validated by Phase 2's gate test. However, if the team wants an explicit checkpoint: hit `POST /rooms/:code/join` with a valid code and confirm the response includes `room.hostId`.

---

### Phase 4 — User Story 3: Input Validation (P2)

**Scope**: `schemas.ts` — tighten `playerName` from `z.string().optional()` to `z.string().trim().min(1, "Player name is required")`. Verify the route handler's existing `.parse()` propagates the error through the existing error middleware as a 400.

Depends on: Phase 1 (model must already compile cleanly).

**Gate**: `curl -X POST http://localhost:3001/rooms -H 'Content-Type: application/json' -d '{"playerName":"   "}'` returns 400. `GET /rooms/ZZZZ` returns 404.

---

### Phase 5 — Build & Test Verification

Run `npm run build && npm test` on both packages. No regressions. TypeScript emits zero errors.

---

## Dependency Order

```
Phase 1 (model changes)
    └── Phase 2 (LobbyPage polling + host gate)  ← depends on hostId in snapshot
    └── Phase 3 (join validation smoke test)      ← depends on hostId in response
    └── Phase 4 (schema tightening)               ← depends on build compiling cleanly
            └── Phase 5 (full build + test)
```

Phases 2, 3, and 4 can be done in any order after Phase 1. Phase 5 is always last.

---

## Risk & Notes

- **`playerName` is now required**: The schema change in Phase 4 makes `playerName` mandatory. The existing `CreateRoomPage` and `JoinRoomPage` forms already collect a name from the user, so this should not break the UI flow. Verify the form never submits an empty string before tightening the schema.
- **`void viewerParticipantId`**: The placeholder in `toRoomSnapshot` must be replaced by actually mapping `hostId: room.hostId`. This is the only line in `roomStore.ts` that changes.
- **LobbyPage manual Refresh button**: The spec allows retaining it alongside polling. Simplest path: remove the button and replace with polling-only. Either is valid; choose one and be consistent.
- **TypeScript cascade**: Once `hostId` is added to `Room` and `RoomSnapshot`, TypeScript strict mode will surface every place that constructs either type. Only `createRoom()` constructs `Room` and only `toRoomSnapshot()` constructs `RoomSnapshot` — two sites, easy to fix.
