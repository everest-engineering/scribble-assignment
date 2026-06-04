# Tasks: Round Result, Restart & Final Validation

**Input**: Design documents from `specs/004-round-result-restart/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/rooms-api.md ✅

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US3)
- Paths use `backend/src/` and `frontend/src/` conventions

---

## Phase 1: Foundational — Backend Store Changes

**Purpose**: Update `toRoomSnapshot` gating for `"finished"` status and add `restartRoom()`
helper. All user stories depend on these backend changes.

**⚠️ CRITICAL**: All phases depend on this phase being complete first.

- [x] T001 In `backend/src/services/roomStore.ts`, update `toRoomSnapshot()` so `currentWord`
  is forwarded to ALL viewers when `room.status === "finished"` (lift viewer-gating in
  result state): change the ternary to
  `room.status === "finished" || (viewerParticipantId === room.drawerId && room.drawerId !== null) ? room.currentWord : null` (FR-003)
- [x] T002 In `backend/src/services/roomStore.ts`, add exported `restartRoom(code: string)`
  function: look up room from `rooms` map; if not found return `null`; set `status = "lobby"`,
  `drawerId = null`, `currentWord = null`, `strokes = []`, `guesses = []`; iterate all
  participants and set `score = 0`; update `updatedAt`; save back to map; return `getRoom()` (FR-008)

---

## Phase 2: Backend API — Schemas & Routes

**Purpose**: Add `POST /rooms/:code/end` and `POST /rooms/:code/restart`; extend
`POST /:code/guess` to auto-end on correct guess.

- [x] T003 Add `endRoundSchema` and `restartSchema` (both `{ participantId: z.string().uuid() }`) to
  `backend/src/api/schemas.ts` (FR-010, FR-011)
- [x] T004 [US1] In `backend/src/api/rooms.ts`, in the existing `POST /:code/guess` handler,
  after `if (correct) { participant.score += 100; }` add `room.status = "finished";` so the
  round ends atomically on a correct guess (FR-001)
- [x] T005 [US1] Add `POST /:code/end` handler in `backend/src/api/rooms.ts`: import
  `endRoundSchema`; parse code and body; `getRoom()` (404); check `room.status === "playing"`
  (400 if not); check `participantId === room.hostId` (403); set `room.status = "finished"`;
  `saveRoom(room)`; return `{ room: toRoomSnapshot(room, participantId) }` (FR-002)
- [x] T006 [US3] Add `POST /:code/restart` handler in `backend/src/api/rooms.ts`: import
  `restartSchema`; parse code and body; `getRoom()` (404); check `room.status !== "lobby"`
  (400 if already lobby); check `participantId === room.hostId` (403); call `restartRoom(code)`;
  return `{ room: toRoomSnapshot(updatedRoom, participantId) }` (FR-007)

---

## Phase 3: Frontend API Client

**Purpose**: Add `endRound` and `restartGame` methods to the frontend API client.

- [x] T007 Add `api.endRound(code: string, participantId: string)` method in
  `frontend/src/services/api.ts`: `POST /rooms/:code/end`, returns `{ room: RoomSnapshot }`
- [x] T008 Add `api.restartGame(code: string, participantId: string)` method in
  `frontend/src/services/api.ts`: `POST /rooms/:code/restart`, returns `{ room: RoomSnapshot }`

---

## Phase 4: US1 — Round End Trigger (Backend-Only Phase)

**Story goal**: A correct guess or manual host call transitions `room.status` to `"finished"`.

**Independent Test**: Call `POST /:code/guess` with a correct guess as a non-drawer;
confirm the response is `correct: true` and the next `GET /:code` returns `status:
"finished"` with `currentWord` visible. Then call `POST /:code/end` as the host while
`status === "playing"` and confirm the same transition.

All backend-only tasks for US1 are already covered by T004 and T005 above.

---

## Phase 5: US2 — Result Display on GamePage

**Story goal**: When `room.status === "finished"`, `GamePage` renders a result view showing
 the correct word, scoreboard, guess history, and a host-only "Restart Game" button.

**Independent Test**: End a round via correct guess or manual end. Confirm the game page
shows the word (visible to non-drawer), scores, history, and the host sees a restart button
while non-hosts see a waiting message.

- [x] T009 [US2] In `frontend/src/pages/GamePage.tsx`, replace the `room.drawerId === null`
  loading guard (line ~58) with a `switch` or `if/else` on `room.status`: remove the early
  return for `drawerId === null` because `"lobby"` and `"finished"` states both have
  `drawerId === null` but must render content, not a loading spinner
- [x] T010 [US2] In `frontend/src/pages/GamePage.tsx`, for `room.status === "finished"`,
  render a result view `<div>` containing: a `<Card title="Result">` showing the correct
  word (`room.currentWord` — now visible to all), the existing `<Scoreboard participants={room.participants} />`,
  the existing guess history list, and a "Restart Game" button visible only when
  `participantId === room.hostId`; non-hosts see "Waiting for host to restart..." (FR-004,
  FR-005, FR-006)
- [x] T011 [US2] In `frontend/src/pages/GamePage.tsx`, for `room.status === "playing"`, keep
  the existing game content (canvas, guess form, etc.) exactly as implemented in Scenario 3;
  the `drawerId === null` guard may be kept inside this branch only since a playing game
  always has a drawer assigned

---

## Phase 6: US3 — Host Restart & Post-Restart Lobby

**Story goal**: Host clicks restart → room returns to lobby with cleared state. All players
see simplified lobby content on `GamePage`.

**Independent Test**: Host clicks "Restart Game". Confirm both tabs show simplified lobby
content (participant list + host Start Game button) within one poll cycle. Confirm scores
are 0, strokes/guesses empty, drawerId null.

- [x] T012 [US3] In `frontend/src/pages/GamePage.tsx`, for `room.status === "lobby"`, render
  simplified lobby content: a `<Card title="Lobby">` with the participant list, and a
  "Start Game" button visible only when `participantId === room.hostId` (reuse the existing
  `api.startGame` call from `LobbyPage`); non-hosts see "Waiting for host to start..." (FR-004a)
- [x] T013 [US3] In `frontend/src/pages/GamePage.tsx`, wire the "Restart Game" button in
  the `"finished"` branch to call `api.restartGame(room.code, participantId)` then
  `roomStore.fetchRoom()` to refresh state

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: Type safety verification, build validation, manual acceptance test.

- [x] T014 [P] Verify no `any` types introduced across all modified files:
  `backend/src/services/roomStore.ts`, `backend/src/api/schemas.ts`, `backend/src/api/rooms.ts`,
  `frontend/src/services/api.ts`, `frontend/src/pages/GamePage.tsx`
- [x] T015 [P] Verify `toRoomSnapshot()` never leaks `currentWord` to non-drawers when
  `room.status === "playing"`; confirm it always reveals `currentWord` when
  `room.status === "finished"` regardless of `viewerParticipantId`
- [x] T016 [P] Run `npm run build` in `backend/` and confirm zero TypeScript errors
- [x] T017 [P] Run `npm run build` in `frontend/` and confirm zero TypeScript errors
- [x] T018 Manual two-tab acceptance test per plan.md Testing Strategy: create room (Tab A),
  join (Tab B), host starts game, Tab B submits correct guess → both tabs show result view
  with word revealed, Tab A sees restart button, Tab B sees waiting message, host clicks
  restart → both tabs show simplified lobby with scores 0, host starts game again → second
  round begins successfully

---

## Dependencies

```
T001 → T002   (store chain — sequential, same file)
T003 parallel with T001–T002 (different file — schemas)
T004 depends on T001 (needs toRoomSnapshot gating change for FR-001 to be testable)
T005 depends on T002, T003
T006 depends on T002, T003
T007–T008 (frontend API) depend on nothing backend-specific; parallel with T004–T006
T009 (GamePage guard refactor) depends on T007–T008
T010–T011 (result + playing branches) depend on T009
T012 (lobby branch) depends on T010–T011
T013 (restart button wiring) depends on T012
T014–T017 (polish) depend on T013; parallel with each other
T018 (manual test) depends on T017
```

### Phase Dependencies

- **Phase 1 (Foundational)**: No dependencies — start immediately
- **Phase 2 (Backend API)**: Depends on Phase 1 complete
- **Phase 3 (Frontend API)**: Can start in parallel with Phase 2
- **Phase 4 (US1)**: Already covered by backend-only T004–T005
- **Phase 5 (US2 Result)**: Depends on Phase 3 complete
- **Phase 6 (US3 Restart)**: Depends on Phase 5 complete
- **Phase 7 (Polish)**: Depends on Phase 6 complete

### Parallel Opportunities

- T001 and T003: parallel (different files — roomStore vs schemas)
- T007–T008 and T004–T006: parallel (frontend API vs backend routes)
- T014, T015, T016, T017: all parallel (read-only verification + separate build commands)

---

## Implementation Strategy

### MVP (US1 + US2 — Phases 1–5, T001–T011)

1. Complete Phase 1 (T001–T002) — backend store changes
2. Complete Phase 2 (T003–T006) — backend API routes
3. Complete Phase 3 (T007–T008) — frontend API methods
4. Complete Phase 5 (T009–T011) — GamePage result view + playing branch
5. **Validate**: end round via correct guess or manual end; confirm result view renders
   with word revealed, scores, history, and restart button for host only

### Full delivery (all phases)

6. Complete Phase 6 (T012–T013) — simplified lobby branch + restart button wiring
7. Complete Phase 7 (T014–T018) — polish + builds + manual acceptance test
