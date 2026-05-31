# Tasks: Group 2 — Game Start & Drawer Flow

**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel with other [P] tasks in the same phase
- **[US#]**: User story this task belongs to

---

## Phase 1: Backend Model Extension (BLOCKING)

**Purpose**: Widen `RoomStatus`, add new fields to `Room` and `RoomSnapshot`. TypeScript will not compile on the backend until all tasks in this phase are complete — fix all errors in one pass.

**⚠️ CRITICAL**: No other phase can begin until `npm run build` in `backend/` exits 0.

- [ ] T001 [US1] In `backend/src/models/game.ts`: widen `RoomStatus` to `"lobby" | "playing"`
- [ ] T002 [US1] In `backend/src/models/game.ts`: add `drawerParticipantId: string | null` and `currentWord: string | null` to the `Room` interface
- [ ] T003 [US1] In `backend/src/models/game.ts`: add `drawerParticipantId: string | null`, `currentWord: string | null`, and `viewerRole: ParticipantRole | null` to the `RoomSnapshot` interface
- [ ] T004 [US1] In `backend/src/services/roomStore.ts` → `createRoom()`: add `drawerParticipantId: null, currentWord: null` to the room literal (TypeScript enforces this after T002)
- [ ] T005 [US1] In `backend/src/services/roomStore.ts` → `toRoomSnapshot()`: add `drawerParticipantId: room.drawerParticipantId`, `currentWord: null` (placeholder — correct gating added in Phase 2 T008), and `viewerRole: null` (placeholder) to the returned object to satisfy TypeScript (TypeScript enforces this after T003)

**Checkpoint**: `npm run build` in `backend/` exits 0 with zero TypeScript errors. No functional behaviour changes yet — word gating and role derivation are placeholders until Phase 2.

---

## Phase 2: `startGame()` Service + `toRoomSnapshot()` Logic

**Purpose**: Implement the core game-start business logic and correct the word/role gating in the snapshot.

**Depends on**: Phase 1 complete.

- [ ] T006 [US1] In `backend/src/services/roomStore.ts`: add `startGame(code: string, participantId: string)` function that returns a discriminated result object:
  - `{ code: "NOT_FOUND" }` — room does not exist
  - `{ code: "FORBIDDEN" }` — `participantId !== room.hostId`
  - `{ code: "CONFLICT" }` — `room.status === "playing"`
  - `{ code: "BAD_REQUEST" }` — `room.participants.length < 2`
  - `{ code: "OK", room: Room }` — sets `status = "playing"`, `drawerParticipantId = room.participants[0].id`, `currentWord = STARTER_WORDS[0]`, calls `saveRoom(room)`
- [ ] T007 [US2] In `backend/src/services/roomStore.ts` → `toRoomSnapshot()`: replace the `currentWord: null` placeholder (T005) with real gating: return `room.currentWord` only when `room.drawerParticipantId !== null && viewerParticipantId === room.drawerParticipantId`, otherwise `null`
- [ ] T008 [US2] In `backend/src/services/roomStore.ts` → `toRoomSnapshot()`: replace the `viewerRole: null` placeholder (T005) with real derivation: `"drawer"` if `viewerParticipantId === room.drawerParticipantId && room.drawerParticipantId !== null`, `"guesser"` if `viewerParticipantId` is present and not the drawer, `null` otherwise

**Checkpoint**: Manually call `startGame("XXXX", "...")` in a test or `console.log` — confirm it returns `NOT_FOUND` for unknown codes before the route is wired.

---

## Phase 3: Schema + Route (Backend) — parallel with Phase 4

**Purpose**: Expose `POST /rooms/:code/start` over HTTP.

**Depends on**: Phase 2 complete.

- [ ] T009 [US1] In `backend/src/api/schemas.ts`: add `export const startRoomSchema = z.object({ participantId: z.string().trim().min(1, "Participant ID is required") })`
- [ ] T010 [US1] In `backend/src/api/rooms.ts`: add `POST /:code/start` route after the existing `POST /:code/join` route; import `startGame` from `roomStore` and `startRoomSchema` from `schemas`; translate result codes to HTTP statuses:
  - `NOT_FOUND → 404`
  - `FORBIDDEN → 403`
  - `CONFLICT → 409`
  - `BAD_REQUEST → 400`
  - `OK → 200` with body `{ participantId: body.participantId, room: toRoomSnapshot(result.room, body.participantId) }`

**Checkpoint**: All five curl smoke tests pass:
```bash
# Setup: create a room first
CODE=$(curl -s -X POST http://localhost:3001/rooms \
  -H 'Content-Type: application/json' \
  -d '{"playerName":"Alice"}' | jq -r '.room.code')
HOST_ID=$(curl -s -X POST http://localhost:3001/rooms \
  -H 'Content-Type: application/json' \
  -d '{"playerName":"Alice"}' | jq -r '.participantId')

# → 400 (only 1 participant)
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/rooms/$CODE/start \
  -H 'Content-Type: application/json' -d "{\"participantId\":\"$HOST_ID\"}"

# Join a second player then retry → 200
# Non-host participantId → 403
# Second start call → 409
# Unknown code → 404
```

---

## Phase 4: Frontend Types + API Function — parallel with Phase 3

**Purpose**: Extend the frontend's local `RoomSnapshot` type and add `api.startGame()`.

**Depends on**: Phase 2 complete (backend must compile so you know the exact shape).

- [ ] T011 [US1] In `frontend/src/services/api.ts`: widen `RoomSnapshot.status` from `"lobby"` to `"lobby" | "playing"`
- [ ] T012 [US2] In `frontend/src/services/api.ts`: add `drawerParticipantId: string | null`, `currentWord: string | null`, and `viewerRole: "drawer" | "guesser" | null` to the local `RoomSnapshot` interface
- [ ] T013 [US1] In `frontend/src/services/api.ts`: add `startGame(code: string, participantId: string)` to the `api` object — `POST /rooms/:code/start` with body `{ participantId }`, returning `Promise<RoomSessionResponse>`

**Checkpoint**: `npm run build` in `frontend/` exits 0. TypeScript surfaces `room.viewerRole` and `room.drawerParticipantId` as valid fields in `GamePage.tsx` and `LobbyPage.tsx`.

---

## Phase 5: LobbyPage — Wire Start Game Button + Status-Driven Navigation (US1)

**Purpose**: Replace the placeholder `navigate("/game")` with a real API call AND ensure all non-host participants are forwarded to `/game` when the room status changes to `"playing"` via polling.

**Depends on**: Phase 3 and Phase 4 both complete.

- [ ] T014 [US1] In `frontend/src/pages/LobbyPage.tsx`: add `startError` state (`useState<string | null>(null)`)
- [ ] T015 [US1] In `frontend/src/pages/LobbyPage.tsx`: replace `onClick={() => navigate("/game")}` on the Start Game button with an async handler that:
  1. Calls `api.startGame(room.code, participantId)` (import `api` from `../services/api`)
  2. On success: calls `roomStore.setRoomSession(response)` then `navigate("/game")`
  3. On error: sets `startError` to the error message
- [ ] T016 [US1] In `frontend/src/pages/LobbyPage.tsx`: render `startError` below the Start Game button when non-null
- [ ] T016a [US1] In `frontend/src/pages/LobbyPage.tsx`: add a `useEffect` that watches `room?.status` and calls `navigate("/game", { replace: true })` when it equals `"playing"` — this is the **only** navigation path for non-host participants

**Checkpoint**: Two-tab test — Tab A (host) clicks Start Game → **Tab B navigates to `/game` automatically within ≤4 seconds** with no user action. Both see their correct role banners on the game screen.

---

## Phase 6: GamePage — Polling + Role Banners (US2 + US3)

**Purpose**: Make the game screen live and role-aware.

**Depends on**: Phase 5 complete (game must be startable to test role rendering).

- [ ] T017 [US3] In `frontend/src/pages/GamePage.tsx`: add `useRoomStore` import alongside `useRoomState`; add a `useEffect` with `setInterval(() => { roomStore.fetchRoom().catch(() => {}) }, 2000)` and `clearInterval` cleanup — identical pattern to `LobbyPage`
- [ ] T018 [US2] In `frontend/src/pages/GamePage.tsx`: derive `drawerName` from `room.participants.find(p => p.id === room.drawerParticipantId)?.name ?? "Unknown"`
- [ ] T019 [US2] In `frontend/src/pages/GamePage.tsx`: render a role banner above the canvas area:
  - `room.viewerRole === "drawer"`: `<p>You are the Drawer — draw: {room.currentWord}</p>`
  - `room.viewerRole === "guesser"`: `<p>You are a Guesser — guess the word!</p>`
  - Show to all: `<p>{drawerName} is drawing</p>`
- [ ] T020 [US2] In `frontend/src/pages/GamePage.tsx`: pass `disabled={room.viewerRole === "drawer"}` to `<GuessForm />`

**Checkpoint**: 
- Tab A (drawer): sees "You are the Drawer — draw: rocket", "Alice is drawing", GuessForm disabled
- Tab B (guesser): sees "You are a Guesser — guess the word!", "Alice is drawing", GuessForm enabled
- DevTools Network: `GET /rooms/:code` fires every ~2 s; stops after clicking Exit Game

---

## Phase 7: Build & Test Verification

**Purpose**: Confirm clean build and no regressions.

- [ ] T021 [P] Run `npm run build` in `backend/` — zero TypeScript errors
- [ ] T022 [P] Run `npm run build` in `frontend/` — zero TypeScript errors
- [ ] T023 [P] Run `npm test` in `backend/` — all tests pass
- [ ] T024 [P] Run `npm test` in `frontend/` — all tests pass

**Checkpoint**: All four commands exit 0. Group 2 is complete.

---

## Dependencies & Execution Order

```
T001–T003  (Phase 1 — game.ts, do in one edit pass)
    ↓
T004–T005  (Phase 1 — roomStore.ts placeholders, do in one edit pass)
    ↓
T006       (Phase 2 — startGame() function)
    ↓
T007–T008  (Phase 2 — toRoomSnapshot() gating, do in one edit pass)
    ↓
T009–T010  (Phase 3 — schema + route)    T011–T013  (Phase 4 — frontend types + api, do in one edit pass)
    ↓                                              ↓
T014–T016  (Phase 5 — LobbyPage wiring, sequential in same file)
    ↓
T017–T020  (Phase 6 — GamePage, sequential in same file)
    ↓
T021–T024  (Phase 7 — all parallel)
```

### Parallel opportunities
- T001–T003 touch different interfaces in `game.ts` — write in one edit pass.
- T004–T005 are both in `roomStore.ts` — write in one edit pass.
- T007–T008 are both in `toRoomSnapshot()` — write in one edit pass.
- T009 and T010 can be written sequentially (T009 must exist before T010 imports it).
- **Phase 3 and Phase 4 are fully parallel** — backend route and frontend types have no dependency on each other.
- T011–T013 are all in `api.ts` — write in one edit pass.
- T021–T024 are all independent — run in parallel.

---

## Out of Scope (do not implement in this group)

- Canvas drawing interaction
- Guess submission, guess history, scoring
- Results panel, round end, restart flow
- Drawer rotation, timers, multi-round logic
