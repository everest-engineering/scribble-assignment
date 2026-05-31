# Tasks: Group 1 — Room Setup & Lobby

**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel with other [P] tasks in the same phase
- **[US#]**: User story this task belongs to

---

## Phase 1: Foundation — Data Model (BLOCKING)

**Purpose**: Add `hostId` to the shared data model. All other tasks depend on this. TypeScript will not compile anywhere until these three tasks are complete.

**⚠️ CRITICAL**: No phase 2–4 work can begin until Phase 1 is done and `npm run build` passes on the backend.

- [ ] T001 [US1] Add `hostId: string` to `Room` interface in `backend/src/models/game.ts`
- [ ] T002 [US1] Add `hostId: string` to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [ ] T003 [US1] Set `hostId: participant.id` in the `createRoom()` room literal in `backend/src/services/roomStore.ts`
- [ ] T004 [US1] Replace `void viewerParticipantId` with `hostId: room.hostId` in `toRoomSnapshot()` in `backend/src/services/roomStore.ts`

- [ ] T005a [US1] Add `hostId: string` to the local `RoomSnapshot` interface in `frontend/src/services/api.ts` (this file owns its own copy — it does not import from the backend)

**Checkpoint**: Run `npm run build` in `backend/` and `frontend/`. Zero TypeScript errors in both. `POST /rooms` response includes `room.hostId`. Confirm with: `curl -X POST http://localhost:3001/rooms -H 'Content-Type: application/json' -d '{"playerName":"Alice"}' | grep hostId`

---

## Phase 2: User Story 1 — Host Lobby with Auto-Polling (P1) 🎯 MVP

**Goal**: Host creates room, lands in lobby, sees participant list update automatically every 2 s, and sees a host-gated Start Game button.

**Depends on**: Phase 1 complete.

**Independent Test**: Open two browser tabs. Tab A creates a room. Without clicking anything in Tab A, join from Tab B using the room code. Within ≤4 s, Tab A's participant list shows both names. Tab A's Start Game button becomes enabled. Tab B sees "Waiting for host to start..." with no button.

- [ ] T005 [US1] In `frontend/src/pages/LobbyPage.tsx`: replace `handleRefresh` + manual button logic with a `useEffect` that calls `setInterval(() => { roomStore.fetchRoom().catch(() => {}) }, 2000)` and returns `() => clearInterval(id)` as cleanup
- [ ] T006 [US1] In `frontend/src/pages/LobbyPage.tsx`: derive `isHost` from `participantId !== null && room !== null && participantId === room.hostId` (read both from `useRoomState()`)
- [ ] T007 [US1] In `frontend/src/pages/LobbyPage.tsx`: render Start Game button only when `isHost === true`; set `disabled={room.participants.length < 2}` on that button
- [ ] T008 [US1] In `frontend/src/pages/LobbyPage.tsx`: render `<p>Waiting for host to start...</p>` in place of the Start Game button when `isHost === false`

**Checkpoint**: Two-tab smoke test passes (described above). Confirm no network calls appear in the browser DevTools Network tab after navigating away from the lobby.

---

## Phase 3: User Story 2 — Player Join (P1)

**Goal**: A second player joins using the room code. The host's lobby reflects the new participant within the next poll cycle.

**Depends on**: Phase 1 complete. Phase 2 complete (lobby must be polling to observe the update).

**Note**: No backend code changes required — `POST /rooms/:code/join` already works. This phase is a validation checkpoint.

- [ ] T009 [US2] Smoke-test join flow: open a second tab, navigate to `/join-room`, enter the code from Tab A and a different player name, submit — confirm `room.hostId` appears in the join response and equals Tab A's participantId

**Checkpoint**: Within ≤4 s of Tab B joining, Tab A's participant list shows two names and the Start Game button enables. Tab B sees "Waiting for host to start..." with no button.

---

## Phase 4: User Story 3 — Input Validation (P2)

**Goal**: Backend rejects whitespace-only names with 400 and non-existent room codes with 404.

**Depends on**: Phase 1 complete (build must be green before touching schemas).

- [ ] T010 [US3] In `backend/src/api/schemas.ts`: change `createRoomSchema.playerName` from `z.string().optional()` to `z.string().trim().min(1, "Player name is required")`
- [ ] T011 [US3] In `backend/src/api/schemas.ts`: apply the same change to `joinRoomSchema.playerName`
- [ ] T012 [US3] Verify `POST /rooms` with `{ "playerName": "   " }` returns 400 (existing error middleware handles Zod errors — no route handler changes needed)
- [ ] T013 [US3] Verify `POST /rooms/:code/join` with a non-existent code returns 404 (already implemented via `HttpError(404, ...)` — confirm it still works after schema changes)
- [ ] T014 [US3] Verify `GET /rooms/NOTEXIST` returns 404 (existing behaviour — regression check)

**Checkpoint**: All three curl checks pass:
```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/rooms \
  -H 'Content-Type: application/json' -d '{"playerName":"   "}'
# → 400

curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/rooms/ZZZZ/join \
  -H 'Content-Type: application/json' -d '{"playerName":"Bob"}'
# → 404

curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/rooms/ZZZZ
# → 404
```

---

## Phase 5: Build & Test Verification

**Purpose**: Confirm the full build is clean and no existing tests regress.

- [ ] T015 [P] Run `npm run build` in `backend/` — zero TypeScript errors
- [ ] T016 [P] Run `npm run build` in `frontend/` — zero TypeScript errors
- [ ] T017 [P] Run `npm test` in `backend/` — all tests pass
- [ ] T018 [P] Run `npm test` in `frontend/` — all tests pass

**Checkpoint**: All four commands exit 0. Group 1 is complete.

---

## Dependencies & Execution Order

```
T001, T002           (Phase 1 — parallel, same file different interfaces)
    ↓
T003, T004           (Phase 1 — sequential, roomStore.ts)
    ↓
T005 → T006 → T007 → T008   (Phase 2 — sequential edits to LobbyPage.tsx)
T009                          (Phase 3 — smoke test, can run after Phase 2)
T010 → T011 → T012, T013, T014  (Phase 4 — schemas first, then verify)
    ↓
T015, T016, T017, T018       (Phase 5 — all parallel)
```

### Parallel opportunities
- T001 and T002 touch different interfaces in the same file — write both in one edit pass.
- T003 and T004 are in `roomStore.ts` — do in one edit pass.
- T010 and T011 are in `schemas.ts` — do in one edit pass.
- T012, T013, T014 are curl verification commands — run in parallel.
- T015–T018 are all independent — run in parallel.

---

## Out of Scope (do not implement in this group)

- `POST /rooms/:code/start` endpoint
- Drawer assignment or word selection
- Canvas drawing, guess submission, scoring
- Results panel or restart flow
