---
description: "Task list for Game Start & Drawer Flow (Scenario 2)"
---

# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `/specs/002-game-start-drawer-flow/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md

**Tests**: Backend Vitest tasks included per plan testing strategy; manual two-browser validation in Polish phase.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1–US4)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm Scenario 1 baseline and artifact alignment before round-state work

- [ ] T001 Review `specs/002-game-start-drawer-flow/plan.md`, `spec.md`, and `contracts/rooms-api.md` against acceptance criteria
- [ ] T002 Confirm Scenario 1 flows (create, join, lobby poll, host start, `/game` guard) work on branch `002-game-start-drawer-flow`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared round-state model, name normalization, and viewer-aware snapshot shape

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Add `drawerParticipantId: string | null` and `secretWord: string | null` to internal `Room` in `backend/src/models/game.ts`
- [ ] T004 Extend `RoomSnapshot` with `drawerParticipantId` and `ParticipantSnapshot` with `role: "drawer" | "guesser" | null` plus optional `secretWord` in `backend/src/models/game.ts`
- [ ] T005 Add `normalizePlayerName()` (trim; reject empty) and replace `displayName()` default in `backend/src/services/roomStore.ts`
- [ ] T006 Update `createRoom` and `joinRoom` to persist trimmed names via `normalizePlayerName()` in `backend/src/services/roomStore.ts`
- [ ] T007 Extend `startRoom` to set `drawerParticipantId = hostParticipantId`, `secretWord = STARTER_WORDS[0]`, and `status = "playing"` in `backend/src/services/roomStore.ts`
- [ ] T008 Implement viewer-aware `toRoomSnapshot(room, viewerParticipantId)` with roles and conditional `secretWord` in `backend/src/services/roomStore.ts`
- [ ] T009 [P] Require trimmed non-empty `playerName` in `createRoomSchema` and `joinRoomSchema` in `backend/src/api/schemas.ts`
- [ ] T010 [P] Return `400` with `"Player name is required"` for empty trimmed names on create/join in `backend/src/api/rooms.ts`
- [ ] T011 [P] Mirror extended snapshot and participant types in `frontend/src/services/api.ts`

**Checkpoint**: Foundation ready — backend returns viewer-aware snapshots; names trimmed server-side; round fields set on start

---

## Phase 3: User Story 1 — Player Names Are Validated at Entry (Priority: P1) 🎯 MVP

**Goal**: Trim and reject empty/whitespace-only names on create/join with clear errors; store trimmed names

**Independent Test**: Submit `""`, `"   "`, and `"  Alex  "` on create/join — reject empty; accept trimmed `"Alex"` in lobby list

### Implementation for User Story 1

- [ ] T012 [US1] Trim name and reject empty/whitespace-only before API call with clear error in `frontend/src/pages/CreateRoomPage.tsx`
- [ ] T013 [US1] Trim name and reject empty/whitespace-only before API call with clear error in `frontend/src/pages/JoinRoomPage.tsx`
- [ ] T014 [US1] Pass trimmed name to `roomStore.createRoom` / `joinRoom` in `frontend/src/pages/CreateRoomPage.tsx` and `frontend/src/pages/JoinRoomPage.tsx`
- [ ] T015 [P] [US1] Add vitest cases for trimmed names and empty-name rejection in `backend/src/services/roomStore.test.ts`

**Checkpoint**: Name validation testable on create/join without starting a game

---

## Phase 4: User Story 2 — Game Starts and All Players Enter the Round (Priority: P2)

**Goal**: All participants reach `/game` after host start; game screen polls ~2s; round-active UI shown

**Independent Test**: Two tabs — host starts; both land on `/game` within ~3s; guest auto-navigates without manual refresh

### Implementation for User Story 2

- [ ] T016 [US2] Ensure `POST /rooms/:code/start` response uses viewer-aware `toRoomSnapshot(result.room, participantId)` in `backend/src/api/rooms.ts`
- [ ] T017 [US2] Add 2000ms game polling via `fetchRoomSilent` with interval cleanup on unmount in `frontend/src/pages/GamePage.tsx`
- [ ] T018 [US2] Show round-active status (e.g., existing "Round 1" / playing indicator) when `room.status === "playing"` in `frontend/src/pages/GamePage.tsx`
- [ ] T019 [US2] Show non-blocking poll error while retaining last snapshot in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: Start transition and game polling work; `/game` guard from Scenario 1 still redirects lobby rooms

---

## Phase 5: User Story 3 — Host Becomes the Identified Drawer (Priority: P3)

**Goal**: Host assigned drawer role; all clients see drawer identified by name/role label; guessers see their role

**Independent Test**: Two-player game — host tab shows drawer; guest tab shows guesser and identifies host as drawer

### Implementation for User Story 3

- [ ] T020 [US3] Map participant `role` to `"drawer"` for host and `"guesser"` for others when `status === "playing"` in `backend/src/services/roomStore.ts` (`toRoomSnapshot`)
- [ ] T021 [US3] Display viewer role, drawer name, and drawer badge in Player Info card in `frontend/src/pages/GamePage.tsx`
- [ ] T022 [P] [US3] Add vitest asserting `startRoom` sets `drawerParticipantId` to host in `backend/src/services/roomStore.test.ts`

**Checkpoint**: Drawer identification visible on both tabs after game start

---

## Phase 6: User Story 4 — Secret Word Is Drawer-Only (Priority: P4)

**Goal**: Deterministic word `rocket` assigned at start; visible only to drawer in API and UI

**Independent Test**: Drawer tab shows `rocket`; guesser tab and guesser poll JSON omit `secretWord`

### Implementation for User Story 4

- [ ] T023 [US4] Include `secretWord` in snapshot only when `viewerParticipantId === drawerParticipantId` in `backend/src/services/roomStore.ts`
- [ ] T024 [US4] Render secret word panel for drawer when `room.secretWord` is present in `frontend/src/pages/GamePage.tsx`
- [ ] T025 [US4] Show neutral guess prompt without secret word for guessers in `frontend/src/pages/GamePage.tsx`
- [ ] T026 [P] [US4] Add vitest asserting guesser snapshot omits `secretWord` and drawer snapshot includes it in `backend/src/services/roomStore.test.ts`

**Checkpoint**: Full Scenario 2 flow — validated names, start, roles, drawer-only word

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation and build gates before Scenario 3

- [ ] T027 Run manual two-browser validation per `specs/002-game-start-drawer-flow/quickstart.md`
- [ ] T028 [P] Run `npm run build` in `backend/` and `frontend/` and fix any type errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001–T002 — **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational (T005–T011)
- **User Story 2 (Phase 4)**: Depends on Foundational; lobby start/navigation from Scenario 1; game poll builds on T008 snapshot
- **User Story 3 (Phase 5)**: Depends on Foundational + US2 game screen (T017–T018) for UI surface
- **User Story 4 (Phase 6)**: Depends on Foundational viewer filtering (T008/T023) + US3 role UI
- **Polish (Phase 7)**: Depends on all user story phases

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependency on other Scenario 2 stories
- **US2 (P2)**: After Foundational — Scenario 1 lobby/start already provides navigation; adds game polling
- **US3 (P3)**: After Foundational — best validated once US2 game page polling exists
- **US4 (P4)**: After Foundational — UI word panel needs US2 game page; filtering in T023 may ship with T008

### Within Each User Story

- Backend store/model before API routes
- API contract before frontend types consumption
- Frontend pages after types aligned
- Vitest after store logic for that story

### Parallel Opportunities

- T009, T010, T011 parallel after T003–T004 types exist
- T012 and T013 parallel (different pages)
- T015, T022, T026 parallel vitest additions (same file — sequence or single commit)
- T028 parallel backend/frontend builds
- US1 frontend (T012–T014) parallel with US2 backend (T016) after Foundational

---

## Parallel Example: Foundational Phase

```bash
# After T003–T008 store logic exists, launch in parallel:
Task T009: "Require trimmed playerName in backend/src/api/schemas.ts"
Task T010: "Return 400 for empty names in backend/src/api/rooms.ts"
Task T011: "Mirror snapshot types in frontend/src/services/api.ts"
```

---

## Parallel Example: User Story 4

```bash
# After T023 viewer filtering exists:
Task T024: "Drawer secret word panel in frontend/src/pages/GamePage.tsx"
Task T026: "Vitest guesser omits secretWord in backend/src/services/roomStore.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T011)
3. Complete Phase 3: User Story 1 (T012–T015)
4. **STOP and VALIDATE**: Reject empty names; trimmed names appear in lobby
5. Demo name-validation slice before game start/drawer/word work

### Incremental Delivery

1. Setup + Foundational → round model and viewer snapshots ready
2. Add US1 → name validation validated (MVP)
3. Add US2 → game start sync and polling validated
4. Add US3 → drawer role UI validated
5. Add US4 → secret word visibility validated
6. Polish → quickstart + builds

### Suggested Commit Granularity

- Commit after Foundational (backend model + snapshot + schemas + frontend types)
- Commit after each user story phase passes its checkpoint
- Final commit after quickstart validation

---

## Notes

- Total tasks: **28** (Setup: 2, Foundational: 9, US1: 4, US2: 4, US3: 3, US4: 4, Polish: 2)
- MVP scope: Phases 1–3 (T001–T015)
- Canvas drawing, guess submission, scoring, and restart deferred to Scenarios 3–4
- Deterministic word: first starter list entry (`rocket`); host always drawer
- No new REST endpoints — extend existing create/join/get/start per `contracts/rooms-api.md`
