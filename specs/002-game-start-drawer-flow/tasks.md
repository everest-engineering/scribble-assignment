# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `/specs/002-game-start-drawer-flow/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/game-api.md ✅, quickstart.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps to user story — [US1] Game Start & Drawer, [US2] Name Validation
- Paths follow web app convention: `backend/src/` and `frontend/src/`

---

## Phase 1: Setup (Brownfield Orientation)

**Purpose**: Confirm no new packages, dependencies, or directories are required — all tasks modify existing files only.

- [ ] T001 Verify `STARTER_WORDS` constant exists in `backend/src/models/game.ts` and confirm no new npm packages are needed per plan.md

---

## Phase 2: US1 — Game Starts and Drawer Is Assigned (Priority: P1) MVP

**Goal**: Backend assigns drawer and `secretWord` deterministically on game start; frontend displays drawer identity to all players and the secret word only to the drawer.

**Independent Test**: With a single tab as Alice, create a room, click "Start Game" — game screen labels Alice as the drawer and shows `rocket` as the secret word. Open a second tab as Bob; Bob's screen shows Alice as the drawer but no secret word. Confirm via `GET /rooms/:code?participantId=<alice-id>` that `secretWord` is present, and with Bob's id it is absent.

### Implementation for US1

- [ ] T002 [US1] Add `CurrentRound` interface and extend `Room` and `RoomSnapshot` interfaces in `backend/src/models/game.ts`
- [ ] T003 [US1] Update `startGame()` in `backend/src/services/roomStore.ts` — remove `participants.length < 2` guard and set `room.currentRound = { roundNumber: 1, drawerId: hostId, wordIndex: 0 }`
- [ ] T004 [US1] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` — populate `currentDrawerId` from `currentRound.drawerId` and include `secretWord` only when `viewerParticipantId === currentRound.drawerId`
- [ ] T005 [US1] Update `POST /rooms/:code/start` handler in `backend/src/api/rooms.ts` — pass caller's `participantId` to `toRoomSnapshot()` so the host receives `secretWord` in the start response
- [ ] T006 [P] [US1] Extend `RoomSnapshot` type in `frontend/src/services/api.ts` — add `currentDrawerId?: string` and `secretWord?: string`
- [ ] T007 [P] [US1] Mirror `RoomSnapshot` type update in `frontend/src/state/roomStore.ts` — add `currentDrawerId?: string` and `secretWord?: string`
- [ ] T008 [P] [US1] Update `LobbyPage` in `frontend/src/pages/LobbyPage.tsx` — set `canStart = isHost` (remove `participants.length >= 2` gate) and remove the "Waiting for players… (need 2+)" button label branch
- [ ] T009 [US1] Update `GamePage` in `frontend/src/pages/GamePage.tsx` — derive `isDrawer = participantId === room.currentDrawerId`, display drawer identity (visible to all players), and show `room.secretWord` only to the drawer (placeholder for non-drawers)

**Checkpoint**: US1 complete — single-player game start works; drawer identity visible to all; secret word shown only to drawer.

---

## Phase 3: US2 — Player Name Validation Before Game (Priority: P2)

**Goal**: Whitespace-only names rejected at the backend (Zod `.string().trim().min(1)`) and frontend sends trimmed names; existing inline client-side check already blocks blank submissions before any network call.

**Independent Test**: On Create Room, enter `     ` (spaces only) — form shows inline error with no network request. Enter `  Alice  ` — stored and displayed as `Alice`. Confirm `POST /rooms` with `{"playerName":"   "}` returns 400.

### Implementation for US2

- [ ] T010 [P] [US2] Update `createRoomSchema` and `joinRoomSchema` in `backend/src/api/schemas.ts` — change `playerName` to `z.string().trim().min(1)` in both schemas
- [ ] T011 [P] [US2] Update `CreateRoomPage` in `frontend/src/pages/CreateRoomPage.tsx` — pass `playerName.trim()` to `roomStore.createRoom()` so the stored name matches the validated trimmed value
- [ ] T012 [P] [US2] Update `JoinRoomPage` in `frontend/src/pages/JoinRoomPage.tsx` — pass `playerName.trim()` to `roomStore.joinRoom()` so the stored name matches the validated trimmed value

**Checkpoint**: US2 complete — whitespace-only names blocked server-side and names stored trimmed; client-side inline validation already in place.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end smoke test validation of the full feature.

- [ ] T013 Run all 11 smoke test items from `specs/002-game-start-drawer-flow/quickstart.md` and confirm each passes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (US1)**: Depends on Phase 1 completion
  - T002 (model) must complete before T003/T004 (service changes reference new types)
  - T003 and T004 must complete before T005 (route uses updated `toRoomSnapshot`)
  - T006, T007, T008 can run in parallel — frontend-only, no backend dependency at time of writing
  - T009 (GamePage) depends on T006 and T007 (needs updated `RoomSnapshot` type)
- **Phase 3 (US2)**: Independent of Phase 2 — T010/T011/T012 can begin as soon as Phase 1 is done
- **Phase 4 (Polish)**: Depends on all desired user stories complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 1 — no dependency on US2
- **US2 (P2)**: Can start after Phase 1 — no dependency on US1; T010/T011/T012 are fully independent of each other

### Within US1

- T002 → T003, T004 (model must exist before service changes)
- T003, T004 → T005 (service must be updated before route change)
- T006 [P], T007 [P] → T009 (GamePage needs updated frontend types)
- T008 [P]: no intra-story dependencies (removes a conditional in a standalone component)

---

## Parallel Example: US1 Backend + US2 Simultaneously

```
# US1 backend chain (sequential — TypeScript type dependency):
T002 → T003 → T004 → T005

# US2 tasks run in parallel while US1 backend chain runs:
T010  backend/src/api/schemas.ts              [P] |
T011  frontend/src/pages/CreateRoomPage.tsx   [P] | all independent
T012  frontend/src/pages/JoinRoomPage.tsx     [P] |

# US1 frontend tasks — run in parallel once Phase 1 is done:
T006  frontend/src/services/api.ts            [P] |
T007  frontend/src/state/roomStore.ts         [P] | all independent
T008  frontend/src/pages/LobbyPage.tsx        [P] |

# US1 final task — depends on T006 and T007:
T009  frontend/src/pages/GamePage.tsx
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2 backend chain: T002 → T003 → T004 → T005
3. Complete Phase 2 frontend tasks in parallel: T006, T007, T008, then T009
4. **STOP and VALIDATE**: Single-player game start, two-tab drawer/guesser scenario, API spot checks
5. Demo or proceed to US2

### Incremental Delivery

1. Phase 1 — orientation confirmed
2. Phase 2 (US1) — game start + drawer flow → validate → demo as MVP
3. Phase 3 (US2) — name validation → validate independently → demo
4. Phase 4 — full smoke test pass

### Parallel Team Strategy

With two developers:
- **Developer A**: US1 backend chain (T002 → T003 → T004 → T005), then US1 frontend (T006, T007, T008, T009)
- **Developer B**: US2 tasks (T010, T011, T012) — fully independent of US1

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps each task to its user story for traceability
- No new npm packages or directories — brownfield modifications only (per plan.md)
- US1 and US2 are fully independently testable; complete and validate US1 before US2 when working solo
- Commit after each logical task per Constitution Principle V (granular, meaningful commits)
