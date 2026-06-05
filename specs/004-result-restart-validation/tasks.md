# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `/specs/004-result-restart-validation/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅

**Tests**: No test tasks — spec does not request TDD; validation is two-tab manual testing per Principle VI.

**Organization**: Tasks grouped by user story. All three stories are P1 and sequentially dependent for testing (US1 enables US2's entry point; US2 enables US3's entry point).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete task dependencies)
- **[Story]**: Maps to user story (US1, US2, US3)
- Exact file paths included in every task description

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema additions and snapshot logic change that every user story depends on.

**⚠️ CRITICAL**: All Phase 3–5 tasks depend on this phase being complete.

- [ ] T001 [P] Add `endRoomSchema` and `restartRoomSchema` (both `z.object({ participantId: z.string() })`) to `backend/src/api/schemas.ts`
- [ ] T002 Extend `toRoomSnapshot` in `backend/src/services/roomStore.ts`: include `secretWord` for all viewers when `room.status === "result"` (change the existing `if (room.drawerId && viewerParticipantId === room.drawerId)` guard to `if (room.status === "result" || (room.drawerId && viewerParticipantId === room.drawerId))`)
- [ ] T003 [P] Add `api.endRoom(code, participantId)` and `api.restartRoom(code, participantId)` methods to `frontend/src/services/api.ts` (both POST, body `{ participantId }`, return `{ room: RoomSnapshot }`)

**Checkpoint**: Schema types exist, word redaction logic is correct for result status, and frontend API methods are ready for store wiring.

---

## Phase 3: User Story 1 — Host Ends the Round (Priority: P1) 🎯 MVP

**Goal**: Host can click "End Round" during gameplay to transition the room to `"result"` status. The server validates host identity and returns the updated snapshot. Non-host players see the transition on their next poll.

**Independent Test**: Two tabs — Alice (host) and Bob (guesser). Alice clicks "End Round" on the game screen. The button triggers `POST /rooms/:code/end`. Verify (via network tab or room polling) that the room snapshot now has `status: "result"` and `secretWord` is present for all viewers. FR-001, FR-002, FR-004 (word in snapshot), FR-011 (403 for Bob) satisfied. Note: the results view UI is wired in US2.

- [ ] T004 [P] [US1] Add `endRoom(code: string, participantId: string)` to `backend/src/services/roomStore.ts`: 404 if room not found; 403 if `participantId !== room.hostId`; set `room.status = "result"`, update `updatedAt`, persist; return `{ room: toRoomSnapshot(cloneRoom(room), participantId) }`
- [ ] T005 [US1] Add `POST /:code/end` route to `backend/src/api/rooms.ts`: parse params with `roomCodeParamsSchema`, parse body with `endRoomSchema`, call `endRoom(code.toUpperCase(), participantId)`, respond with `{ room }` (import `endRoom` and `endRoomSchema`)
- [ ] T006 [P] [US1] Add `endRoom()` method to `frontend/src/state/roomStore.ts`: calls `api.endRoom(room.code, participantId)`, calls `this.setRoomSnapshot(response.room)`, returns the snapshot
- [ ] T007 [US1] Add host-only "End Round" button to `frontend/src/pages/GamePage.tsx`: add `isHost = room.hostId === participantId` constant; render `<button className="button button--secondary" onClick={handleEndRound}>End Round</button>` only when `isHost` is true (the existing `room.status === "result"` early return added in T009 ensures the button is never shown in result phase, satisfying FR-014); add `handleEndRound` async function that calls `store.endRoom()` and catches errors into `setPollError`

**Checkpoint**: Host clicks "End Round" → `POST /rooms/:code/end` returns 200 with `status: "result"` and `secretWord` visible. Bob's tab (via polling) also receives `status: "result"` within ~2 s. Non-host POST attempt returns 403.

---

## Phase 4: User Story 2 — All Players View Round Results (Priority: P1)

**Goal**: When `status === "result"`, all players automatically see the results view — word revealed, scores sorted descending, full colour-coded guess history, host sees "Restart" button placeholder, non-host sees personalised waiting message.

**Independent Test**: After Phase 3 checkpoint, Alice clicks "End Round". Both tabs now show `RoundResultsView` in place of the gameplay view (no page reload). Confirm: (1) secret word displayed on both tabs, (2) scores sorted highest first, (3) full guess history with green/red rows in submission order, (4) Alice sees "Restart" button, (5) Bob sees "Waiting for Alice to restart…". FR-003–FR-008 satisfied.

- [ ] T008 [P] [US2] Create `frontend/src/components/RoundResultsView.tsx`: reads `room` and `participantId` from `useRoomState()`; renders (a) word reveal (`room.secretWord`), (b) scores sorted descending (`[...room.participants].sort((a,b) => (room.scores[b.id]??0)-(room.scores[a.id]??0))`), (c) guess history in submission order with green/red colour-coding matching `ResultPanel` style (empty state: "No guesses were submitted."), (d) if `participantId === room.hostId`: "Restart" button (onClick stub — wired in T013), else: `"Waiting for {hostName} to restart…"` where `hostName = room.participants.find(p => p.id === room.hostId)?.name ?? "host"`
- [ ] T009 [P] [US2] Extend `frontend/src/pages/GamePage.tsx`: (a) add early return `if (room.status === "result") return <RoundResultsView />;` before the main JSX return (import `RoundResultsView`); (b) in the polling `setInterval` callback, after a successful `store.fetchRoom()`, add `if (updated?.status === "lobby") { clearInterval(id); navigate("/lobby"); }` to handle restart detection for non-host players

**Checkpoint**: Full results view displayed on both tabs immediately after "End Round" (host via API response, non-host via next poll). Polling continues silently; navigates to lobby when host restarts (wired in US3).

---

## Phase 5: User Story 3 — Host Restarts and All Players Return to Lobby (Priority: P1)

**Goal**: Host clicks "Restart" on the results screen. Room transitions to `"lobby"` with all round state cleared and all participants preserved. Non-host players detect the phase change via polling and navigate to the lobby automatically.

**Independent Test**: Both tabs on results screen. Alice clicks "Restart". Alice's screen transitions to lobby immediately (navigate to "/lobby" from `store.restartRoom()` success handler). Bob's tab transitions within ~2 s via polling. Confirm: lobby shows both Alice and Bob; starting a new game shows scores at 0 and blank canvas. FR-009, FR-010, FR-011 (403 for non-host restart) satisfied. SC-006, SC-007 confirmed.

- [ ] T010 [P] [US3] Add `restartRoom(code: string, participantId: string)` to `backend/src/services/roomStore.ts`: 404 if room not found; 403 if `participantId !== room.hostId`; set `room.status = "lobby"`, `room.drawerId = undefined`, `room.secretWord = undefined`, `room.guesses = []`, `room.scores = {}`, `room.canvasData = null`; keep `room.participants` and `room.hostId` intact; update `updatedAt`, persist; return `{ room: toRoomSnapshot(cloneRoom(room), participantId) }`
- [ ] T011 [US3] Add `POST /:code/restart` route to `backend/src/api/rooms.ts`: parse params with `roomCodeParamsSchema`, parse body with `restartRoomSchema`, call `restartRoom(code.toUpperCase(), participantId)`, respond with `{ room }` (import `restartRoom` and `restartRoomSchema`)
- [ ] T012 [P] [US3] Add `restartRoom()` method to `frontend/src/state/roomStore.ts`: calls `api.restartRoom(room.code, participantId)`, calls `this.setRoomSnapshot(response.room)`, returns the snapshot
- [ ] T013 [US3] Wire "Restart" button in `frontend/src/components/RoundResultsView.tsx`: replace the onClick stub with `async () => { await store.restartRoom(); navigate("/lobby"); }` (use `useRoomStore()` and `useNavigate()` inside the component); wrap in try/catch and display error inline if the API call fails

**Checkpoint**: Host clicks "Restart" → navigates to lobby immediately. Bob transitions within ~2 s. New game starts with 0 scores and blank canvas. Non-host restart attempt returns 403.

---

## Phase 6: Polish & Validation

**Purpose**: End-to-end two-tab validation of the complete Scenario 4 flow.

- [ ] T014 Manual two-tab validation: open Alice (host) and Bob (guesser) tabs; play a round (Bob submits correct + incorrect guesses); Alice clicks "End Round"; verify results screen on both tabs (word, sorted scores, guess history, Restart button vs waiting message); Alice clicks "Restart"; verify both tabs return to lobby with players preserved; start a new game and confirm scores begin at 0 and canvas is blank

**Checkpoint**: All acceptance scenarios from spec.md User Stories 1–3 confirmed passing. SC-001 through SC-008 verified.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (Foundational)**: No dependencies — can start immediately
- **Phase 3 (US1)**: Requires Phase 2 complete (T001 for schema, T002 for snapshot logic, T003 for api.ts)
- **Phase 4 (US2)**: Requires Phase 3 complete (T004/T005 for backend end-round, T006/T007 for frontend button)
- **Phase 5 (US3)**: Requires Phase 4 complete (T008/T009 for results view must exist before Restart button is wired)
- **Phase 6 (Validation)**: Requires Phase 5 complete

### Within Each Phase

```
Phase 2:  T001 ─┐
          T002 ──┤ all parallel
          T003 ─┘

Phase 3:  T004 ──► T005   (backend: service before route)
          T006 ──► T007   (frontend: store method before button)
          T004 ∥ T006     (backend service and frontend store can run simultaneously)

Phase 4:  T008 ∥ T009     (different files, fully parallel)

Phase 5:  T010 ──► T011   (backend: service before route)
          T012 ──► T013   (frontend: store method before button wire-up)
          T010 ∥ T012     (backend service and frontend store can run simultaneously)

Phase 6:  T014             (sequential — requires all prior phases)
```

### User Story Dependencies (for testing)

- **US1**: Independently deliverable at backend level; results view visible after US2
- **US2**: Requires US1 (needs "End Round" to enter result status for manual verification)
- **US3**: Requires US2 (needs results view to exist before Restart button can be wired and tested)

---

## Parallel Example: Phase 3 (US1)

```
Parallel track A (backend):
  T004 — Add endRoom() to backend/src/services/roomStore.ts
  T005 — Add POST /:code/end route to backend/src/api/rooms.ts

Parallel track B (frontend):
  T006 — Add store.endRoom() to frontend/src/state/roomStore.ts
  T007 — Add "End Round" button to frontend/src/pages/GamePage.tsx
```

## Parallel Example: Phase 4 (US2)

```
Parallel track A:
  T008 — Create frontend/src/components/RoundResultsView.tsx

Parallel track B:
  T009 — Extend GamePage.tsx (early return + polling lobby check)
```

---

## Implementation Strategy

### MVP First (Phase 2 + Phase 3 only)

1. Complete Phase 2: Foundational schema and snapshot changes
2. Complete Phase 3: US1 — host can end round via API
3. **STOP and VALIDATE**: confirm `POST /rooms/:code/end` returns `status: "result"` with word visible

### Incremental Delivery

1. Phase 2 → Foundation ready
2. Phase 3 → End-round backend + button wired (US1 ✅)
3. Phase 4 → Results view displayed to all players (US2 ✅)
4. Phase 5 → Restart returns all players to lobby (US3 ✅)
5. Phase 6 → Full two-tab end-to-end validation

---

## Notes

- `[P]` tasks modify different files and have no dependency on incomplete tasks in the same phase
- `RoundResultsView` uses `useRoomStore()` and `useNavigate()` directly — no prop drilling needed
- The "End Round" button visibility in `GamePage.tsx` relies on the early return for `status === "result"` (T009); T007 and T009 both modify `GamePage.tsx` — implement T007 first, then T009 adds the early return above the existing JSX
- `restartRoom` resets `scores` to `{}` (empty object) not to a zero-filled map — the zero-fill happens in `startRoom` when the next game begins (consistent with existing `startRoom` behaviour)
- Commit after each phase checkpoint to maintain granular git history (Principle VI)
