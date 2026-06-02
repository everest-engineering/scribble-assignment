# Implementation Plan: Room Setup & Lobby

**Branch**: `scribble-lab` | **Date**: 2026-06-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

---

## Summary

Add host identity tracking to the Room model, introduce lobby polling on the frontend (~2s via `setInterval`), enforce input validation on name and room code fields, and gate the Start Game action so only the host can trigger it once at least 2 players are present. A new `POST /rooms/:code/start` endpoint enforces the host check and participant minimum on the backend.

---

## Technical Context

**Language/Version**: TypeScript 5.x — Node.js 18+ (backend), browser (frontend)

**Primary Dependencies**: Backend: Express, Zod; Frontend: React 18, React Router, Vite

**Storage**: In-memory `Map<string, Room>` — no database (by design)

**Testing**: No test framework configured in starter; manual validation via quickstart.md

**Target Platform**: Node.js 18+ HTTP server + modern browser (Chrome/Firefox/Safari)

**Project Type**: Web application — separate `backend/` and `frontend/` directories

**Performance Goals**: Lobby participant list refreshes within ~2 s of a new join; room creation completes in under 5 s on a local network

**Constraints**: No WebSockets; polling only; in-memory store only; no new libraries beyond starter dependencies

**Scale/Scope**: Small multi-player session; a handful of rooms and participants at a time

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield-First | ✅ Pass | Extending existing Room model and handlers; no rewrite |
| II. Spec Kit Traceability | ✅ Pass | spec.md, research.md, data-model.md, contracts/ all committed |
| III. Incremental Validation | ✅ Pass | Scenario 1 only; quickstart.md validates before moving on |
| IV. Scope Discipline | ✅ Pass | No WebSockets, no DB, no auth, no new libraries |
| V. AI Review Discipline | ✅ Pass | All generated code must be reviewed before commit |

No violations. No Complexity Tracking entries required.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md          ← this file
├── research.md      ← Phase 0 decisions
├── data-model.md    ← entity changes
├── quickstart.md    ← manual validation guide
├── contracts/
│   └── api.md       ← endpoint contracts
└── checklists/
    └── requirements.md
```

### Source Code

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts           ← add hostId to Room + RoomSnapshot; expand RoomStatus
│   ├── services/
│   │   └── roomStore.ts      ← set hostId on createRoom; expose in toRoomSnapshot
│   └── api/
│       ├── rooms.ts          ← add startRoom handler; normalize room code to uppercase on join
│       ├── router.ts         ← wire POST /rooms/:code/start
│       └── schemas.ts        ← add StartRoomSchema (participantId)

frontend/
└── src/
    ├── services/
    │   └── api.ts            ← add startGame(); update RoomSnapshot type with hostId
    ├── state/
    │   └── roomStore.ts      ← verify participantId is stored and accessible
    └── pages/
        ├── CreateRoomPage.tsx ← trim + validate name before submit; show inline errors
        ├── JoinRoomPage.tsx   ← trim + validate name + code; uppercase code; show errors
        └── LobbyPage.tsx     ← replace manual refresh with setInterval polling (~2s);
                                 add Start Game button gated on isHost && participants >= 2
```

**Structure Decision**: Web application layout (Option 2). Only files listed above require changes; all other starter files remain untouched.

---

## Implementation Sequence

Work through these slices in order. Validate each slice before moving to the next.

### Slice 1 — Backend: Add `hostId` to Room Model

**Files**: `backend/src/models/game.ts`

- Add `hostId: string` to the `Room` interface.
- Add `hostId: string` to the `RoomSnapshot` interface.
- Expand `RoomStatus` union: `"lobby" | "active"`.

**Validate**: TypeScript compiles without errors (`npm run build` in backend/).

---

### Slice 2 — Backend: Persist and Expose `hostId`

**Files**: `backend/src/services/roomStore.ts`

- In `createRoom`, set `room.hostId = participant.id` (the first participant's UUID).
- In `toRoomSnapshot`, include `hostId: room.hostId` in the returned snapshot.

**Validate**: `POST /rooms` response now includes `hostId` equal to the returned `participantId`.

---

### Slice 3 — Backend: Normalize Room Code + Input Validation

**Files**: `backend/src/api/rooms.ts`, `backend/src/api/schemas.ts`

- In the `joinRoom` handler, uppercase `req.params.code` before lookup.
- Ensure Zod schema rejects empty/whitespace `playerName` on both create and join (`.trim().min(1)`).

**Validate**: Joining with a lowercase code succeeds. Submitting an empty name returns 400.

---

### Slice 4 — Backend: Start Game Endpoint

**Files**: `backend/src/api/rooms.ts`, `backend/src/api/router.ts`, `backend/src/api/schemas.ts`

- Add `StartRoomSchema`: `{ participantId: z.string().uuid() }`.
- Add `startRoom` handler:
  - 404 if room not found.
  - 403 if `body.participantId !== room.hostId`.
  - 400 if `room.participants.length < 2`.
  - Set `room.status = "active"`, update `room.updatedAt`, return snapshot.
- Wire `router.post("/rooms/:code/start", startRoom)` in router.ts.

**Validate**: `POST /rooms/:code/start` with host's participantId returns 200 + `status: "active"`. Non-host returns 403. Single player returns 400.

---

### Slice 5 — Frontend: Type Updates + `startGame` API Call

**Files**: `frontend/src/services/api.ts`

- Add `hostId: string` to `RoomSnapshot` interface.
- Add `startGame(code: string, participantId: string)` method: `POST /rooms/:code/start`.

**Validate**: TypeScript compiles without errors (`npm run build` in frontend/).

---

### Slice 6 — Frontend: Input Validation on Create and Join

**Files**: `frontend/src/pages/CreateRoomPage.tsx`, `frontend/src/pages/JoinRoomPage.tsx`

- `CreateRoomPage`: trim name before submit; if empty after trim, show inline error and do not call API.
- `JoinRoomPage`: trim name and code before submit; show separate inline errors for each; uppercase code before API call.

**Validate**: Empty name on Create Room shows error and does not navigate. Non-existent code shows "Room not found" error from API response.

---

### Slice 7 — Frontend: Lobby Polling

**Files**: `frontend/src/pages/LobbyPage.tsx`

- Remove or repurpose the manual "Refresh" button.
- Add `useEffect` that starts a `setInterval(() => fetchRoom(), 2000)` on mount.
- Clear the interval on unmount (return cleanup function).
- On poll failure, retain the last known room state silently.

**Validate**: Open two tabs, join the same room from Tab B — Tab A shows the new participant within ~2 seconds without any interaction.

---

### Slice 8 — Frontend: Start Game Button with Host Gate

**Files**: `frontend/src/pages/LobbyPage.tsx`, `frontend/src/services/api.ts`

- Read `participantId` from the room store.
- Derive `isHost = participantId === room.hostId`.
- Render Start Game button:
  - Disabled if `!isHost` — display "Waiting for host to start…" message for non-hosts.
  - Disabled if `room.participants.length < 2` — display "Waiting for more players…" for host.
  - Enabled only for host with ≥ 2 participants.
- On click: call `api.startGame(room.code, participantId)`, then navigate to the Game screen on success.
- Lobby polling detects `status === "active"` for non-host players and navigates them to Game automatically.

**Validate**: Full quickstart.md flow passes with two browser tabs.

---

## Data Flow

```
[Tab A — Host]                            [Backend]                       [Tab B — Joiner]
  POST /rooms ──────────────────────────► createRoom(hostId=A)
  ◄─── { participantId: A, room{hostId:A} }

                                                                          POST /rooms/:code/join ──► joinRoom()
                                                                          ◄─── { participantId: B, room{hostId:A, participants:[A,B]} }

  setInterval ──── GET /rooms/:code ────► fetchRoom()                    setInterval ──── GET /rooms/:code
  ◄─── room{participants:[A,B]}                                           ◄─── room{participants:[A,B]}
  (auto-renders Bob in list)

  [host clicks Start Game]
  POST /rooms/:code/start { participantId:A } ──► startRoom() → status:"active"
  ◄─── room{status:"active"}
  navigate to /game

                                                                          next poll detects status:"active"
                                                                          navigate to /game
```

---

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Polling causes state flicker in UI | Medium | Only update React state when snapshot differs from current state |
| participantId lost on page refresh | Medium | Store participantId in sessionStorage or pass via navigation state |
| Race condition: two hosts start simultaneously | Low | In-memory store is single-threaded Node.js; no true concurrency risk |
| Room code collision | Very Low | Generator retries on collision; 4-char code space is large enough for lab scale |
