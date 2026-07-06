---

description: "Task list for host start control feature"
---

# Tasks: Host Start Control

**Input**: Design documents from `specs/005-host-start-control/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No new tests required per spec — existing tests must continue to pass.

**Organization**: Tasks are grouped by phase. Three user stories: US1 (P1), US2 (P1), US3 (P2).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3 for user story tasks
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/src/`
- Paths reflect the actual web app structure from plan.md

## Phase 1: Setup (Brownfield Discovery)

**Purpose**: Read and understand existing code patterns before making changes

- [ ] T001 Read existing LobbyPage in `frontend/src/pages/LobbyPage.tsx` to understand current button rendering and how `room`, `isLoading`, and navigation are used
- [ ] T002 Read existing RoomStore in `frontend/src/state/roomStore.ts` to confirm `participantId` is available and how participants are stored in room state

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish how to derive current user's host status and participant count

- [ ] T003 Add derived variables in `frontend/src/pages/LobbyPage.tsx` after `useRoomState()`:
  - `participantId` from `roomStore.getSnapshot().participantId`
  - `currentParticipant` by finding the participant matching `participantId` in `room.participants`
  - `isHost` from `currentParticipant?.isHost ?? false`
  - `playerCount` from `room.participants.length`

**Checkpoint**: Component has access to `isHost` (boolean) and `playerCount` (number) derived from existing state.

---

## Phase 3: User Story 1 - Host sees Start Game button, participants do not (Priority: P1) 🎯 MVP

**Goal**: Only the host participant can see the "Start Game" button.

**Independent Test**: Open two tabs. Tab 1 creates room (host). Tab 2 joins. Tab 1 shows "Start Game" button. Tab 2 does not.

- [ ] T004 [US1] Conditionally render the "Start Game" button: only show it when `isHost` is `true`. When `isHost` is `false`, do not render the button or any clickable equivalent.

**Checkpoint**: Two-browser test passes — host sees button, participant does not.

---

## Phase 4: User Story 2 - Host can only start with minimum 2 players (Priority: P1)

**Goal**: Start Game button is disabled when fewer than 2 participants are in the room.

**Independent Test**: Host creates room alone — button disabled. Another player joins — button becomes enabled.

- [ ] T005 [US2] When `playerCount < 2`, add the `disabled` attribute to the "Start Game" button and set `aria-disabled="true"`. When `playerCount >= 2`, the button is fully enabled without these attributes.
- [ ] T006 [US2] (Optional enhancement) When the button is disabled due to < 2 players, display a subtle hint text near the button (e.g., "Need at least 2 players to start") so the host understands why they can't start yet.

**Checkpoint**: Host sees disabled button when alone, enabled button when 2+ players. Button state updates reactively with auto-poll.

---

## Phase 5: User Story 3 - Non-host participants see waiting message (Priority: P2)

**Goal**: Non-host participants see a clear message that they're waiting for the host to start.

**Independent Test**: Join as non-host. A message like "Waiting for host to start the game..." is displayed instead of the button.

- [ ] T007 [US3] Verify the existing status card message `{error ?? refreshError ?? "Waiting for the host to start the game."}` is sufficient for non-host participants. If the status card does not clearly convey this, update the message or add an additional status line specific to non-host participants.

**Checkpoint**: Non-host participant sees a waiting message. Host sees the button (enabled or disabled based on player count).

---

## Phase 6: Build & Validation

**Purpose**: Verify the frontend compiles and all acceptance criteria pass

- [ ] T008 Run `cd frontend && npm run build` to verify frontend compiles without errors
- [ ] T009 Run two-browser validation per `specs/005-host-start-control/quickstart.md` to verify all acceptance scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — review only, can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 (needs `isHost` variable)
- **User Story 2 (Phase 4)**: Depends on Phase 3 (modifies the same button rendered by US1)
- **User Story 3 (Phase 5)**: Depends on Phase 3 (should verify button is hidden for non-hosts)
- **Build & Validation (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation + conditional button rendering
- **User Story 2 (P1)**: Builds on US1 — adds disabled state to the host's button
- **User Story 3 (P2)**: Verifies non-host UX — can be done alongside US2

### Within Each Phase

- Setup before implementation (Phase 1 before Phase 2+)
- Derive state (T003) before conditional rendering (T004)
- Button visibility (T004) before disabled state (T005)

### Parallel Opportunities

- T001, T002 are independent file reviews — can run in parallel
- T004 and T005 are tightly coupled (same button element) — sequential
- T008, T009 are independent — can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (derive isHost + playerCount)
3. Complete Phase 3: User Story 1 (host-only button visibility)
4. **STOP and VALIDATE**: Two-browser test per quickstart.md
5. Add US2 (Phase 4) for minimum player enforcement
6. Add US3 (Phase 5) for non-host message
7. Run Phase 6 for final build validation

### Iterative Delivery

1. Phase 1-2 → State derivation ready
2. Phase 3 (US1) → Host-only button → MVP (host can see and click, others can't)
3. Phase 4 (US2) → Minimum player enforcement
4. Phase 5 (US3) → Non-host message verification
5. Phase 6 → Build + validation

---

## Notes

- All changes are in `frontend/src/pages/LobbyPage.tsx` — no other files need modification
- No new dependencies required — uses existing React patterns and RoomStore API
- Host identification derived client-side: `room.participants.find(p => p.id === participantId)?.isHost`
- The existing auto-polling (Feature 004) ensures button state updates when participants join/leave
- No backend changes needed — all logic is client-side conditional rendering
- Commit after each meaningful slice: state derivation commit, US1 commit, US2 commit, US3 commit
