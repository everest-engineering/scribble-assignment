# Plan — Scenario 1: Room Setup & Lobby

---

## Findings

### What exists and is relevant

| Area | File | Observation |
|---|---|---|
| Room model | `backend/src/models/game.ts` | `Room` has `code`, `status`, `participants`, `createdAt`, `updatedAt`. No `hostId`. `RoomStatus` is the literal `"lobby"` only. |
| Participant model | `backend/src/models/game.ts` | `Participant` has `id`, `name`, `joinedAt`. No role or host marker. |
| Room snapshot | `backend/src/models/game.ts` | `RoomSnapshot` has `participants`, `availableWords`, `roles`. No `hostId`. |
| Room store | `backend/src/services/roomStore.ts` | `createRoom` creates the first participant but never records them as host. `toRoomSnapshot` receives `viewerParticipantId` but immediately voids it — no filtering applied. |
| Schemas | `backend/src/api/schemas.ts` | `createRoomSchema` and `joinRoomSchema` both mark `playerName` as `z.string().optional()` — empty and whitespace-only names pass validation. `roomCodeParamsSchema` accepts any string with no minimum length. |
| Rooms router | `backend/src/api/rooms.ts` | Three endpoints exist: `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`. No start endpoint. |
| API router | `backend/src/api/router.ts` | Mounts `/rooms` router. Global error handler handles `ZodError` (400), `HttpError` (statusCode), and generic (500). Pattern is reusable. |
| Frontend types | `frontend/src/services/api.ts` | `RoomSnapshot` interface mirrors backend but has no `hostId`. No `startGame` client method. |
| Create Room | `frontend/src/pages/CreateRoomPage.tsx` | Calls `roomStore.createRoom(playerName)` directly — no client-side validation. Empty name is sent to the API. |
| Join Room | `frontend/src/pages/JoinRoomPage.tsx` | Calls `roomStore.joinRoom(roomCode, playerName)` directly — no client-side validation. Empty name and empty code are sent to the API. |
| Lobby | `frontend/src/pages/LobbyPage.tsx` | Only manual refresh via `handleRefresh`. No polling interval. "Start Game" button is visible to all players and navigates to `/game` without any API call or host/player-count check. |
| Room store (frontend) | `frontend/src/state/roomStore.ts` | Has `createRoom`, `joinRoom`, `fetchRoom` actions. No `startGame` action. No polling helper. |

### What is missing

1. `Room.hostId` — no field records which participant created the room.
2. `RoomSnapshot.hostId` — not surfaced to the frontend.
3. Name validation — empty and whitespace-only names are accepted by schemas and forms.
4. Code validation — empty room code is accepted by the join form.
5. Lobby polling — no `setInterval` anywhere in the frontend lobby flow.
6. Host-only start button — button is shown to everyone and is always enabled.
7. Start game endpoint — no `POST /rooms/:code/start` exists.
8. Start game minimum player guard — no check that at least 2 participants are present before starting.

---

## State Model Changes

### Backend — `backend/src/models/game.ts`

```
Room (before)                     Room (after)
─────────────────────────         ────────────────────────────
code: string                      code: string
status: "lobby"                   status: "lobby" | "playing"
participants: Participant[]        participants: Participant[]
createdAt: string                 createdAt: string
updatedAt: string                 updatedAt: string
                                  hostId: string              ← NEW
```

```
RoomSnapshot (before)             RoomSnapshot (after)
─────────────────────────         ────────────────────────────
code: string                      code: string
status: "lobby"                   status: "lobby" | "playing"
participants: Participant[]        participants: Participant[]
availableWords: string[]          availableWords: string[]
roles: ParticipantRole[]          roles: ParticipantRole[]
                                  hostId: string              ← NEW
```

### Frontend — `frontend/src/services/api.ts`

```
RoomSnapshot interface (before)   RoomSnapshot interface (after)
─────────────────────────         ────────────────────────────
code: string                      code: string
status: "lobby"                   status: "lobby" | "playing"
participants: Participant[]        participants: Participant[]
availableWords: string[]          availableWords: string[]
roles: ParticipantRole[]          roles: ParticipantRole[]
                                  hostId: string              ← NEW
```

---

## Required API Changes

### Modified: `POST /rooms`
- Schema change: `playerName` becomes required, trimmed, minimum 1 character after trim.
- Service change: `createRoom` writes `hostId: participant.id` on the new `Room`.
- Snapshot change: `toRoomSnapshot` includes `hostId` in the returned object.
- No change to route handler or response shape beyond the snapshot addition.

### Modified: `POST /rooms/:code/join`
- Schema change: `playerName` becomes required, trimmed, minimum 1 character after trim.
- No other changes to handler or service.

### Modified: Zod schemas — `backend/src/api/schemas.ts`
```
createRoomSchema.playerName:  z.string().optional()
                           →  z.string().min(1, "Player name is required").transform(s => s.trim()).refine(s => s.length > 0, "Player name cannot be blank")

joinRoomSchema.playerName:    z.string().optional()
                           →  same as above
```

### New endpoint: `POST /rooms/:code/start`
- **Purpose:** Transition a room from `"lobby"` to `"playing"` with host and player-count guards.
- **Request:** Body `{ participantId: string }` — identifies the caller.
- **Validations (in order):**
  1. Room must exist → 404 if not.
  2. `participantId` must match `room.hostId` → 403 "Only the host can start the game" if not.
  3. Room must have at least 2 participants → 422 "Need at least 2 players to start" if not.
- **Success:** Sets `room.status = "playing"`, saves, returns `{ room: RoomSnapshot }` with status 200.
- **Schema needed:** `startGameSchema = z.object({ participantId: z.string().min(1) })`

---

## Data Flow

### Create Room
```
CreateRoomPage
  → [validate name client-side, reject if blank]
  → POST /rooms  { playerName }
  → backend validates name (Zod, trimmed, non-empty)
  → createRoom() sets hostId = participant.id
  → toRoomSnapshot() includes hostId
  → response { participantId, room: { ...hostId } }
  → roomStore.setRoomSession()
  → navigate("/lobby")
```

### Join Room
```
JoinRoomPage
  → [validate name client-side, reject if blank]
  → [validate code client-side, reject if blank]
  → POST /rooms/:code/join  { playerName }
  → backend validates name (Zod, trimmed, non-empty)
  → joinRoom() adds participant, hostId unchanged
  → response { participantId, room: { ...hostId } }
  → roomStore.setRoomSession()
  → navigate("/lobby")
```

### Lobby Polling
```
LobbyPage mounts
  → useEffect starts setInterval(~2000ms)
    → GET /rooms/:code?participantId=...
    → roomStore.setRoomSnapshot(room)
    → participant list re-renders
  → useEffect cleanup clears interval on unmount
```

### Start Game
```
LobbyPage (host only, ≥2 players)
  → click "Start Game"
  → POST /rooms/:code/start  { participantId }
  → backend checks hostId, checks participant count
  → sets status = "playing"
  → response { room }
  → roomStore.setRoomSnapshot(room)
  → navigate("/game")
```

---

## Implementation Sequence

Steps are ordered so each one is independently testable before moving to the next.

### Step 1 — Backend: extend the Room model
- **File:** `backend/src/models/game.ts`
- Add `hostId: string` to the `Room` interface.
- Expand `RoomStatus` to `"lobby" | "playing"`.
- Add `hostId: string` to the `RoomSnapshot` interface.

### Step 2 — Backend: tighten validation schemas
- **File:** `backend/src/api/schemas.ts`
- Update `createRoomSchema.playerName` to required, trimmed, non-empty.
- Update `joinRoomSchema.playerName` to required, trimmed, non-empty.
- Add `startGameSchema` for the new endpoint.

### Step 3 — Backend: set hostId in the room service
- **File:** `backend/src/services/roomStore.ts`
- In `createRoom`: assign `room.hostId = participant.id`.
- In `toRoomSnapshot`: include `hostId: room.hostId` in the returned object.

### Step 4 — Backend: add the start game endpoint
- **File:** `backend/src/api/rooms.ts`
- Add `POST /:code/start` handler using `startGameSchema`.
- Add a `startGame(code, participantId)` function to `roomStore.ts` that enforces host check, player count, and status transition.

### Step 5 — Frontend: update RoomSnapshot type
- **File:** `frontend/src/services/api.ts`
- Add `hostId: string` to the `RoomSnapshot` interface.
- Add `status: "lobby" | "playing"` to the `RoomSnapshot` interface.
- Add `startGame(code: string, participantId: string)` client method calling `POST /rooms/:code/start`.

### Step 6 — Frontend: add name and code validation to forms
- **File:** `frontend/src/pages/CreateRoomPage.tsx`
- Before calling the store, trim the name and reject if empty with an inline error message.
- **File:** `frontend/src/pages/JoinRoomPage.tsx`
- Trim name and reject if empty; trim code and reject if empty. Both show distinct inline errors.

### Step 7 — Frontend: add startGame action to the store
- **File:** `frontend/src/state/roomStore.ts`
- Add `startGame()` method that calls `api.startGame` and updates the snapshot on success.

### Step 8 — Frontend: replace manual refresh with polling and add host UI
- **File:** `frontend/src/pages/LobbyPage.tsx`
- Replace the manual refresh `useEffect`/button with a `setInterval` polling loop (~2000ms) that calls `roomStore.fetchRoom()`.
- Derive `isHost = room.hostId === participantId`.
- Show "Host" badge next to the host's name in the participant list.
- Show "Start Game" button only when `isHost` is true.
- Disable the button and show a reason when `room.participants.length < 2`.
- On success, navigate to `/game`.

---

## Files Touched

| File | Change type |
|---|---|
| `backend/src/models/game.ts` | Modify — add `hostId`, expand `RoomStatus` |
| `backend/src/api/schemas.ts` | Modify — tighten name schemas, add `startGameSchema` |
| `backend/src/services/roomStore.ts` | Modify — set `hostId` in `createRoom`, include in `toRoomSnapshot`, add `startGame` function |
| `backend/src/api/rooms.ts` | Modify — add `POST /:code/start` handler |
| `frontend/src/services/api.ts` | Modify — add `hostId` + `status` to `RoomSnapshot`, add `startGame` client method |
| `frontend/src/pages/CreateRoomPage.tsx` | Modify — add client-side name validation |
| `frontend/src/pages/JoinRoomPage.tsx` | Modify — add client-side name and code validation |
| `frontend/src/state/roomStore.ts` | Modify — add `startGame` action |
| `frontend/src/pages/LobbyPage.tsx` | Modify — replace manual refresh with polling, add host UI, add conditional start button |

No new files need to be created. No new libraries are required.

---

## Risks

| Risk | Mitigation |
|---|---|
| Polling fires after component unmounts (memory leak / stale state update) | Clear the interval in the `useEffect` cleanup function |
| Backend name validation rejects names that were previously accepted | Acceptable — the spec requires it; existing in-memory rooms are cleared on restart anyway |
| `hostId` missing from old rooms if the backend restarts during testing | Not a concern — in-memory store is wiped on restart; all rooms are fresh |
| Start game navigates to `/game` before game state (drawer, word) is ready | Acceptable for Scenario 1; game screen displays placeholder until Scenario 2 is implemented |
| Two players simultaneously click "Start Game" | Only one will win the host check; second gets 403 — handled by the error path in the store |
