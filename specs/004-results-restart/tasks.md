# Tasks: Group 4 — Results, Restart & Final Validation

**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel with other [P] tasks in the same phase
- **[US#]**: User story this task belongs to

---

## Phase 1: Backend Model Extension (BLOCKING)

**Purpose**: Add `"results"` to `RoomStatus`. One-line change; no construction sites break.

- [x] T001 [US1] In `backend/src/models/game.ts`: widen `RoomStatus` to `"lobby" | "playing" | "results"`

**Checkpoint**: `npm run build` in `backend/` exits 0. ✅

---

## Phase 2: Service Functions + Snapshot Update

**Purpose**: Implement `endGame()`, `restartGame()`, and update `toRoomSnapshot()` to reveal the word on results.

**Depends on**: Phase 1 complete.

- [x] T002 [US1] In `backend/src/services/roomStore.ts`: add `endGame(code: string, participantId: string)` function:
  - `NOT_FOUND` if room absent
  - `FORBIDDEN` if `participantId !== room.hostId`
  - `CONFLICT` if `room.status !== "playing"`
  - Otherwise: `room.status = "results"`, `saveRoom(room)`, return `{ code: "OK", room: cloneRoom(room) }`

- [x] T003 [US3] In `backend/src/services/roomStore.ts`: add `restartGame(code: string, participantId: string)` function:
  - `NOT_FOUND` if room absent
  - `FORBIDDEN` if `participantId !== room.hostId`
  - `CONFLICT` if `room.status !== "results"`
  - Otherwise: `room.status = "lobby"`, `room.drawerParticipantId = null`, `room.currentWord = null`, `room.guesses = []`, `room.scores = {}`, `saveRoom(room)`, return `{ code: "OK", room: cloneRoom(room) }`

- [x] T004 [US2] In `backend/src/services/roomStore.ts` → `toRoomSnapshot()`: update `currentWord` logic so it is returned unconditionally when `room.status === "results"`:
  ```typescript
  const showWord = isDrawer || room.status === "results";
  // then: currentWord: showWord ? room.currentWord : null
  ```

**Checkpoint**: `npm run build` in `backend/` exits 0. ✅

---

## Phase 3: Schemas + Routes — parallel with Phase 4

**Purpose**: Expose `POST /rooms/:code/end` and `POST /rooms/:code/restart` over HTTP.

**Depends on**: Phase 2 complete.

- [x] T005 [US1] In `backend/src/api/schemas.ts`: add `endRoomSchema` and `restartRoomSchema`

- [x] T006 [US1] In `backend/src/api/rooms.ts`: add `POST /:code/end` route with `NOT_FOUND → 404`, `FORBIDDEN → 403`, `CONFLICT → 409`, `OK → 200`

- [x] T007 [US3] In `backend/src/api/rooms.ts`: add `POST /:code/restart` route with same translation table

**Checkpoint**: All curl smoke tests pass. ✅

---

## Phase 4: Frontend Types + API Functions — parallel with Phase 3

**Purpose**: Extend the frontend's local types and add `api.endGame()` + `api.restartGame()`.

**Depends on**: Phase 2 complete.

- [x] T008 [US1] In `frontend/src/services/api.ts`: widen `RoomSnapshot.status` to `"lobby" | "playing" | "results"`
- [x] T009 [US1] In `frontend/src/services/api.ts`: add `endGame(code, participantId)` → `POST /rooms/:code/end`
- [x] T010 [US3] In `frontend/src/services/api.ts`: add `restartGame(code, participantId)` → `POST /rooms/:code/restart`

**Checkpoint**: `npm run build` in `frontend/` exits 0. ✅

---

## Phase 5: GamePage Updates

**Purpose**: Add status watcher for `"results"` and replace Exit Game with host-gated End Game button.

**Depends on**: Phase 4 complete.

- [x] T011 [US1] In `frontend/src/pages/GamePage.tsx`: add `useEffect` watching `room?.status` — when `"results"`, navigate to `/results`
- [x] T012 [US1] In `frontend/src/pages/GamePage.tsx`: derive `isHost`
- [x] T013 [US1] In `frontend/src/pages/GamePage.tsx`: add `endError` state and `handleEndGame` async function
- [x] T014 [US1] In `frontend/src/pages/GamePage.tsx`: host sees "End Game" button; non-host has no button

**Checkpoint**: Host clicks End Game → navigates to `/results`. Non-host tab navigates within ≤4 s. ✅

---

## Phase 6: ResultsPage + Route

**Purpose**: Create the results screen and register the `/results` route.

**Depends on**: Phase 5 complete.

- [x] T015 [US2] In `frontend/src/routes/index.tsx`: add `<Route path="/results" element={<ResultsPage />} />`
- [x] T016 [US2] Create `frontend/src/pages/ResultsPage.tsx` with guard, polling, status watcher, word reveal, Scoreboard, ResultPanel, Play Again / waiting message

**Checkpoint**: Full end-to-end flow verified. ✅

---

## Phase 7: Build & Test Verification

- [x] T017 [P] `npm run build` in `backend/` — zero TypeScript errors ✅
- [x] T018 [P] `npm run build` in `frontend/` — zero TypeScript errors ✅
- [x] T019 [P] `npm test` in `backend/` — 4/4 pass ✅
- [x] T020 [P] `npm test` in `frontend/` — 2/2 pass ✅

---

## Dependencies & Execution Order

```
T001           (Phase 1 — game.ts one-line change)
    ↓
T002, T003, T004   (Phase 2 — roomStore: endGame, restartGame, snapshot update)
    ↓
T005–T007 (Phase 3)          T008–T010 (Phase 4 — all in api.ts, one edit pass)
    ↓                                  ↓
T011–T014  (Phase 5 — GamePage, sequential in same file)
    ↓
T015–T016  (Phase 6 — route + ResultsPage)
    ↓
T017–T020  (Phase 7 — all parallel)
```

---

## Out of Scope

- Automatic round end on correct guess
- Multiple rounds with automatic drawer rotation
- Timers or auto-end
- Persistent leaderboard across sessions
