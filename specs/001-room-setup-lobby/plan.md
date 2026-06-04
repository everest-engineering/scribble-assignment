# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

## Summary

Add host tracking, name validation, lobby auto-polling, and a host-gated Start Game flow to the
existing Scribble scaffold. The backend gains a `hostId` field on `Room`, tightened Zod schemas,
and a new `POST /rooms/:code/start` endpoint. The frontend gains automatic 2-second polling in
the lobby and a Start Game button that is correctly gated by host identity and player count.

## Technical Context

**Language/Version**: TypeScript 5 — backend Node.js 18+, frontend Vite + React 18

**Primary Dependencies**: Express (backend), React Router v6 + `useSyncExternalStore` (frontend),
Zod (backend validation) — all present in the starter; no new top-level dependencies

**Storage**: In-memory `Map<string, Room>` in `roomStore.ts` — no database

**Testing**: Vitest (`vitest.config.ts` present in backend); browser two-tab manual validation
per acceptance criteria

**Target Platform**: Local development (localhost:3001 backend, localhost:5173 frontend)

**Project Type**: Brownfield web application (frontend + REST backend)

**Performance Goals**: Lobby poll cycle ≤ 2 seconds; room creation + lobby navigation < 3 seconds

**Constraints**: No WebSockets, no persistence, no new routing/state libraries, no `any` types

**Scale/Scope**: Session-scoped, 2–N players per room, single active room per tab session

## Constitution Check

*GATE: Must pass before implementation. Re-check after each task.*

| Principle | Check | Status |
|-----------|-------|--------|
| I. Brownfield-First | All changes extend existing files; no file deletions or rewrites | ✅ PASS |
| II. In-Memory Only | `hostId` added to in-memory `Room`; no DB introduced | ✅ PASS |
| III. HTTP Polling | `setInterval`/`clearInterval` in `RoomStore`; no WebSocket | ✅ PASS |
| IV. Deterministic Rules | No game logic (word/scoring) touched in this scenario | ✅ PASS |
| V. TypeScript Strict | All new fields typed; Zod schemas tightened; no `any` | ✅ PASS |
| Out-of-scope guard | No auth, no DB, no WS, no new libraries introduced | ✅ PASS |

No violations — Complexity Tracking section not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── contracts/
│   └── rooms-api.md     ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts          ← extend RoomStatus, add hostId to Room + RoomSnapshot
│   ├── services/
│   │   └── roomStore.ts     ← set hostId on createRoom; add startGame(); tighten displayName()
│   └── api/
│       ├── schemas.ts       ← tighten createRoomSchema + joinRoomSchema; add startGameSchema
│       └── rooms.ts         ← add POST /:code/start route

frontend/
├── src/
│   ├── services/
│   │   └── api.ts           ← extend RoomSnapshot type; add api.startGame()
│   ├── state/
│   │   └── roomStore.ts     ← add pollError to RoomState; add startPolling/stopPolling/startGame
│   └── pages/
│       └── LobbyPage.tsx    ← add useEffect polling; add host-gated Start Game button
```

## Data Flow

### Create Room

```
CreateRoomPage
  └─ roomStore.createRoom(name)
       └─ POST /rooms { playerName }
            └─ Zod: trim, min 1    ← validation gate
            └─ createRoom(name)    ← sets hostId = participants[0].id
            └─ toRoomSnapshot()    ← includes hostId
       └─ setRoomSession({ participantId, room })
  └─ navigate("/lobby")
```

### Join Room

```
JoinRoomPage
  └─ roomStore.joinRoom(code, name)
       └─ POST /rooms/:code/join { playerName }
            └─ Zod: trim, min 1    ← validation gate
            └─ code.toUpperCase()  ← normalisation (already in starter)
            └─ joinRoom(code, name)
            └─ toRoomSnapshot()    ← includes hostId
       └─ setRoomSession({ participantId, room })
  └─ navigate("/lobby")
```

### Lobby Polling

```
LobbyPage mount
  └─ useEffect → roomStore.startPolling(2000)
       └─ setInterval(() => {
            fetchRoom()  ─── GET /rooms/:code?participantId=...
              │ success → setRoomSnapshot(room)
              │           if room.status === "playing" → navigate("/game")  [non-host]
              └ error   → setState({ pollError: message })  // interval continues
          }, 2000)

LobbyPage unmount
  └─ cleanup → roomStore.stopPolling()
       └─ clearInterval(timerId)
```

### Start Game

```
LobbyPage (host, ≥2 players)
  └─ handleStartGame()
       └─ roomStore.startGame()
            └─ POST /rooms/:code/start { participantId }
                 └─ validate: caller === hostId       → 403 if not
                 └─ validate: participants.length ≥ 2 → 400 if not
                 └─ room.status = "playing"
                 └─ saveRoom(room)
                 └─ return { room: toRoomSnapshot() }
            └─ setRoomSnapshot(room)
       └─ navigate("/game")  [host navigates immediately]
```

## Implementation Sequence

Work in this order to keep the app runnable after each step:

1. **Backend model** — extend `RoomStatus`, add `hostId` to `Room` and `RoomSnapshot`
2. **Backend store** — set `hostId` in `createRoom`; expose in `toRoomSnapshot`; tighten `displayName` → reject empty after trim
3. **Backend schemas** — tighten `createRoomSchema` + `joinRoomSchema`; add `startGameSchema`
4. **Backend route** — add `POST /rooms/:code/start` handler
5. **Frontend types** — extend `RoomSnapshot` in `api.ts`; add `api.startGame()`
6. **Frontend store** — add `pollError` to `RoomState`; add `startPolling`/`stopPolling`/`startGame` to `RoomStore`
7. **Frontend lobby** — replace manual refresh with polling `useEffect`; add host-gated Start Game button

Each step compiles and the app remains runnable. Backend steps 1–4 can be validated with curl
before touching the frontend.

## Testing Strategy

**Manual two-tab validation** (per README Scenario 1 acceptance criteria):
1. Tab A: create room → confirm lobby shows host badge, Start Game disabled (1 player)
2. Tab B: join room → within 2s Tab A shows Tab B in list; Start Game enables for Tab A only
3. Tab B: confirm Start Game is visible but permanently disabled ("Only the host can start")
4. Tab A: click Start Game → Tab A navigates immediately; Tab B navigates on next poll
5. Confirm bad inputs: empty name → error shown, no navigation; bad code → error on Join screen

**Unit tests** (Vitest, backend):
- `createRoom` sets `hostId === participants[0].id`
- `startGame` rejects non-host (403), rejects <2 players (400), sets status `playing` (200)
- Zod schemas reject empty/whitespace `playerName`

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Poll interval not cleaned up on fast navigation | Medium | Verify cleanup fn returned from `useEffect` |
| `hostId` missing from snapshot breaks frontend | Low | Type system catches missing field; add to `toRoomSnapshot` in same commit as model change |
| Start Game called twice (double-click) | Low | Disable button after first click (isLoading guard in `withLoading`) |
