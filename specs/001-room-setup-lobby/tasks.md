---
description: "Task list for Room Setup & Lobby feature"
---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | data-model.md ✅ | contracts/api.md ✅ | research.md ✅

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story this task belongs to (US1–US4)
- Exact file paths included in all descriptions

---

## Phase 1: Setup

**Purpose**: Confirm the project runs cleanly before making changes.

- [ ] T001 Start backend (`cd backend && npm run dev`) and confirm `GET /health` returns `{ "ok": true }`
- [ ] T002 Start frontend (`cd frontend && npm run dev`) and confirm the Start screen loads at `http://localhost:5173`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend and frontend model changes that ALL user stories depend on.

⚠️ **CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 Add `hostId: string` to `Room` and `RoomSnapshot` interfaces and expand `RoomStatus` to `"lobby" | "active"` in `backend/src/models/game.ts`
- [ ] T004 Set `room.hostId = participant.id` (the first participant) in `createRoom` and include `hostId` in `toRoomSnapshot` return value in `backend/src/services/roomStore.ts`
- [ ] T005 [P] Add `hostId: string` to `RoomSnapshot` interface and expand `status` type to `"lobby" | "active"` in `frontend/src/services/api.ts`

**Checkpoint**: Run `npm run build` in `backend/` — TypeScript must compile with no errors before proceeding.

---

## Phase 3: User Story 1 — Host Creates a Room (Priority: P1) 🎯 MVP

**Goal**: Player enters a name, creates a room, and lands on the Lobby as the identified host.

**Independent Test**: Navigate to Create Room, enter "Alice", submit — confirm Lobby screen shows Alice's name, a room code, and a disabled Start Game button.

### Implementation for User Story 1

- [ ] T006 [US1] Update `createRoom` Zod schema to trim `playerName` and enforce `min(1)` (reject whitespace-only) in `backend/src/api/schemas.ts`
- [ ] T007 [US1] Add inline name validation to `CreateRoomPage.tsx`: trim input before submit; if empty after trim, display an inline error message and do not call the API in `frontend/src/pages/CreateRoomPage.tsx`

**Checkpoint**: Empty name on Create Room shows an inline error and does not navigate. Valid name creates a room and lands on Lobby with `hostId` visible in the API response.

---

## Phase 4: User Story 2 — Player Joins a Room (Priority: P1)

**Goal**: Player enters a name and a room code to join an existing room and appear in the lobby.

**Independent Test**: Open a second browser tab, enter "Bob" and the room code from Phase 3 (try lowercase) — confirm Lobby shows both Alice and Bob.

### Implementation for User Story 2

- [ ] T008 [P] [US2] Update `joinRoom` Zod schema to trim `playerName` and enforce `min(1)` in `backend/src/api/schemas.ts`
- [ ] T009 [P] [US2] Uppercase `req.params.code` before room lookup in the `joinRoom` handler in `backend/src/api/rooms.ts`
- [ ] T010 [US2] Add inline validation to `JoinRoomPage.tsx`: trim name and code before submit; show separate inline errors for empty name and empty code; uppercase code before API call; display API error message ("Room not found") inline on 404 in `frontend/src/pages/JoinRoomPage.tsx`
- [ ] T020 [US2] Add Zod `.regex(/^[A-Z0-9]+$/)` refinement on the room code after uppercasing in `joinRoom` to reject non-alphanumeric codes with a 400 error in `backend/src/api/rooms.ts` or `backend/src/api/schemas.ts`
- [ ] T021 [US1] [US2] Persist `participantId` to `sessionStorage` after successful create and join responses so host identity survives a page refresh in `frontend/src/pages/CreateRoomPage.tsx` and `frontend/src/pages/JoinRoomPage.tsx`

**Checkpoint**: Lowercase code joins successfully. Empty name shows error. Non-existent code shows "Room not found" inline. Code with special characters (e.g. `AB!D`) is rejected with an error. Refreshing the lobby page preserves the player's session.

---

## Phase 5: User Story 3 — Lobby Polls for New Participants (Priority: P2)

**Goal**: Lobby automatically refreshes the participant list every ~2 seconds without manual interaction.

**Independent Test**: With Alice in the lobby, join as Bob in Tab B — Alice's lobby shows Bob within ~2 seconds, no manual refresh needed.

### Implementation for User Story 3

- [ ] T011 [US3] Remove the manual "Refresh" button and add a `useEffect` that calls `api.fetchRoom()` via `setInterval` every 2000ms; clear interval on unmount; on poll failure retain last known state silently in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: New participant appears in all existing lobby tabs within ~2 seconds of joining.

---

## Phase 6: User Story 4 — Host Starts the Game (Priority: P2)

**Goal**: Host can start the game once ≥2 players are present; non-hosts cannot trigger it.

**Independent Test**: With 2 players in the lobby, confirm only the host's Start Game button is enabled; host clicks it; both tabs navigate to the Game screen.

### Implementation for User Story 4

- [ ] T012 [P] [US4] Add `StartRoomSchema` (`{ participantId: z.string().uuid() }`) in `backend/src/api/schemas.ts`
- [ ] T013 [US4] Implement `startRoom` handler: return 404 if room not found, 403 if caller is not `hostId`, 400 if fewer than 2 participants, otherwise set `status = "active"` and return updated snapshot in `backend/src/api/rooms.ts`
- [ ] T014 [US4] Wire `POST /rooms/:code/start` to the `startRoom` handler in `backend/src/api/router.ts`
- [ ] T015 [P] [US4] Add `startGame(code: string, participantId: string)` method (POST `/rooms/:code/start`) in `frontend/src/services/api.ts`
- [ ] T016 [US4] Add Start Game button to `LobbyPage.tsx`: disabled for non-host (show "Waiting for host…"); disabled for host when `participants.length < 2` (show "Waiting for more players…"); on host click call `api.startGame` then navigate to Game screen; lobby polling detects `status === "active"` for non-hosts and navigates them automatically in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: Non-host button is disabled. Host with 1 player — button disabled. Host with 2 players — button enabled; click navigates all tabs to Game screen. Direct `POST /rooms/:code/start` from non-host returns 403.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Build validation and end-to-end acceptance check.

- [ ] T017 [P] Run `npm run build` in `backend/` and confirm zero TypeScript errors
- [ ] T018 [P] Run `npm run build` in `frontend/` and confirm zero TypeScript errors
- [ ] T019 Complete the full validation flow in `specs/001-room-setup-lobby/quickstart.md` using two browser tabs and confirm all 7 checks in the validation table pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories**
- **US1 (Phase 3)** and **US2 (Phase 4)**: Both depend on Foundational; can proceed in parallel if staffed
- **US3 (Phase 5)**: Depends on Foundational; independent of US1/US2 (different file: LobbyPage)
- **US4 (Phase 6)**: Depends on Foundational; benefits from US1/US2 being complete for end-to-end testing
- **Polish (Phase 7)**: Depends on all user story phases

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependency on US2, US3, or US4
- **US2 (P1)**: Can start after Phase 2 — no dependency on US1, US3, or US4
- **US3 (P2)**: Can start after Phase 2 — no dependency on US1 or US2
- **US4 (P2)**: Can start after Phase 2 — end-to-end testing requires US1 + US2 done first

### Within Each User Story

- Backend schema changes before backend handler changes
- Backend changes before frontend API type changes
- Frontend API changes before frontend page changes
- Foundational model changes before any handler or page work

### Parallel Opportunities

- T005 (frontend types) can run in parallel with T003 + T004 (backend model)
- T008 and T009 within US2 can run in parallel (different concerns)
- T012 and T015 within US4 can run in parallel (different files)
- T017 and T018 in Polish can run in parallel

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — CRITICAL
3. Complete Phase 3: US1 (Host Creates Room)
4. **STOP and VALIDATE**: Test US1 independently
5. Proceed to US2

### Incremental Delivery

1. Setup + Foundational → model ready
2. US1 → host can create a room ✅
3. US2 → player can join by code ✅
4. US3 → lobby polls automatically ✅
5. US4 → host can start the game ✅
6. Polish → builds clean, quickstart passes ✅

---

## Notes

- `[P]` tasks touch different files and have no incomplete-task dependencies — safe to run in parallel
- `[US?]` label maps each task to its user story for traceability back to spec.md
- Commit after each checkpoint, not after every individual task
- Validate each checkpoint independently before moving to the next phase
