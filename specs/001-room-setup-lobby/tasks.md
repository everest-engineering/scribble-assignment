---
description: "Task list for Scenario 1 — Room Setup & Lobby"
---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md)

**Tests**: Included — backend unit tests via Vitest are requested by the
constitution's validation principle.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (create/host), US2 (join validation), US3 (live lobby/start)

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Backend host data so every story can identify the host.

- [ ] T001 [US1] Add `hostId: string` to `Room` and `RoomSnapshot` in
      `backend/src/models/game.ts`.
- [ ] T002 [US1] In `backend/src/services/roomStore.ts`, set `hostId` to the
      creating participant's id in `createRoom`, and include `hostId` in
      `toRoomSnapshot`.
- [ ] T003 [US1] Add `hostId: string` to the `RoomSnapshot` type in
      `frontend/src/services/api.ts` (keep backend/frontend types in sync).

**Checkpoint**: Host identity flows end-to-end through the snapshot.

---

## Phase 2: User Story 1 — Create a room as host (P1) 🎯 MVP

**Goal**: Creator becomes host; lobby shows the host indicator.

- [ ] T004 [US1] In `backend/src/services/roomStore.test.ts`, add a test asserting
      `createRoom()` sets `hostId` to the returned `participantId`.
- [ ] T005 [US1] In `frontend/src/pages/LobbyPage.tsx`, mark the host in the
      participant list with a "(Host)" indicator (`participant.id === room.hostId`).

**Checkpoint**: Create a room → see yourself listed as "(Host)".

---

## Phase 3: User Story 2 — Join with validation (P1)

**Goal**: Specific, friendly errors for empty and unknown codes.

- [ ] T006 [US2] In `frontend/src/pages/JoinRoomPage.tsx`, trim the code and
      reject empty/whitespace with "Room code is required" before any request.
- [ ] T007 [US2] In `JoinRoomPage.tsx`, map a join failure (backend 404) to the
      message "Room not found — check your code and try again".
- [ ] T008 [US2] In `backend/src/services/roomStore.test.ts`, add a test asserting
      two rooms are isolated (a participant in room A is absent from room B).

**Checkpoint**: Empty/unknown/valid codes each behave per spec.

---

## Phase 4: User Story 3 — Live lobby & host-only start (P2)

**Goal**: Automatic ~2s roster refresh; host-only, ≥2-player start.

- [ ] T009 [US3] In `LobbyPage.tsx`, add a `useEffect` that starts a 2000ms
      `setInterval` calling `roomStore.fetchRoom()` and clears it on unmount.
- [ ] T010 [US3] In `LobbyPage.tsx`, make poll failures non-fatal: keep the last
      roster and show a subtle status note (FR-011); do not redirect.
- [ ] T011 [US3] In `LobbyPage.tsx`, render the Start Game button only for the
      host (`room.hostId === participantId`), disabled until
      `room.participants.length >= 2`; show non-hosts a "Waiting for host to
      start…" message.

**Checkpoint**: Two tabs; B appears in A within ~2s; Start gated correctly.

---

## Phase 5: Validation

- [ ] T012 Run `cd backend && npm run build` and `npm test` — zero errors.
- [ ] T013 Run `cd frontend && npm run build` and `npm test` — zero errors.
- [ ] T014 Two-tab manual check of SC-001…SC-005; record result in the PR/scenario
      notes.

---

## Dependencies & Execution Order

- Phase 1 (T001–T003) blocks everything (host data + types).
- US1 (T004–T005), US2 (T006–T008), US3 (T009–T011) depend on Phase 1; US3's UI
  reuses the host check from US1's T005.
- Validation (Phase 5) runs last.

### Parallel Opportunities

- T003 [P] (frontend type) is independent of T001–T002 once the field name is
  agreed; T006/T007 (Join) are independent of T009–T011 (Lobby).

## Notes

- Commit after each logical group (model+store, join validation, lobby polling),
  with short messages, no co-author line — only after user approval.
- Verify the new backend tests fail before T001/T002, then pass after.
