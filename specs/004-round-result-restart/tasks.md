---
description: "Task list for Round Result & Host Restart"
---

# Tasks: Round Result & Host Restart

**Input**: Design documents from `specs/004-round-result-restart/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/rooms-api.md](./contracts/rooms-api.md), [quickstart.md](./quickstart.md)

**Tests**: Per the constitution, **manual two-browser validation is the primary acceptance gate** and automated tests are optional. Test tasks below are marked _(optional)_ and are NOT TDD-ordered. They are recommended for the end/restart state transitions (FR-001/FR-009/FR-011), the `ended`-state reveal (FR-003/FR-005/FR-006), host-only authorization (FR-008), and regression coverage that the `playing`-state masking is unchanged (Constitution V).

**Organization**: Tasks are grouped by user story (priority order from spec.md). This is a **brownfield extension** of features 001/002/003 — tasks modify existing files and add **one** new page (`ResultsPage.tsx`), reusing the existing `Scoreboard`/`ResultPanel`; no rewrites. Builds on the active round + scoring shipped in 003.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US3 maps to the spec's user stories
- Exact file paths included in every task

## Path Conventions

Web app layout (existing): `backend/src/...`, `frontend/src/...` at repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish a known-green baseline before changes (brownfield — structure already exists).

- [X] T001 Capture a green baseline: `cd backend && npm install` / `cd frontend && npm install` (if needed), then `cd backend && npm run build` and `cd frontend && npm run build`.
- [X] T002 [P] Record the regression baseline by running existing tests: `cd backend && npm test` and `cd frontend && npm test` (all currently passing from 001–003).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared `RoomStatus` change every story depends on. No user story work begins until this phase is complete.

**⚠️ CRITICAL**: These are blocking prerequisites.

- [X] T003 Extend `RoomStatus` in `backend/src/models/game.ts`: change `export type RoomStatus = "lobby" | "playing"` to `"lobby" | "playing" | "ended"`. No other field changes (the result reuses the existing `Round`/`Participant`/`RoundSnapshot` shapes). (data-model)
- [X] T004 [P] Mirror the status in `frontend/src/services/api.ts`: change `RoomSnapshot.status` from `"lobby" | "playing"` to `"lobby" | "playing" | "ended"`. (data-model)

**Checkpoint**: Types compile (`cd backend && npm run build`, `cd frontend && npm run build`); stories can begin.

---

## Phase 3: User Story 1 - All players see the round result (Priority: P1) 🎯 MVP

**Goal**: The host ends the active round; the room enters the `ended` state and the result reveals the correct word, the final scores, and the full guess history to all viewers (correct guesses no longer masked).

**Independent Test**: As the host (drawer) in an active round with at least one incorrect and one correct guess recorded, click **End Round** → the host's screen transitions to a result view showing the revealed word, the final scores, and the full guess history. A non-host player's existing game poll carries them to the same result view. Attempting to end as a non-host is rejected. (FR-001–FR-007)

### Implementation for User Story 1

- [X] T005 [US1] In `backend/src/services/roomStore.ts`: add `export type EndRoundFailure = "not_found" | "not_host" | "not_active"` and `endRound(code, participantId): { room: Room } | { failure: EndRoundFailure }`. Mirror `startGame`'s preamble (refresh requester `lastSeenAt`, `pruneStaleParticipants`, `closeIfEmptyOrHostGone → not_found`). Guards: `room.hostId !== participantId → not_host` (FR-001); `room.status !== "playing" || !room.round → not_active` (FR-001). On success set `room.status = "ended"` (keep `room.round` intact), `room.updatedAt = now()`, persist, and return `cloneRoom(room)`.
- [X] T006 [US1] In `backend/src/services/roomStore.ts` `toRoundSnapshot`: when `room.status === "ended"`, (a) include `snapshot.word = word` for **every** viewer (not just the drawer), and (b) build each `GuessSnapshot` **with** its `text` for **all** guesses (correct ones included). When `room.status === "playing"`, keep the existing behavior byte-for-byte (word drawer-only; correct guesses omit `text`). Pass `room.status` into the projection as needed. (FR-003, FR-005, FR-006; regression-safe per research D3)
- [X] T007 [US1] In `backend/src/api/rooms.ts`: add `router.post("/:code/end", ...)` — parse `roomCodeParamsSchema` + reuse `startRoomSchema` for `{ participantId }`; call `endRound(code.toUpperCase(), participantId)`; map failures `not_host → 403 "Only the host can end the round."`, `not_active → 409 "There is no active round to end."`, `not_found → 404 "Room not found"`; on success respond `{ room: toRoomSnapshot(result.room, participantId) }`. Import `endRound` from `../services/roomStore.js`.
- [X] T008 [P] [US1] In `frontend/src/services/api.ts`: add `endRound(code, participantId)` posting `{ participantId }` to `/rooms/:code/end` and returning `{ room: RoomSnapshot }` (mirror `startRoom`).
- [X] T009 [US1] In `frontend/src/state/roomStore.ts`: add `async endRound()` — guard `room`/`participantId`, call `api.endRound(code, participantId)` via `withLoading`, then `setRoomSnapshot(response.room)`; surface errors through the existing error state. (depends on T008)
- [X] T010 [US1] In `frontend/src/pages/GamePage.tsx`: add a **host-only** "End Round" button (visible when `participantId === room.hostId`) that calls `roomStore.endRound()`; add an effect that navigates to `/results` when `room.status === "ended"` (so the host and any polling non-host move to the result view). (depends on T009; uses the existing ~2s GamePage poll from 003)
- [X] T011 [P] [US1] Create `frontend/src/pages/ResultsPage.tsx`: read `useRoomState()`; if `!room` navigate to `/` (replace). Render a header, the revealed word (`round.word` shown to everyone), and the existing `<Scoreboard />` (final scores) and `<ResultPanel />` (full guess history) components. (Restart button added in US2; poll loop in US3.)
- [X] T012 [US1] In `frontend/src/routes.tsx`: import `ResultsPage` and add `<Route path="/results" element={<ResultsPage />} />`. (depends on T011)
- [X] T013 [P] [US1] _(optional)_ In `backend/src/services/roomStore.test.ts`: assert `endRound` by the host on a `playing` room sets `status === "ended"` and keeps `round`; `endRound` by a non-host returns `{ failure: "not_host" }`; `endRound` on a `lobby` room returns `{ failure: "not_active" }`; and `toRoomSnapshot` in the `ended` state returns `round.word` for a **non-drawer** viewer and includes `text` on a correct guess.

**Checkpoint**: The host can end the round and see the full result; non-host players are carried to the result view by the existing game poll. US1 is independently demoable.

---

## Phase 4: User Story 2 - Host restarts to a fresh lobby (Priority: P1)

**Goal**: From the result state, the host restarts; the room returns to `lobby` with all players preserved (and host role), the round cleared (`round = null`), and every score reset to 0 — a fresh, startable lobby. Restart is host-only and idempotent.

**Independent Test**: As the host on the result screen, click **Restart** → the host returns to the lobby with all players still listed and can immediately Start Game again; inspecting the room shows `status: "lobby"`, `round: null`, all scores 0. Restarting again is a harmless no-op. (FR-008–FR-011, FR-013, FR-014)

### Implementation for User Story 2

- [X] T014 [US2] In `backend/src/services/roomStore.ts`: add `export type RestartFailure = "not_found" | "not_host"` and `restartRoom(code, participantId): { room: Room } | { failure: RestartFailure }`. Mirror the `startGame` preamble (heartbeat, prune, `closeIfEmptyOrHostGone → not_found`). Guard `room.hostId !== participantId → not_host` (FR-008). If `room.status === "lobby"` already, return `cloneRoom(room)` unchanged (idempotent no-op, FR-014). Otherwise set `room.status = "lobby"`, `room.round = null` (FR-011), `room.participants.forEach(p => p.score = 0)` (FR-011), leave `participants` and `hostId` untouched (FR-010), `room.updatedAt = now()`, persist, and return `cloneRoom(room)`. (FR-009, FR-013)
- [X] T015 [US2] In `backend/src/api/rooms.ts`: add `router.post("/:code/restart", ...)` — parse `roomCodeParamsSchema` + reuse `startRoomSchema` for `{ participantId }`; call `restartRoom(code.toUpperCase(), participantId)`; map `not_host → 403 "Only the host can restart the game."`, `not_found → 404 "Room not found"`; on success respond `{ room: toRoomSnapshot(result.room, participantId) }`. Import `restartRoom`.
- [X] T016 [P] [US2] In `frontend/src/services/api.ts`: add `restartGame(code, participantId)` posting `{ participantId }` to `/rooms/:code/restart` and returning `{ room: RoomSnapshot }`.
- [X] T017 [US2] In `frontend/src/state/roomStore.ts`: add `async restartGame()` — guard `room`/`participantId`, call `api.restartGame(code, participantId)` via `withLoading`, then `setRoomSnapshot(response.room)`. (depends on T016)
- [X] T018 [US2] In `frontend/src/pages/ResultsPage.tsx`: add a **host-only** "Restart" button (visible when `participantId === room.hostId`) that calls `roomStore.restartGame()`; add an effect that navigates to `/lobby` when `room.status === "lobby"` (so the acting host returns to the fresh lobby). (depends on T017)
- [X] T019 [P] [US2] _(optional)_ In `backend/src/services/roomStore.test.ts`: assert `restartRoom` by the host on an `ended` room sets `status === "lobby"`, `round === null`, every `participant.score === 0`, and preserves the participant ids + `hostId`; `restartRoom` by a non-host returns `{ failure: "not_host" }`; calling `restartRoom` again on the now-`lobby` room is a no-op success (FR-014).

**Checkpoint**: US1 + US2 deliver the full end-of-round loop for the host: end the round, view the result, restart to a fresh lobby and play again.

---

## Phase 5: User Story 3 - Everyone is synchronized through result and restart (Priority: P2)

**Goal**: Non-host players are carried into the result state and back to the lobby automatically via the ~2s poll, and only the host sees the End Round / Restart actions.

**Independent Test**: With two browsers on the result screen, the host clicks Restart → within ~2s the non-host returns to the lobby automatically (no refresh), with both players still present. Confirm the non-host sees **no** End Round button (game screen) and **no** Restart button (result screen). (FR-002, FR-007, FR-008, FR-012; SC-003/4/5/7)

### Implementation for User Story 3

- [X] T020 [US3] In `frontend/src/pages/ResultsPage.tsx`: add a `~2s` polling loop (mirror `GamePage`/`LobbyPage`: `setInterval` + `POLL_INTERVAL_MS` calling `roomStore.fetchRoom().catch(() => {})`, cleared on unmount, keyed on `room?.code`). This is what lets a **non-host** on the result screen pick up the host's restart (`status: "lobby"`) and trigger the navigate-to-lobby effect (T018), and keeps the revealed result fresh. Inherits the existing 404 → room-closed ejection from `state/roomStore.ts`. (FR-007, FR-012)
- [X] T021 [US3] Verify host-only gating end-to-end: in `frontend/src/pages/GamePage.tsx` the End Round button (T010) and in `frontend/src/pages/ResultsPage.tsx` the Restart button (T018) render **only** when `participantId === room.hostId`; a non-host viewer sees neither. (Enforces FR-008 / SC-007 on the client; the server already enforces `403`.)
- [X] T022 [P] [US3] _(optional)_ In `backend/src/services/roomStore.test.ts`: assert that after `endRound`, `toRoomSnapshot(room, <non-host id>)` reveals `round.word` and full guess `text` to that non-host viewer (the channel that syncs the result to everyone, FR-007), and that `endRound`/`restartRoom` by a non-host id leave `status` unchanged.

**Checkpoint**: All three user stories are independently functional; non-host players follow the host through end and restart automatically, and only the host controls both.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, regression safety, and confirming scoped-out behaviors.

- [X] T023 [P] Update `frontend/src/services/api.test.ts`: add coverage that `endRound` POSTs `{ participantId }` to `/rooms/:code/end` and `restartGame` POSTs `{ participantId }` to `/rooms/:code/restart`, each returning `{ room }`; adjust any `status` typing assertion to allow `"ended"`.
- [X] T024 [P] Confirm regression & scoped-out behaviors require **no extra code**: while `status === "playing"` the snapshot still hides `round.word` from guessers and masks correct guesses (features 002/003 invariants intact); the host leaving still **closes the room** (no host transfer added — research D5); restart returns to the **lobby**, not a next round (no timer/rotation). Add a brief code comment where helpful.
- [X] T025 Run the build + test gate: `cd backend && npm run build`, `cd frontend && npm run build`, `cd backend && npm test` — all green before raising a PR (Constitution: Build gate).
- [X] T026 Execute the two-browser acceptance script in [quickstart.md](./quickstart.md): US1 (host ends round → all see word/scores/full history within ~2s), US2 (host restarts → fresh lobby, players preserved, scores 0, startable again; idempotent double-click), US3 (non-host auto-follows into result and back to lobby; non-host has no End/Restart), plus the 001/002/003 regression checks. ✅ **Automated end-to-end API validation passed (2026-06-08)**: against the running server — guesser view hides word + masks correct guess while `playing`; non-host `end`/`restart` → 403; host `end` → 200 with word revealed + full history text; host `restart` → 200 → `lobby`, `round: null`, all scores 0, both players preserved; repeat restart → 200 (idempotent). ✅ **Manual two-browser UI walkthrough passed (2026-06-08)**: US1 (host End Round → both players on the result screen with revealed word/scores/full history within ~2s), US2 (host Restart → fresh lobby, players preserved, scores 0, startable again; idempotent double-click), US3 (non-host auto-follows into result and back to lobby; non-host sees no End/Restart), plus the 001/002/003 regression checks — all confirmed.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories** (the `RoomStatus` "ended" value).
- **User Stories (Phase 3–5)**: All depend on Foundational.
- **Polish (Phase 6)**: Depends on the user stories being implemented.

### User Story Dependencies

- **US1 (P1)**: After Foundational. No dependency on other stories. Delivers end-round → result view end-to-end (backend + host UI + ResultsPage display).
- **US2 (P1)**: After Foundational. **Depends on US1** for the `ResultsPage` (US2 adds the Restart button + navigate-on-lobby to it) and to have an `ended` room to restart from. Sequence US1 → US2.
- **US3 (P2)**: After US1 + US2 (it adds the `ResultsPage` poll loop that propagates US2's restart to non-host players, and verifies the host-only gating wired in US1/US2). Sequence US1 → US2 → US3.

### Within Each User Story

- Backend store/snapshot/route before the frontend calls/rendering that consume them.
- `api.*` (T008/T016) before the matching `state/roomStore` method (T009/T017) before the page wiring (T010/T018).
- `ResultsPage` creation (T011) before the route (T012) and before US2/US3 enhancements to it.
- Optional tests can be written alongside or after the implementation they cover (not TDD-gated, per constitution).

### Parallel Opportunities

- Foundational T003 (backend) and T004 (frontend) are different files → parallel.
- Within US1: `api.endRound` (T008) and the new `ResultsPage` (T011) are independent of the backend tasks → `[P]`; optional test T013 is `[P]`.
- Within US2: `api.restartGame` (T016) and optional test T019 are `[P]`.
- Polish T023 and T024 are parallel.
- `Scoreboard.tsx` and `ResultPanel.tsx` need **no changes** (reused as-is) — fewer moving parts.

---

## Parallel Example: Foundational

```bash
# Setup done; both type edits are independent files:
Task: "Add \"ended\" to RoomStatus in backend/src/models/game.ts (T003)"
Task: "Add \"ended\" to RoomSnapshot.status in frontend/src/services/api.ts (T004)"
```

## Parallel Example: within User Story 1

```bash
# After the foundational status change lands:
Task: "Add api.endRound to frontend/src/services/api.ts (T008)"
Task: "Create frontend/src/pages/ResultsPage.tsx display view (T011)"
Task: "Optional: endRound + ended-snapshot tests in backend/src/services/roomStore.test.ts (T013)"
# (backend T005–T007 proceed alongside on the server side)
```

---

## Implementation Strategy

### MVP First (US1)

1. Phase 1 Setup → Phase 2 Foundational.
2. US1 (end round → reveal result) → **validate** as the host: ending an active round reveals the word, final scores, and full history on the result screen; ending as a non-host is rejected.
3. This is the core "see the outcome" MVP.

### Incremental Delivery

1. Foundational ready (`RoomStatus` "ended").
2. US1 → demo the result reveal (host ends round, result view shows word/scores/history).
3. US2 → add restart → demo the return to a fresh, startable lobby with players preserved and scores 0.
4. US3 → add the `ResultsPage` poll loop + host-only gating → demo non-host players auto-following through end and restart.
5. Polish → api tests + regression confirmation + build gate + quickstart.

---

## Notes

- [P] = different files, no dependency on an incomplete task.
- [Story] label maps each task to a spec user story for traceability.
- **Brownfield**: backend tasks add two functions to existing `roomStore.ts` and two routes to `rooms.ts`; frontend adds one page (`ResultsPage.tsx`) and reuses `Scoreboard`/`ResultPanel` unchanged — no rewrites (Constitution I).
- **Reveal lifecycle (FR-003/FR-005/FR-006)**: the word + correct-guess `text` are exposed **only** when `status === "ended"`; gating the change in `toRoundSnapshot` keeps the `playing` projection unchanged (regression-safe — verify in the network tab).
- **Polling, not real-time (Constitution III)**: result + return-to-lobby sync ride the existing ~2s GET poll (US3 adds the missing `ResultsPage` loop); `POST /rooms/:code/end` and `POST /rooms/:code/restart` are action endpoints like `/start`. No timers/streaming/push.
- **Scope (Constitution IV)**: restart returns to the **lobby**, not a next round; no timer, no drawer rotation, no leaderboard. No host-transfer mechanism — the host leaving closes the room (existing behavior). No new dependencies, no persistence.
- Commit after each task or logical group; messages traceable to task IDs.
