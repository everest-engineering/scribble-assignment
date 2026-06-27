---

description: "Task list for Result, Restart & Final Validation feature"

---

# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `/specs/004-result-restart-validation/`

**Prerequisites**: plan.md (required), spec.md (required), data-model.md, research.md, contracts/

**Tests**: Test tasks are included as requested by the feature specification's acceptance scenarios and 80% coverage requirement.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

No setup tasks required — the project is already initialized.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data model extensions that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 [P] Add `lastSeenAt: string` field to `Participant` interface in `backend/src/models/game.ts`
- [X] T002 [P] Add `skipSuggested: boolean` field to `Room` interface in `backend/src/models/game.ts`
- [X] T003 [P] Add `hostDisconnected?: boolean`, `drawerDisconnected?: boolean`, `skipSuggested?: boolean` fields to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [X] T004 [P] Add `lastSeenAt: string` field to `Participant` interface in `frontend/src/services/api.ts`
- [X] T005 [P] Add `hostDisconnected?: boolean`, `drawerDisconnected?: boolean`, `skipSuggested?: boolean` fields to `RoomSnapshot` interface in `frontend/src/services/api.ts`
- [X] T006 [P] Set `lastSeenAt = now()` in `createParticipant()` in `backend/src/services/roomStore.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Persistent Round Result Display (Priority: P1) 🎯 MVP

**Goal**: When a round ends, all players see a persistent overlay showing the correct word, drawer name, full guess history, and all participant scores. The overlay persists until individually dismissed via "Continue". Fix the name resolution bug (FR-036).

**Independent Test**: Start a game with 2+ players. Have a guesser submit a correct guess. Verify all players see an overlay with the correct word, drawer name, all participant scores, and full guess history. Verify the overlay does NOT auto-dismiss after 10 seconds. Verify each player can dismiss their own overlay by clicking "Continue", revealing the next round.

### Tests for User Story 1 ⚠️

- [X] T007 [P] [US1] Backend test: verify `lastRoundResult` persists indefinitely (no auto-clear after 10s) in `backend/src/services/roomStore.test.ts`
- [X] T008 [P] [US1] Frontend test: verify `RoundResultCard` displays guess history table, resolves names from participants, shows Continue button in `frontend/src/components/RoundResultCard.test.tsx`

### Implementation for User Story 1

#### Backend

- [X] T009 [US1] Remove `clearExpiredRoundResult()` function and its call in `getRoom()` from `backend/src/services/roomStore.ts` — `lastRoundResult` now persists until restart

#### Frontend

- [X] T010 [P] [US1] Update `RoundResultCard` component in `frontend/src/components/RoundResultCard.tsx` — add `participants: Participant[]`, `onContinue: () => void`, `onRestart?: () => void` props; fix name lookup to resolve from `participants[]` not `guessHistory`; add full guess history table (guesser name, guess text, correct/incorrect badge, timestamp); add Continue button (all players); add Restart Game button (host only, shown when onRestart is provided)
- [X] T011 [US1] Update `roomStore` in `frontend/src/state/roomStore.ts` — add `dismissLastRoundResult()` method that sets `resultDismissed: true`; update `fetchRoom()` to suppress `lastRoundResult` when `resultDismissed` is true; reset `resultDismissed` when `lastRoundResult` changes to a different round number (re-display new result)
- [X] T012 [US1] Update `GamePage` in `frontend/src/pages/GamePage.tsx` — pass `participants`, `onContinue` (calls `roomStore.dismissLastRoundResult()`), `onRestart` (calls `roomStore.restartGame()`) to `RoundResultCard`; ensure overlay displays persistently (no auto-hide timer)

**Checkpoint**: US1 complete — result overlay persists, shows all data with correct names, Continue dismisses locally.

---

## Phase 4: User Story 4 — Host Disconnect & Claim Host (Priority: P1) 🎯 MVP

**Goal**: Detect host disconnection via polling inactivity (30s threshold), show popup, allow any player to claim host.

**Independent Test**: Start a game with 2+ players. Close host's browser tab. Wait 30s+. Verify non-host players see "Host disconnected" popup with "Claim Host" button. Click it — verify room hostId updates and new host sees restart/skip buttons.

### Tests for User Story 4 ⚠️

- [X] T013 [P] [US4] Backend test: verify `toRoomSnapshot()` computes `hostDisconnected` correctly (within threshold, beyond threshold, no host) in `backend/src/services/roomStore.test.ts`
- [X] T014 [P] [US4] Backend test: verify `claimHost()` succeeds, is idempotent, rejects non-existent participant in `backend/src/services/roomStore.test.ts`
- [X] T015 [P] [US4] Frontend test: verify `HostDisconnectedBanner` renders with Claim Host button in `frontend/src/components/HostDisconnectedBanner.test.tsx`

### Implementation for User Story 4

#### Backend

- [X] T016 [US4] Update `GET /:code` route handler in `backend/src/api/rooms.ts` — before calling `toRoomSnapshot()`, find the requesting participant by `participantId` query param and update their `lastSeenAt` to `now()` in the room store
- [X] T017 [US4] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` — compute `hostDisconnected: boolean` (host's lastSeenAt > 30s ago) and `drawerDisconnected: boolean` (playing + drawer's lastSeenAt > 30s ago) using `Date.now() - new Date(participant.lastSeenAt).getTime() > 30000`
- [X] T018 [US4] Implement `claimHost()` in `backend/src/services/roomStore.ts` — set `room.hostId = participantId`, return snapshot; return null if participant not found in room
- [X] T019 [US4] Add `claimHostSchema` to `backend/src/api/schemas.ts` — `z.object({ participantId: z.string() })`
- [X] T020 [US4] Add POST `/rooms/:code/claim-host` route in `backend/src/api/rooms.ts` — validate participant exists in room (404 if not), call `claimHost()`, return room snapshot; accept from any participant including current host (idempotent)

#### Frontend

- [X] T021 [P] [US4] Build `HostDisconnectedBanner` component in `frontend/src/components/HostDisconnectedBanner.tsx` — modal overlay with "Host disconnected" message + "Claim Host" button; accepts `onClaimHost: () => void` prop
- [X] T022 [P] [US4] Add `api.claimHost()` method to `frontend/src/services/api.ts`
- [X] T023 [P] [US4] Add `claimHost()` method to `frontend/src/state/roomStore.ts` — call API, update room state with new snapshot
- [X] T024 [US4] Update `GamePage` in `frontend/src/pages/GamePage.tsx` — show `HostDisconnectedBanner` when `room.hostDisconnected` is true and viewer is not host; wire `onClaimHost` to `roomStore.claimHost()`
- [X] T025 [US4] Update `LobbyPage` in `frontend/src/pages/LobbyPage.tsx` — show `HostDisconnectedBanner` when `room.hostDisconnected` is true and viewer is not host

**Checkpoint**: US4 complete — host disconnect detected, claim host works, all clients see updated host.

---

## Phase 5: User Story 2 — Restart Game to Lobby (Priority: P2)

**Goal**: Host can restart the game from the result overlay, sending all players back to lobby with participants preserved and all game state cleared.

**Independent Test**: Start a game, play one round, verify host sees "Restart Game" button on result overlay (non-host does not). Click it. Verify all players see lobby with participants preserved and all game state cleared.

### Tests for User Story 2 ⚠️

- [X] T026 [P] [US2] Backend test: verify `restartGame()` clears game state, preserves participants, rejects non-host, rejects lobby status in `backend/src/services/roomStore.test.ts`
- [X] T027 [P] [US2] Frontend test: verify Restart Game button visible only for host on RoundResultCard in `frontend/src/components/RoundResultCard.test.tsx`

### Implementation for User Story 2

#### Backend

- [X] T028 [US2] Implement `restartGame()` in `backend/src/services/roomStore.ts` — reset `status` to "lobby", clear `currentRound`, `drawerId`, `secretWord`, `strokes`, `guessHistory`, `scores`, `lastRoundResult`, `lastRoundResultSetAt`; set `skipSuggested = false`; preserve participants and hostId; update `updatedAt`; return room snapshot; return null if room not found or not in playing status
- [X] T029 [US2] Add `restartGameSchema` to `backend/src/api/schemas.ts` — `z.object({ playerId: z.string() })`
- [X] T030 [US2] Add POST `/rooms/:code/restart` route in `backend/src/api/rooms.ts` — validate host identity (403 if not), validate playing status (400 if not), call `restartGame()`, return room snapshot

#### Frontend

- [X] T031 [P] [US2] Add `api.restartGame()` method to `frontend/src/services/api.ts`
- [X] T032 [P] [US2] Add `restartGame()` method to `frontend/src/state/roomStore.ts` — call API, update room state; on lobby status change, allow re-navigation to lobby page
- [X] T033 [US2] Update `GamePage` in `frontend/src/pages/GamePage.tsx` — when room status changes to "lobby" after restart, navigate to `/lobby` to show lobby view

**Checkpoint**: US2 complete — host can restart to lobby, all players see lobby within one polling cycle.

---

## Phase 6: User Story 5 — Skip Round When Drawer Disconnected (Priority: P2)

**Goal**: Detect drawer disconnection, show popup, allow non-hosts to suggest skip (sets badge on host's Skip Round button), host can skip round. Skip is always available to host, but rejected if correct guess already exists.

**Independent Test**: Close drawer's tab. Wait 30s+. Verify non-hosts see "Drawer disconnected" popup with "Notify Host" button. Click it — verify host sees badge on "Skip Round" button. Host clicks "Skip Round" — round advances, result overlay shows with correct word.

### Tests for User Story 5 ⚠️

- [X] T034 [P] [US5] Backend test: verify `skipRound()` succeeds, rejects non-host (403), rejects when correct guess exists (400), clears `skipSuggested` in `backend/src/services/roomStore.test.ts`
- [X] T035 [P] [US5] Backend test: verify `suggestSkip()` sets flag, clears on `advanceRound()` and `restartGame()`, rejects non-existent participant in `backend/src/services/roomStore.test.ts`
- [X] T036 [P] [US5] Backend test: verify `toRoomSnapshot()` computes `drawerDisconnected` correctly (playing status, within/beyond threshold) in `backend/src/services/roomStore.test.ts`
- [X] T037 [P] [US5] Frontend test: verify `DrawerDisconnectedBanner` renders with Notify Host button in `frontend/src/components/DrawerDisconnectedBanner.test.tsx`
- [X] T038 [P] [US5] Frontend test: verify Skip Round button visible for host, hidden for non-host, shows badge when `skipSuggested` is true in `frontend/src/pages/GamePage.test.tsx`

### Implementation for User Story 5

#### Backend

- [X] T039 [US5] Implement `skipRound()` in `backend/src/services/roomStore.ts` — check `room.guessHistory` for existing correct guess (return error "Round already ended" if found); validate host identity; call `advanceRound(code)`; clear `skipSuggested`; return room snapshot; return null if room not found or not playing
- [X] T040 [US5] Implement `suggestSkip()` in `backend/src/services/roomStore.ts` — validate room is playing and participant exists; set `room.skipSuggested = true`; save room; clear `skipSuggested` inside `advanceRound()` and `restartGame()`
- [X] T041 [US5] Add `skipRoundSchema` and `suggestSkipSchema` to `backend/src/api/schemas.ts`
- [X] T042 [US5] Add POST `/rooms/:code/skip-round` route in `backend/src/api/rooms.ts` — validate host (403), validate playing (400), check correct guess (400), call `skipRound()`, return room snapshot
- [X] T043 [US5] Add POST `/rooms/:code/suggest-skip` route in `backend/src/api/rooms.ts` — validate participant exists in room (404), validate playing (400), call `suggestSkip()`, return room snapshot

#### Frontend

- [X] T044 [P] [US5] Build `DrawerDisconnectedBanner` component in `frontend/src/components/DrawerDisconnectedBanner.tsx` — modal overlay with "Drawer disconnected" message + "Notify Host" button; accepts `onNotifyHost: () => void` prop
- [X] T045 [P] [US5] Add `api.skipRound()` and `api.suggestSkip()` methods to `frontend/src/services/api.ts`
- [X] T046 [P] [US5] Add `skipRound()` and `suggestSkip()` methods to `frontend/src/state/roomStore.ts` — call API, update room state
- [X] T047 [US5] Update `GamePage` in `frontend/src/pages/GamePage.tsx` — show "Skip Round" button in button row when viewer is host (always visible); add visual badge/pulse CSS class on Skip Round button when `room.skipSuggested` is true and viewer is host; show `DrawerDisconnectedBanner` when `room.drawerDisconnected` is true and viewer is not host; wire `onNotifyHost` to `roomStore.suggestSkip()`; wire Skip Round button to `roomStore.skipRound()`

**Checkpoint**: US5 complete — drawer disconnect detected, suggest skip works, host can skip round.

---

## Phase 7: User Story 3 — Exit Game Coexists (Priority: P3)

**Goal**: The "Exit Game" button remains visible and functional on the result overlay alongside the new "Restart Game" button.

**Independent Test**: On result overlay, verify both "Exit Game" and (for host) "Restart Game" buttons are visible. Click "Exit Game" — verify session cleared and user redirected to home.

### Implementation for User Story 3

- [X] T048 [US3] Update `GamePage` in `frontend/src/pages/GamePage.tsx` — add "Exit Game" button to the bottom button row inside the result overlay, ensuring it remains visible alongside Continue/Restart buttons with no z-index conflicts

**Checkpoint**: US3 complete — Exit Game co-exists with Restart Game.

---

## Phase 8: Name Validation (Priority: P2)

**Goal**: Enforce max 20-character participant names at both backend and frontend levels.

**Independent Test**: Try to create room with name >20 chars — verify Zod rejects with clear error. Verify frontend input prevents typing beyond 20 chars.

### Tests for Name Validation ⚠️

- [X] T049 [P] Backend test: verify name >20 chars is rejected by Zod in `backend/src/api/schemas.test.ts`

### Implementation for Name Validation

- [X] T050 [P] Update `trimmedNonEmptyString` schema in `backend/src/api/schemas.ts` — add `.max(20)` to enforce max name length
- [X] T051 [P] Update name input fields in create-room and join-room forms (e.g., `LobbyPage`, home page) — add `maxLength={20}` attribute

**Checkpoint**: Name validation enforced at API and UI level.

---

## Phase 9: Build & Verify

**Purpose**: Ensure both backend and frontend build and pass all tests.

- [X] T052 [P] Run `npm run build` in `backend/` — fix any type/build errors
- [X] T053 [P] Run `npm run build` in `frontend/` — fix any type/build errors
- [X] T054 [P] Run `npm test` in `backend/` — ensure all tests pass with 80%+ coverage
- [X] T055 [P] Run `npm test` in `frontend/` — ensure all tests pass with 80%+ coverage

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — already complete
- **Foundational (Phase 2)**: Blocks all user stories
- **US1 (Phase 3)**: Persistent Round Result — can start after Phase 2; independent of other stories
- **US4 (Phase 4)**: Host Disconnect — can start after Phase 2; independent of other stories
- **US2 (Phase 5)**: Restart Game — depends on US1 (RoundResultCard needs Restart button)
- **US5 (Phase 6)**: Skip Round — depends on US4 (drawerDisconnected detection) and US2 (restart clears skipSuggested)
- **US3 (Phase 7)**: Exit Game Coexists — depends on US1+US2 (button row layout on result overlay)
- **Name Validation (Phase 8)**: Can run in parallel with any phase (independent)
- **Build & Verify (Phase 9)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: No dependencies on other stories — can be first
- **US4 (P1)**: No dependencies on other stories — can be first
- **US2 (P2)**: Depends on US1 (RoundResultCard UI)
- **US5 (P2)**: Depends on US4 (drawer disconnect detection)
- **US3 (P3)**: Depends on US1+US2 (layout integration)

### Within Each User Story

- Backend model updates before service logic
- Services before API routes
- Backend changes before frontend integration
- Tests (where included) before implementation

### Parallel Opportunities

- All Phase 2 [P] tasks can run in parallel
- US1 and US4 can be developed in parallel (independent P1 stories)
- All [P] tasks within a user story can run in parallel
- T007-T009 (US1 backend + tests) can run with T010-T012 (US1 frontend)
- T021-T023 (US4 frontend API/store) can run with T024-T025 (US4 pages)
- Name validation (Phase 8) can run in parallel with any other phase

---

## Parallel Example: User Story 1

```bash
# Launch all US1 tasks together:
Task: "T007 Backend test: lastRoundResult persists indefinitely in roomStore.test.ts"
Task: "T008 Frontend test: RoundResultCard displays guess history in RoundResultCard.test.tsx"
Task: "T009 Remove clearExpiredRoundResult() in roomStore.ts"
Task: "T010 Update RoundResultCard.tsx with participants, Continue, Restart props"
Task: "T011 Add dismissLastRoundResult() in roomStore.ts"
Task: "T012 Wire RoundResultCard in GamePage.tsx"
```

---

## Implementation Strategy

### MVP First (US1 + US4 — Both P1)

1. Complete Phase 2: Foundational
2. Complete Phase 3: US1 (Persistent Round Result)
3. Complete Phase 4: US4 (Host Disconnect & Claim Host)
4. **STOP and VALIDATE**: Result overlay persists and host disconnect detected

### Incremental Delivery

1. Foundational → Data model ready
2. Add US1 → Result display works, Continue dismisses
3. Add US4 → Host disconnect detected, claim host works
4. Add US2 → Restart to lobby works
5. Add US5 → Skip round works with drawer disconnect
6. Add US3 → Exit Game coexists
7. Add name validation
8. Build & test everything passes

---

## Phase 10: Notify Host Dismisses Banner (add-on to US5)

- [X] T058 [FE] `frontend/src/state/roomStore.ts` — In `suggestSkip()`, after API call succeeds, patch `drawerDisconnected: false` on the local room state

---

## Phase 11: Game Over When All Players Leave (US6)

### Backend

- [X] T059 `backend/src/models/game.ts` — Add `"finished"` to `RoomStatus` type
- [X] T060 `backend/src/services/roomStore.ts` — Add `removeParticipant()` service: remove from array + scores; reassign host; if playing + ≤1 remaining: create lastRoundResult, set status `"finished"`; if 0 remaining: delete room
- [X] T061 `backend/src/services/roomStore.ts` — Update `toRoomSnapshot()` to include game details when status is `"finished"`
- [X] T062 `backend/src/api/schemas.ts` — Add `leaveRoomSchema`
- [X] T063 `backend/src/api/rooms.ts` — Add `DELETE /:code/leave` route
- [X] T064 `backend/src/services/roomStore.test.ts` — Add 7 tests for removeParticipant

### Frontend

- [X] T065 `frontend/src/services/api.ts` — Add `api.leaveRoom()`; update `RoomSnapshot.status` to include `"finished"`
- [X] T066 `frontend/src/state/roomStore.ts` — Add `leaveRoom()` method
- [X] T067 `frontend/src/pages/GamePage.tsx` — Update `handleExit` to call `roomStore.leaveRoom()`; handle `"finished"` status (RoundResultCard with Exit only); suppress banners during finished

### Build & Verify

- [X] T068 [P] Run `npm run build` in `backend/`
- [X] T069 [P] Run `npm run build` in `frontend/`
- [X] T070 [P] Run `npm test` in `backend/` — 53 tests pass (was 46)
- [X] T071 [P] Run `npm test` in `frontend/` — 18 tests pass
