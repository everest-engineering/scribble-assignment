---
description: "Task list for Game Start & Drawer Flow (Scenario 2)"
---

# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/api.md ✅

**Scenario 1 prerequisite**: `specs/001-scribble-game/` fully implemented and validated.

**Tests**: Not requested — manual two-tab validation per `quickstart.md`.

**Organization**: Tasks follow data-flow order: model → service → frontend.
US1 (drawer assignment) and US2 (word selection) share the same `startRoom()` edit
and are implemented together. US3 (word filtering) is the next discrete step.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: User story label (US1–US3)
- Exact file paths included in every description

---

## Phase 1: Setup

**Purpose**: Confirm Scenario 1 is working as the baseline for Scenario 2.

- [x] T001 Start backend and frontend, create a room, join from a second tab, start the game, and confirm both tabs navigate to `/game` — Scenario 1 must pass before any Scenario 2 work begins

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the shared type definitions — required before any user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Add `drawerId?: string` and `currentWord?: string` to both the `Room` interface and the `RoomSnapshot` interface in `backend/src/models/game.ts`
- [x] T003 [P] Add `drawerId?: string` and `currentWord?: string` to the `RoomSnapshot` interface in `frontend/src/services/api.ts`

**Checkpoint**: Type definitions updated — user story implementation can begin.

---

## Phase 3: User Story 1 & 2 — Drawer Assignment & Word Selection (Priority: P1) 🎯 MVP

**Goal**: When the game starts, the host is assigned as the drawer and "rocket" is stored
as the secret word. Both values are persisted in room state and returned in snapshots.

**Independent Test**: Start a game. Call `GET /rooms/:code?participantId=<hostId>` — confirm
the response includes `drawerId` matching the host's id and `currentWord: "rocket"`.
Restart and call again — confirm `currentWord` is still `"rocket"`.

### Implementation for User Story 1 & 2

- [x] T004 [US1] In `startRoom()` in `backend/src/services/roomStore.ts`, after the
  participant-count guard and before `saveRoom(room)`: set `room.drawerId = room.hostId`
  and `room.currentWord = STARTER_WORDS[0]`; this single edit covers both FR-001
  (drawer = host) and FR-004 (word = first starter word)
- [x] T005 [US1] In `toRoomSnapshot()` in `backend/src/services/roomStore.ts`, always
  include `drawerId: room.drawerId` in the returned object when the field is defined
  (spread `...(room.drawerId && { drawerId: room.drawerId })`)

**Checkpoint**: Drawer id and word are stored and returned. Verified with a direct API call.

---

## Phase 4: User Story 3 — Drawer-Only Word Visibility (Priority: P1)

**Goal**: The server includes `currentWord` only in snapshots sent to the drawer. Guessers
receive the same snapshot shape but with `currentWord` absent.

**Independent Test**: Start a game. Call `GET /rooms/:code?participantId=<drawerId>` —
confirm `currentWord: "rocket"` is present. Call `GET /rooms/:code?participantId=<guesserId>`
— confirm `currentWord` is absent from the response body.

### Implementation for User Story 3

- [x] T006 [US3] In `toRoomSnapshot()` in `backend/src/services/roomStore.ts`, remove
  the `void viewerParticipantId` no-op line; add
  `...(room.currentWord && viewerParticipantId === room.drawerId && { currentWord: room.currentWord })`
  to the returned object — word is omitted for guessers and for unauthenticated polls

**Checkpoint**: Word is server-filtered. Confirmed via DevTools Network tab showing two
different response bodies for drawer vs guesser.

---

## Phase 5: User Story 1 & 3 — Game Screen Display (Priority: P1)

**Goal**: The game screen shows the drawer's name to all players and shows the secret word
only to the drawer. Guessers see the drawer's identity but no word.

**Independent Test**: Start a game in two tabs. Tab A (drawer): confirms a "You are
drawing" or equivalent label and sees the word "rocket". Tab B (guesser): sees the
drawer's name but no word anywhere on screen.

### Implementation for User Story 1 & 3

- [x] T007 [US1] In `frontend/src/pages/GamePage.tsx`, read `{ room, participantId }`
  from `useRoomState()`; derive `isDrawer = participantId === room?.drawerId`; find the
  drawer's display name by looking up `room.drawerId` in `room.participants`; replace
  the canvas placeholder header/label with the drawer's name visible to all players and
  a "You are drawing" badge shown only when `isDrawer`
- [x] T008 [US3] In `frontend/src/pages/GamePage.tsx`, below the drawer label, render
  a "Secret word: {room.currentWord}" element only when `isDrawer && room.currentWord`;
  guessers see no word element — the condition must be strict (not just falsy) so an
  undefined word doesn't render an empty label

**Checkpoint**: Both tabs show correct drawer identity; only drawer sees the word.

---

## Phase 6: Polish & Validation

**Purpose**: End-to-end verification and build confirmation.

- [x] T009 Walk through all three scenarios in `specs/002-game-start-drawer/quickstart.md`
  with two browser tabs — all acceptance scenarios must pass, including the DevTools
  network check confirming `currentWord` is absent from the guesser's response
- [x] T010 [P] Run `cd backend && npm run build` — must exit 0 with no TypeScript errors
- [x] T011 [P] Run `cd frontend && npm run build` — must exit 0 with no TypeScript errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Scenario 1 must be green — blocks everything
- **Foundational (Phase 2)**: T002 and T003 are parallel; block all story work
- **US1+US2 (Phase 3)**: Depends on Phase 2; T004 before T005 (same file, sequential)
- **US3 (Phase 4)**: Depends on Phase 3 (needs `currentWord` stored before filtering)
- **Display (Phase 5)**: Depends on Phase 2 (frontend types); T007 before T008 (same file)
- **Polish (Phase 6)**: Depends on all phases complete

### Parallel Opportunities

```bash
# Phase 2: different files
T002  # backend/src/models/game.ts
T003  # frontend/src/services/api.ts

# Phase 6: independent builds
T010  # backend build
T011  # frontend build
```

---

## Implementation Strategy

### MVP First

1. Phase 1: Verify Scenario 1
2. Phase 2: Type extensions
3. Phase 3: T004 + T005 — drawer + word stored and in snapshot
4. **STOP and VALIDATE**: direct API call confirms drawerId and currentWord present

### Full Delivery

1. Phase 1–3 → Foundation + storage
2. Phase 4: T006 — server filtering working
3. Phase 5: T007 + T008 — game screen shows roles and word
4. Phase 6: Full quickstart + builds pass

---

## Notes

- T004 and T005 both modify `backend/src/services/roomStore.ts` — run sequentially
- T007 and T008 both modify `frontend/src/pages/GamePage.tsx` — run sequentially
- T006's spread syntax `...(condition && { field: value })` cleanly omits the field
  when the condition is false, producing a valid RoomSnapshot without the optional field
- The `viewerParticipantId` parameter in `toRoomSnapshot` was already present but
  unused (`void viewerParticipantId`) — T006 activates it with no signature change
