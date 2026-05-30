# Plan — Scenario 2: Game Start & Drawer Flow

---

## Findings

### What exists and is relevant (post Scenario 1)

| Area | File | Current behavior |
|---|---|---|
| Room model | `backend/src/models/game.ts` | `Room` has `code`, `status` (`"lobby" \| "playing"`), `hostId`, `participants`, `createdAt`, `updatedAt`. No `drawerId`. No `currentWord`. |
| RoomSnapshot model | `backend/src/models/game.ts` | `RoomSnapshot` has `code`, `status`, `hostId`, `participants`, `availableWords`, `roles`. No `drawerId`. No `currentWord`. |
| Name schemas | `backend/src/api/schemas.ts` | `createRoomSchema.playerName` is `z.string().optional()`. `joinRoomSchema.playerName` is `z.string().optional()`. Neither trims nor enforces a minimum length. |
| displayName helper | `backend/src/services/roomStore.ts` | `displayName(name?)` returns `name \|\| "Player"`. Falsy check passes empty strings to the `"Player"` fallback, but `"   "` (spaces only) is truthy and would be stored as-is. |
| startGame service | `backend/src/services/roomStore.ts` | Sets `room.status = "playing"` and saves. Returns the snapshot. Does not assign a drawer. Does not select a word. |
| toRoomSnapshot | `backend/src/services/roomStore.ts` | Receives `viewerParticipantId` as a parameter but immediately voids it (`void viewerParticipantId`). Returns identical data to every caller — no per-viewer filtering of any kind. |
| Rooms router | `backend/src/api/rooms.ts` | Four endpoints: `POST /rooms`, `POST /rooms/:code/join`, `POST /rooms/:code/start`, `GET /rooms/:code`. The `GET` endpoint already passes `participantId` from the query string into `toRoomSnapshot` — the wiring is there, the filtering logic is not. |
| Frontend snapshot type | `frontend/src/services/api.ts` | `RoomSnapshot` interface has `code`, `status`, `hostId`, `participants`, `availableWords`, `roles`. No `drawerId`. No `currentWord`. |
| CreateRoomPage | `frontend/src/pages/CreateRoomPage.tsx` | Calls `roomStore.createRoom(playerName)` with no prior validation. An empty or whitespace-only name is sent directly to the API. Backend accepts it and stores `"Player"` (empty) or the raw whitespace (spaces-only). |
| JoinRoomPage | `frontend/src/pages/JoinRoomPage.tsx` | Has client-side code validation (empty code rejected). No name validation. Empty or whitespace-only names are sent to the API without error. |
| GamePage | `frontend/src/pages/GamePage.tsx` | Canvas area contains a static `<div>` with `"Waiting for drawer..."`. Player Info card shows hardcoded `"Playing"` status. No drawer is identified. No word is shown. No role-aware branching exists anywhere in the component. |
| Frontend store | `frontend/src/state/roomStore.ts` | Has `createRoom`, `joinRoom`, `fetchRoom`, `startGame` actions. No game-screen polling. |

### What is missing

1. **Name trimming and rejection (schemas)** — `playerName` in both create and join schemas accepts any string including empty and whitespace-only. The `displayName` fallback masks empty strings with `"Player"` but cannot reject them or trim them.
2. **Name validation (frontend forms)** — `CreateRoomPage` has no client-side name check. `JoinRoomPage` has code validation but no name check. Both must reject before making an API call.
3. **Drawer field on Room** — `Room` has no `drawerId` field. `startGame` transitions status but assigns no drawer.
4. **Current word field on Room** — `Room` has no `currentWord` field. `startGame` selects no word.
5. **Drawer and word in RoomSnapshot** — `RoomSnapshot` has no `drawerId` or `currentWord`. Even if the fields existed on `Room`, they would not be returned to the frontend.
6. **Per-viewer filtering in toRoomSnapshot** — `viewerParticipantId` is received but voided. The secret word must be returned only when the viewer is the drawer. The infrastructure (the parameter, the query-string wiring in `GET /rooms/:code`) already exists; only the conditional logic is missing.
7. **Role-aware GamePage** — the game screen renders identically for every player. It must branch on whether the viewer is the drawer or a guesser and display accordingly.

---

## State Model Changes

### Backend — `backend/src/models/game.ts`

```
Room (before)                      Room (after)
──────────────────────────         ─────────────────────────────
code: string                       code: string
status: RoomStatus                 status: RoomStatus
hostId: string                     hostId: string
participants: Participant[]         participants: Participant[]
createdAt: string                  createdAt: string
updatedAt: string                  updatedAt: string
                                   drawerId: string | null      ← NEW
                                   currentWord: string | null   ← NEW
```

Both fields are `null` when the room is in `"lobby"` status and are set at the moment `startGame` transitions the room to `"playing"`.

```
RoomSnapshot (before)              RoomSnapshot (after)
──────────────────────────         ─────────────────────────────
code: string                       code: string
status: RoomStatus                 status: RoomStatus
hostId: string                     hostId: string
participants: Participant[]         participants: Participant[]
availableWords: string[]           availableWords: string[]
roles: ParticipantRole[]           roles: ParticipantRole[]
                                   drawerId: string | null      ← NEW (visible to all)
                                   currentWord: string | null   ← NEW (visible only to drawer)
```

`drawerId` is always included — every player needs to know who is drawing.
`currentWord` is conditionally populated: non-null only when `viewerParticipantId === drawerId`.

### Frontend — `frontend/src/services/api.ts`

```
RoomSnapshot interface (before)    RoomSnapshot interface (after)
──────────────────────────         ─────────────────────────────
code: string                       code: string
status: "lobby" | "playing"        status: "lobby" | "playing"
hostId: string                     hostId: string
participants: Participant[]         participants: Participant[]
availableWords: string[]           availableWords: string[]
roles: ParticipantRole[]           roles: ParticipantRole[]
                                   drawerId: string | null      ← NEW
                                   currentWord: string | null   ← NEW
```

---

## Required API Changes

### Modified: Zod schemas — `backend/src/api/schemas.ts`

```
createRoomSchema.playerName:  z.string().optional()
                           →  z.string().trim().min(1, "Player name is required")

joinRoomSchema.playerName:    z.string().optional()
                           →  z.string().trim().min(1, "Player name is required")
```

`z.string().trim()` runs before `.min(1)` is evaluated. A whitespace-only string trims to `""` and fails the length check, returning a 400. No `.refine()` is needed.

### Modified: `createRoom` service — `backend/src/services/roomStore.ts`

Initialise the two new fields on every new room:
```
drawerId: null
currentWord: null
```
No other logic change. The schema now guarantees the name is trimmed before reaching the service.

### Modified: `startGame` service — `backend/src/services/roomStore.ts`

Add two assignments before saving:
```
room.drawerId   = room.hostId
room.currentWord = selectWord(room.code)
```

`selectWord` is a private pure function that derives a stable index from the room code:
```
index = sum of char codes of room.code  %  STARTER_WORDS.length
```
The same room code always yields the same index. The function has no side effects and requires no new dependencies.

### Modified: `toRoomSnapshot` — `backend/src/services/roomStore.ts`

Remove `void viewerParticipantId`. Add two fields to the returned object:
```
drawerId:    room.drawerId
currentWord: viewerParticipantId === room.drawerId ? room.currentWord : null
```

The word is `null` for any caller whose id does not match the drawer, including callers who omit `participantId` entirely.

### No new endpoints

The existing four endpoints are sufficient.
- `POST /rooms` — benefits automatically from schema change (name trimmed + validated).
- `POST /rooms/:code/join` — same.
- `POST /rooms/:code/start` — calls `startGame` which will gain drawer + word assignment.
- `GET /rooms/:code` — already passes `participantId` to `toRoomSnapshot`; filtering logic slots in there with no handler change.

---

## Data Flow

### Create Room (name validation enforced)
```
CreateRoomPage
  → [trim name client-side; if empty → "Player name is required", stop]
  → POST /rooms  { playerName }
  → Zod: z.string().trim().min(1) — rejects whitespace-only with 400
  → createRoom(trimmedName): room.drawerId = null, room.currentWord = null
  → toRoomSnapshot(room, participantId): drawerId null, currentWord null
  → response unchanged shape
```

### Join Room (name validation added)
```
JoinRoomPage
  → [trim name client-side; if empty → "Player name is required", stop]   ← NEW
  → [trim code client-side; if empty → "Room code is required"]            (exists)
  → POST /rooms/:code/join  { playerName }
  → Zod: z.string().trim().min(1) — rejects whitespace-only with 400
  → joinRoom(code, trimmedName)
  → response unchanged shape
```

### Start Game (drawer + word assigned)
```
LobbyPage (host, ≥2 players)
  → POST /rooms/:code/start  { participantId: hostId }
  → startGame(code, hostId):
      room.drawerId    = room.hostId
      room.currentWord = selectWord(room.code)
      room.status      = "playing"
  → toRoomSnapshot(room, hostId):
      drawerId:    hostId                  ← non-null
      currentWord: room.currentWord        ← visible: viewer IS the drawer
  → response { room } — host's snapshot includes the word
  → roomStore.setRoomSnapshot(room)
  → navigate("/game")
```

### Polling from game screen (per-viewer word filtering)
```
GamePage (every ~2s)
  → GET /rooms/:code?participantId=<viewerId>
  → toRoomSnapshot(room, viewerId):
      drawerId:    room.drawerId           (always included)
      currentWord: room.currentWord        if viewerId === room.drawerId
      currentWord: null                    otherwise
  → roomStore.setRoomSnapshot(room)
  → GamePage re-renders: drawer sees word, guessers see null
```

---

## Implementation Sequence

### Step 1 — Backend: tighten name schemas
- **File:** `backend/src/api/schemas.ts`
- Change `createRoomSchema.playerName` to `z.string().trim().min(1, "Player name is required")`.
- Change `joinRoomSchema.playerName` to the same.
- Verify: `npm run build` in `backend/` passes.

### Step 2 — Backend: extend Room and RoomSnapshot models
- **File:** `backend/src/models/game.ts`
- Add `drawerId: string | null` and `currentWord: string | null` to `Room`.
- Add `drawerId: string | null` and `currentWord: string | null` to `RoomSnapshot`.
- Verify: `npm run build` in `backend/` passes (type errors in the service are expected — fixed in Step 3).

### Step 3 — Backend: update createRoom and startGame in the room service
- **File:** `backend/src/services/roomStore.ts`
- In `createRoom`: add `drawerId: null` and `currentWord: null` to the new room literal.
- Add private `selectWord(code: string)` function using char-code-sum mod word-list-length.
- In `startGame`: assign `room.drawerId = room.hostId` and `room.currentWord = selectWord(room.code)` before saving.
- Verify: `npm run build` in `backend/` passes.

### Step 4 — Backend: add per-viewer filtering to toRoomSnapshot
- **File:** `backend/src/services/roomStore.ts`
- Remove `void viewerParticipantId`.
- Add `drawerId: room.drawerId` to the returned object.
- Add `currentWord: viewerParticipantId === room.drawerId ? room.currentWord : null` to the returned object.
- Verify: `npm run build` in `backend/` passes.

### Step 5 — Frontend: update RoomSnapshot interface
- **File:** `frontend/src/services/api.ts`
- Add `drawerId: string | null` and `currentWord: string | null` to the `RoomSnapshot` interface.
- Verify: `npm run build` in `frontend/` passes (type errors in pages expected — fixed in Step 7).

### Step 6 — Frontend: add name validation to forms
- **File:** `frontend/src/pages/CreateRoomPage.tsx`
  - Trim name before submitting. If empty after trim, show "Player name is required" inline and return without calling the API.
- **File:** `frontend/src/pages/JoinRoomPage.tsx`
  - Apply the same name check before the existing code check. Show "Player name is required" inline and return.
- Verify: `npm run build` in `frontend/` passes.

### Step 7 — Frontend: update GamePage for role-aware rendering
- **File:** `frontend/src/pages/GamePage.tsx`
- Derive `isDrawer = room.drawerId === participantId`.
- Derive `drawerName` by finding the participant whose id matches `room.drawerId`.
- Player Info card: show role as `"Drawer"` or `"Guesser"` based on `isDrawer`.
- Canvas area:
  - Drawer: show their secret word (`room.currentWord`) and a label indicating they are drawing.
  - Guesser: show `"Waiting for [drawerName] to draw..."`.
- Verify: `npm run build` in `frontend/` passes.

---

## Files Touched

| File | Change type |
|---|---|
| `backend/src/api/schemas.ts` | Modify — tighten `playerName` in create and join schemas |
| `backend/src/models/game.ts` | Modify — add `drawerId` and `currentWord` to `Room` and `RoomSnapshot` |
| `backend/src/services/roomStore.ts` | Modify — initialise fields in `createRoom`, add `selectWord`, assign in `startGame`, filter in `toRoomSnapshot` |
| `frontend/src/services/api.ts` | Modify — add `drawerId` and `currentWord` to `RoomSnapshot` interface |
| `frontend/src/pages/CreateRoomPage.tsx` | Modify — add client-side name validation |
| `frontend/src/pages/JoinRoomPage.tsx` | Modify — add client-side name validation |
| `frontend/src/pages/GamePage.tsx` | Modify — role-aware layout, drawer identity, conditional word display |

No new files. No new libraries.

---

## Risks

| Risk | Mitigation |
|---|---|
| `displayName` fallback can still mask a name that slips through if a caller bypasses the schema | Schema now validates before `displayName` is reached in normal flows. `displayName` can be simplified to a direct passthrough since the schema guarantees a non-empty trimmed value. |
| `selectWord` result must be stable across calls for the same code | The function is a pure deterministic computation with no randomness — same input always returns same output. |
| `toRoomSnapshot` change affects all four endpoints simultaneously | Intended. All endpoints call `toRoomSnapshot`. The lobby-phase snapshot gains `drawerId: null` and `currentWord: null` which is correct for the lobby state. |
| GamePage has no polling of its own yet | Not required for Scenario 2. The start-game snapshot already delivers the drawer and word. Polling is needed in Scenario 3 for guess sync. |
| A guesser navigating directly to `/game` via URL without going through the lobby | The existing redirect guard (`if (!room) navigate("/")`) already handles this. Room state is only set by create/join flows. |
