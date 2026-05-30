# Implementation Plan: Room Setup & Lobby (Scenario 1)

**Branch**: `scribble-lab` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: Scenario 1 — Room Setup & Lobby. Frontend: React + Vite + TypeScript. Backend: Node.js + Express + TypeScript + Zod.

**Scope boundary**: Implement FR-001–FR-016 only. Stop at `lobby → playing` transition. No drawing, guesses, scoring, drawer/word setup (Scenarios 2–4).

## Summary

Enhance the brownfield starter so players can create/join isolated in-memory rooms, see a synchronized lobby via ~2s HTTP polling, and allow only the host to start when ≥2 players are present. Core work: add `hostId` and viewer-aware snapshots on the backend, a `POST /rooms/:code/start` endpoint, join-code validation, lobby polling hook on the frontend, and host-gated start UI.

## Technical Context

**Language/Version**: TypeScript (ES modules) — Node.js backend, React 18 frontend  
**Primary Dependencies**: Express, Zod, React Router v6, Vite  
**Storage**: In-memory `Map<string, Room>` in `roomStore.ts` — no persistence  
**Testing**: Vitest (backend + frontend); manual two-tab validation (see Testing Strategy)  
**Target Platform**: Local dev — backend `:3001`, frontend `:5173`  
**Performance Goals**: Lobby poll cadence ~2s; join/create visible to peers within 3s (SC-004)  
**Constraints**: HTTP polling only; Zod on all mutating routes; no new top-level dependencies  
**Scale/Scope**: 2–8 players per room; 4 user stories; ~12 files touched

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Requirement | Plan compliance |
|-----------|-------------|-----------------|
| II — Architecture | No WebSockets, DB, auth | ✅ REST + ~2s polling only; in-memory rooms |
| III — Deterministic rules | ~2s poll, isolated rooms, Zod validation | ✅ Polling hook, Map isolation, Zod schemas |
| V — AI / minimal diffs | Brownfield enhancement, no scope creep | ✅ Targeted edits to listed starter files |
| VI — Validation | Two-tab manual + build both apps | ✅ Testing Strategy below |
| VII — Testing | Vitest for pure logic | ✅ roomStore + schema tests planned |

**Post-design re-check**: No violations. Complexity Tracking table not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── spec.md
├── plan.md              # This file
└── tasks.md             # (/speckit-tasks — not yet created)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/game.ts           # + hostId, playing status, snapshot types
│   ├── services/roomStore.ts    # + hostId, startGame, viewer snapshot
│   ├── services/roomStore.test.ts
│   ├── api/schemas.ts           # + startGameSchema, code trim validation
│   ├── api/schemas.test.ts
│   ├── api/rooms.ts             # + POST /:code/start
│   └── api/router.ts            # unchanged (error handler already present)
frontend/
├── src/
│   ├── services/api.ts          # + types, startGame()
│   ├── services/api.test.ts
│   ├── state/roomStore.ts       # + startGame, fetchRoomSilent
│   ├── hooks/useLobbyPolling.ts # NEW — ~2s lobby poll
│   ├── pages/LobbyPage.tsx      # poll, host badge, gated start
│   ├── pages/JoinRoomPage.tsx   # empty code validation
│   ├── pages/CreateRoomPage.tsx # minor: rely on snapshot isHost
│   └── styles/app.css           # host badge styling (minimal)
```

**Structure Decision**: Monorepo web app — extend existing `backend/src` and `frontend/src` paths per constitution Principle I. One new hook file only.

## Starter Gaps (Discovery)

| Area | Current behavior | Required for Scenario 1 |
|------|------------------|-------------------------|
| `Room` model | No `hostId` | Set at create (FR-001) |
| `RoomStatus` | `"lobby"` only | Add `"playing"` (FR-015) |
| `toRoomSnapshot` | Ignores viewer | `isHost`, `canStart`, participant `isHost` (FR-009, FR-012) |
| Start game | UI navigates to `/game` without API | Server-authoritative start (FR-012–015) |
| Lobby sync | Manual refresh only | Auto poll ~2s (FR-010) |
| Join form | No empty-code guard | Client validation (FR-004) |
| Room code schema | Accepts empty string | Trim + min(1) (FR-004) |

## Data Model

### Backend types (`backend/src/models/game.ts`)

- **RoomStatus**: `"lobby" | "playing"` — Scenario 1 adds `"playing"` on successful start.
- **Room**: add `hostId: string` (creator's participant id, immutable). Existing fields unchanged.
- **RoomSnapshot** (API + frontend): add `hostId`, `isHost`, `canStart`; each participant gets `isHost: boolean`.
- **Derived fields** in `toRoomSnapshot(room, viewerParticipantId)`:
  - `isHost` = `viewerParticipantId === room.hostId`
  - `canStart` = `isHost && status === "lobby" && participants.length >= 2`

### State transitions

```text
create  → lobby (hostId = creator, 1 participant)
join    → append participant (lobby only)
start   → playing (host only, ≥2 participants)
```

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/rooms` | Create room; creator is host |
| POST | `/rooms/:code/join` | Join lobby; code trimmed, case-insensitive |
| GET | `/rooms/:code?participantId=` | Poll lobby snapshot |
| POST | `/rooms/:code/start` | Host starts game; body `{ participantId }` |

**Start-game errors**: 403 if not host; 400 if fewer than two players or game already started; 404 if room missing.

**Join errors**: 400 if empty/whitespace code; 404 if room not found.

## Data Flow

### Flow 1 — Create room (P1)

```text
CreateRoomPage → roomStore.createRoom(name)
  → POST /rooms → roomStore.createRoom()
  → set hostId = participant.id, status = lobby
  → toRoomSnapshot(viewerId) → setRoomSession → navigate /lobby
```

### Flow 2 — Join room (P2)

```text
JoinRoomPage → trim code → [empty? show error] 
  → roomStore.joinRoom(code, name)
  → POST /rooms/:code/join → joinRoom() → append participant
  → setRoomSession → navigate /lobby
```

### Flow 3 — Lobby polling (P3)

```text
LobbyPage mounts → useLobbyPolling(2000ms)
  → roomStore.fetchRoomSilent()
  → GET /rooms/:code?participantId=
  → setRoomSnapshot (no isLoading flicker)
  → on error: local pollError, interval continues
  → unmount / status !== lobby → clearInterval
```

### Flow 4 — Start game (P4)

```text
LobbyPage (host, canStart) → roomStore.startGame()
  → POST /rooms/:code/start { participantId }
  → startGame(): validate host, count >= 2, status === lobby
  → status = playing → setRoomSession
  → navigate /game
Other tabs: poll detects status !== lobby → navigate /game
```

## Implementation Sequence

Ordered by user story priority; each slice is independently testable.

### Slice 1 — P1: Host & room creation (FR-001, FR-002, FR-007, FR-008)

**Backend**

1. `game.ts`: Add `hostId` to `Room`; extend `RoomSnapshot` with `hostId`, `isHost`, `canStart`, `ParticipantSnapshot.isHost`; add `"playing"` to `RoomStatus`.
2. `roomStore.ts`: In `createRoom`, set `hostId = participant.id`. Implement viewer-aware `toRoomSnapshot`.
3. `roomStore.test.ts`: Assert hostId set; snapshot `isHost: true` for creator; `canStart: false` with one player.

**Frontend**

4. `api.ts`: Mirror extended snapshot types.
5. `LobbyPage.tsx`: Show host badge on participant where `isHost`; display room code (already via `RoomCodeBadge`).
6. `app.css`: `.player-list__meta--host` or similar for host label.

**Verify**: Tab A create room → one participant, host indicator, code visible.

### Slice 2 — P2: Join & validation (FR-003–FR-006, FR-016)

**Backend**

7. `schemas.ts`: `roomCodeParamsSchema` → `.trim().min(1, "Room code is required")`.
8. `schemas.test.ts`: Empty and whitespace-only codes throw.
9. `roomStore.test.ts`: Join adds participant; unknown code returns null; two rooms isolated.

**Frontend**

10. `JoinRoomPage.tsx`: Trim code before submit; if empty → `setError("Room code is required")`, return early.
11. Ensure API errors surface in form (already present).

**Verify**: Empty/invalid join blocked; valid join adds player to correct room only.

### Slice 3 — P3: Lobby polling (FR-009–FR-011, FR-016)

**Backend**

12. Confirm `GET /rooms/:code` returns updated participant list with host flags (from Slice 1).

**Frontend**

13. `roomStore.ts`: Add `fetchRoomSilent()` — same as `fetchRoom` but no `withLoading`.
14. `hooks/useLobbyPolling.ts`: `setInterval(2000)` when `status === "lobby"`; cleanup on unmount.
15. `LobbyPage.tsx`: Wire hook; keep manual Refresh using `fetchRoom()`; show poll errors without crashing.

**Verify**: Tab A sees Tab B join within ~3s without manual refresh.

### Slice 4 — P4: Start game (FR-012–FR-015)

**Backend**

16. `roomStore.ts`: Add `startGame(code, participantId)` with precondition checks; transition to `playing`.
17. `schemas.ts`: Add `startGameSchema`.
18. `rooms.ts`: Add `POST /:code/start` route.
19. `roomStore.test.ts`: Non-host rejected; solo host rejected; success sets `playing`.

**Frontend**

20. `api.ts`: Add `startGame(code, participantId)`.
21. `roomStore.ts`: Add `startGame()` action.
22. `LobbyPage.tsx`: Show Start only when `room.isHost`; disable/hide when `!room.canStart` with message; call API instead of bare `navigate("/game")`; on poll detect `status !== "lobby"` → navigate `/game`.
23. Non-host: hide Start; show "Waiting for the host to start the game."

**Verify**: Solo start blocked; non-host cannot start; host start moves both tabs out of lobby.

## File Change Reference

| File | Changes |
|------|---------|
| `backend/src/models/game.ts` | `hostId`, `playing`, snapshot fields |
| `backend/src/services/roomStore.ts` | host on create, `startGame`, viewer snapshot |
| `backend/src/services/roomStore.test.ts` | host, join, start, isolation tests |
| `backend/src/api/schemas.ts` | code trim, `startGameSchema` |
| `backend/src/api/schemas.test.ts` | code validation tests |
| `backend/src/api/rooms.ts` | `POST /:code/start` |
| `frontend/src/services/api.ts` | types + `startGame` |
| `frontend/src/services/api.test.ts` | update mocks for new fields |
| `frontend/src/state/roomStore.ts` | `fetchRoomSilent`, `startGame` |
| `frontend/src/hooks/useLobbyPolling.ts` | **new** — 2s interval hook |
| `frontend/src/pages/LobbyPage.tsx` | polling, host UI, gated start |
| `frontend/src/pages/JoinRoomPage.tsx` | empty code validation |
| `frontend/src/styles/app.css` | host badge style |

**Not modified in Scenario 1**: `GamePage.tsx` gameplay, `GuessForm`, scoring, word selection.

## Testing Strategy

| Layer | What | Maps to |
|-------|------|---------|
| Vitest | `createRoom` sets hostId; join isolation; start preconditions; schema trim | FR-001–007, FR-012–014 |
| Manual two-tab | Flows below | P1–P4, SC-001–SC-008 |
| Build | `npm run build` both apps | Constitution VI |

**Manual validation** (two tabs, backend `:3001`, frontend `:5173`):

1. **P1**: Tab A creates room → lobby shows code, 1 participant, host badge, start blocked.
2. **P2**: Tab B joins with valid code; empty/invalid codes show errors. Two rooms stay isolated.
3. **P3**: Tab A sees Tab B appear within ~3s without clicking Refresh.
4. **P4**: Solo start blocked; non-host has no start button; host start moves both tabs to `/game`.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Poll flicker from `isLoading` | Use `fetchRoomSilent` for interval polls |
| Client bypasses start rules | Server enforces all preconditions on `POST /start` |
| Cross-room leakage | Map keyed by code; tests with two rooms |
| Scope creep into Scenario 2 | `/game` navigation only; no drawer/word in this plan |

## Out of Scope Reminders

- WebSockets, SSE, Socket.io
- Database or file persistence
- Authentication / sessions
- Drawing, guesses, scoring, secret word, drawer assignment
- Multiple rounds, rotation, timers, custom word packs
- Spectators, kick/mute, room passwords
- New state-management or routing libraries

## Complexity Tracking

> No constitution violations requiring justification.

**Next step**: Run `/speckit-tasks` to generate ordered `tasks.md` from this plan.
