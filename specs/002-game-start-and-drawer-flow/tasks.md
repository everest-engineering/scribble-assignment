# Tasks — Scenario 2: Game Start & Drawer Flow

Tasks are ordered. Complete each one before starting the next.
Each task is a single commit.

---

## Group L — Backend Schemas

### L1 — Tighten playerName in createRoomSchema
- File: `backend/src/api/schemas.ts`
- Change `createRoomSchema.playerName` from `z.string().optional()` to `z.string().trim().min(1, "Player name is required")`.
- No other changes in this task.
- Verify: `npm run build` in `backend/` passes.

### L2 — Tighten playerName in joinRoomSchema
- File: `backend/src/api/schemas.ts`
- Apply the same change as L1 to `joinRoomSchema.playerName`.
- No other changes in this task.
- Verify: `npm run build` in `backend/` passes.

---

## Group M — Backend Model

### M1 — Add drawerId and currentWord to Room interface
- File: `backend/src/models/game.ts`
- Add `drawerId: string | null` to the `Room` interface.
- Add `currentWord: string | null` to the `Room` interface.
- No other changes.
- Verify: `npm run build` in `backend/` passes. Type errors in the service are expected and fixed in Group N.

### M2 — Add drawerId and currentWord to RoomSnapshot interface
- File: `backend/src/models/game.ts`
- Add `drawerId: string | null` to the `RoomSnapshot` interface.
- Add `currentWord: string | null` to the `RoomSnapshot` interface.
- No other changes.
- Verify: `npm run build` in `backend/` passes.

---

## Group N — Backend Service

### N1 — Initialise drawerId and currentWord in createRoom
- File: `backend/src/services/roomStore.ts`
- In the `createRoom` function, add `drawerId: null` and `currentWord: null` to the room object literal.
- No other changes.
- Verify: `npm run build` in `backend/` passes.

### N2 — Add selectWord helper function
- File: `backend/src/services/roomStore.ts`
- Add a private (non-exported) `selectWord(code: string)` function.
- The function derives an index by summing the char codes of each character in `code`, then taking the result modulo `STARTER_WORDS.length`.
- Returns `STARTER_WORDS[index]`.
- No other changes.
- Verify: `npm run build` in `backend/` passes.

### N3 — Assign drawer and word in startGame
- File: `backend/src/services/roomStore.ts`
- In the `startGame` function, before saving the room, add:
  - `room.drawerId = room.hostId`
  - `room.currentWord = selectWord(room.code)`
- No other changes to the function.
- Verify: `npm run build` in `backend/` passes.

### N4 — Add per-viewer filtering to toRoomSnapshot
- File: `backend/src/services/roomStore.ts`
- Remove the `void viewerParticipantId` line.
- Add `drawerId: room.drawerId` to the returned snapshot object.
- Add `currentWord: viewerParticipantId === room.drawerId ? room.currentWord : null` to the returned snapshot object.
- No other changes.
- Verify: `npm run build` in `backend/` passes.

---

## Group O — Backend Tests

### O1 — Test createRoomSchema rejects empty playerName
- File: `backend/src/api/schemas.test.ts`
- Add a test: `createRoomSchema.parse({ playerName: "" })` throws a ZodError.
- Run: `npm test` in `backend/` — all tests pass.

### O2 — Test createRoomSchema rejects whitespace-only playerName
- File: `backend/src/api/schemas.test.ts`
- Add a test: `createRoomSchema.parse({ playerName: "   " })` throws a ZodError.
- Run: `npm test` in `backend/` — all tests pass.

### O3 — Test createRoomSchema trims a valid name with surrounding spaces
- File: `backend/src/api/schemas.test.ts`
- Add a test: `createRoomSchema.parse({ playerName: "  Alice  " })` succeeds and the parsed value is `"Alice"`.
- Run: `npm test` in `backend/` — all tests pass.

### O4 — Test joinRoomSchema rejects empty and whitespace-only playerName
- File: `backend/src/api/schemas.test.ts`
- Add test cases mirroring O1 and O2 for `joinRoomSchema`.
- Run: `npm test` in `backend/` — all tests pass.

### O5 — Test createRoom initialises drawerId and currentWord as null
- File: `backend/src/services/roomStore.test.ts`
- Add a test: call `createRoom("Alice")` and assert `result.room.drawerId === null` and `result.room.currentWord === null`.
- Run: `npm test` in `backend/` — all tests pass.

### O6 — Test startGame assigns drawerId to the host
- File: `backend/src/services/roomStore.test.ts`
- Create a room and join a second player. Call `startGame` with the host id. Assert the returned snapshot has `drawerId === hostId`.
- Run: `npm test` in `backend/` — all tests pass.

### O7 — Test startGame selects a word from the starter list
- File: `backend/src/services/roomStore.test.ts`
- Create a room and join a second player. Call `startGame` with the host id. Assert `snapshot.currentWord` is one of the five starter words.
- Run: `npm test` in `backend/` — all tests pass.

### O8 — Test startGame word selection is deterministic
- File: `backend/src/services/roomStore.test.ts`
- Create two rooms with the same code (or simulate the same code by calling the selection logic directly). Assert both produce the same word.
- Run: `npm test` in `backend/` — all tests pass.

### O9 — Test toRoomSnapshot returns word to drawer, null to others
- File: `backend/src/services/roomStore.test.ts`
- Start a game. Call `toRoomSnapshot(room, hostId)` and assert `currentWord` is non-null. Call `toRoomSnapshot(room, secondPlayerId)` and assert `currentWord` is `null`. Call `toRoomSnapshot(room, undefined)` and assert `currentWord` is `null`.
- Run: `npm test` in `backend/` — all tests pass.

### O10 — Test toRoomSnapshot always includes drawerId
- File: `backend/src/services/roomStore.test.ts`
- Start a game. Call `toRoomSnapshot` with both the drawer id and a guesser id. Assert `drawerId` is non-null and identical in both snapshots.
- Run: `npm test` in `backend/` — all tests pass.

---

## Group P — Frontend Types

### P1 — Add drawerId and currentWord to RoomSnapshot interface
- File: `frontend/src/services/api.ts`
- Add `drawerId: string | null` to the `RoomSnapshot` interface.
- Add `currentWord: string | null` to the `RoomSnapshot` interface.
- No other changes.
- Verify: `npm run build` in `frontend/` passes. Type errors in pages are expected until Group R is done.

---

## Group Q — Frontend Validation

### Q1 — Add name validation to CreateRoomPage
- File: `frontend/src/pages/CreateRoomPage.tsx`
- Before calling the store, trim the player name.
- If the trimmed value is empty, set an inline error "Player name is required" and return without calling the API.
- No other changes.
- Verify: `npm run build` in `frontend/` passes.

### Q2 — Add name validation to JoinRoomPage
- File: `frontend/src/pages/JoinRoomPage.tsx`
- Before the existing room code check, trim the player name.
- If the trimmed name is empty, set an inline error "Player name is required" and return without calling the API.
- The name check runs before the code check — both errors are possible on the same submission but name is checked first.
- Verify: `npm run build` in `frontend/` passes.

---

## Group R — Frontend GamePage

### R1 — Derive isDrawer and drawerName from room state
- File: `frontend/src/pages/GamePage.tsx`
- Derive `isDrawer = room.drawerId === participantId`.
- Derive `drawerParticipant` by finding the participant in `room.participants` whose id matches `room.drawerId`.
- No rendering changes yet — build-verify only.
- Verify: `npm run build` in `frontend/` passes.

### R2 — Update Player Info card to show role
- File: `frontend/src/pages/GamePage.tsx`
- In the Player Info card, replace the hardcoded `"Playing"` status with `"Drawer"` when `isDrawer` is true and `"Guesser"` otherwise.
- No other changes.
- Verify: `npm run build` in `frontend/` passes.

### R3 — Update canvas area for drawer: show secret word
- File: `frontend/src/pages/GamePage.tsx`
- When `isDrawer` is true, replace the static placeholder with a message that tells the player they are the drawer and displays `room.currentWord`.
- No other changes.
- Verify: `npm run build` in `frontend/` passes.

### R4 — Update canvas area for guesser: show drawer name
- File: `frontend/src/pages/GamePage.tsx`
- When `isDrawer` is false, replace the static placeholder with `"Waiting for [drawerParticipant name] to draw..."`. Fall back to `"Waiting for the drawer..."` if the participant is not found.
- No other changes.
- Verify: `npm run build` in `frontend/` passes.

---

## Group S — Frontend Tests

### S1 — Test api service: createRoom sends playerName in body
- File: `frontend/src/services/api.test.ts`
- Add a test asserting `api.createRoom("Alice")` makes a `POST` to `/rooms` with `{ playerName: "Alice" }` in the body.
- Run: `npm test` in `frontend/` — all tests pass.

### S2 — Test api service: joinRoom sends playerName and code
- File: `frontend/src/services/api.test.ts`
- Add a test asserting `api.joinRoom("ABCD", "Bob")` makes a `POST` to `/rooms/ABCD/join` with `{ playerName: "Bob" }` in the body.
- Run: `npm test` in `frontend/` — all tests pass.

---

## Group T — Manual Validation

Run these checks in two browser tabs after all tasks are complete.
No code changes — validation only.

### T1 — Validate: empty name rejected on Create Room
- Open Create Room, submit with an empty name field.
- Expected: inline error "Player name is required" appears, no network request is made.

### T2 — Validate: whitespace-only name rejected on Create Room
- Open Create Room, type several spaces into the name field, submit.
- Expected: inline error appears, no network request is made.

### T3 — Validate: name with surrounding spaces is accepted and trimmed
- Open Create Room, type `"  Alice  "` into the name field, submit.
- Expected: room is created successfully, player appears in the lobby as `"Alice"` (not `"  Alice  "`).

### T4 — Validate: empty name rejected on Join Room
- Open Join Room, leave the name field empty, enter a valid code, submit.
- Expected: inline error "Player name is required" appears, no network request is made.

### T5 — Validate: whitespace-only name rejected on Join Room
- Open Join Room, type spaces into the name field, enter a valid code, submit.
- Expected: inline error appears, no network request is made.

### T6 — Validate: drawer is assigned on game start
- Tab 1: create a room. Tab 2: join the same room. Tab 1: click "Start Game".
- Expected: Tab 1 navigates to the game screen. The Player Info card shows "Drawer".

### T7 — Validate: guesser sees correct role
- Tab 2 (from T6): wait for or manually navigate to `/game`.
- Expected: the Player Info card shows "Guesser".

### T8 — Validate: drawer sees the secret word
- Tab 1 (drawer, from T6): inspect the game screen canvas area.
- Expected: the secret word is shown. It is one of: rocket, pizza, castle, guitar, sunflower.

### T9 — Validate: guesser does not see the secret word
- Tab 2 (guesser, from T6): inspect the game screen canvas area.
- Expected: the secret word is not visible. The drawer's name appears in the canvas area instead.

### T10 — Validate: word selection is deterministic
- Note the room code and word shown in T8.
- Restart the backend, recreate a room with a different player name but confirm the same room code is used if possible, or repeat across multiple sessions to observe consistency.
- Expected: the same room code always produces the same word across restarts.

### T11 — Validate: GET /rooms/:code does not leak word to guesser
- After game start (from T6), call `GET /rooms/:code?participantId=<guesser-id>` directly (e.g. via browser devtools or curl).
- Expected: `currentWord` in the response is `null`.

### T12 — Validate: GET /rooms/:code returns word to drawer
- After game start (from T6), call `GET /rooms/:code?participantId=<drawer-id>` directly.
- Expected: `currentWord` in the response is the secret word string.
