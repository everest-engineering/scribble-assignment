---
description: "Tasks for feature 002 — Game Start & Drawer Flow"
---

# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/rooms-api.md](./contracts/rooms-api.md), [quickstart.md](./quickstart.md)

**Tests**: Required by constitution Principle V — every spec-mandated behavior (input validation, host gating, room isolation, polling cadence, **visibility filtering for the secret word**, **idempotent start**, **deterministic word selection**) ships with Vitest coverage.

**Organization**: One phase per user story, in priority order. P1 stories (US1, US2) form the feature MVP; US3 (P2) is determinism verification.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Independent file, no dependency on other in-flight tasks; safe to parallelise.
- **[Story]**: Maps the task to a user story from `spec.md`.
- Exact, absolute-style file paths in every description.

## Path Conventions

Two-package web app per `plan.md` "Project Structure":

- Backend: `backend/src/{api,models,services,seed}/`
- Frontend: `frontend/src/{components,hooks,pages,services,state}/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the baseline from `001-room-setup-lobby` is intact before extending it.

- [X] T001 Confirm `backend/` and `frontend/` test suites currently pass on `scribble-lab` by running `npm test` in each package; tasks below assume a green starting point. No file change.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the shared type/wire shape so every story below can compile. **No US-tagged work may begin until this phase is green.**

- [X] T002 Extend `backend/src/models/game.ts`: add `interface Round { roundNumber: number; drawerParticipantId: string; secretWord: string }`; change `Room.status` to `"lobby" | "round"`; add `Room.round: Round | null`; add `ParticipantView.isDrawer: boolean`; extend `RoomSnapshot` with `round: RoundView | null` and define `interface RoundView { roundNumber: number; drawerParticipantId: string; maskedWord: string; secretWord?: string }`. Cite **FR-001, FR-003**.
- [X] T003 [P] In `backend/src/services/roomStore.ts`, export a pure helper `selectWordForRound(words: readonly string[], roundNumber: number): string` implementing `words[(roundNumber - 1) % words.length]`; throw `Error("No words available")` when `words.length === 0`. Do NOT yet hook it into `startRoom` (that lands in US1). Cite **FR-004, FR-010**.
- [X] T004 [P] Mirror the wire types in `frontend/src/services/api.ts`: change `RoomSnapshot.status` to `"lobby" | "round"`; add `ParticipantView.isDrawer: boolean`; add `RoomSnapshot.round: RoundView | null` and define `RoundView` with optional `secretWord`. Cite **FR-001, FR-003, FR-005**.

**Checkpoint**: Both packages still compile; existing 57 tests still pass; the new shape is available everywhere but no behavior change yet.

---

## Phase 3: User Story 1 - Round 1 begins with the host as the visible drawer (Priority: P1) 🎯 MVP

**Goal**: Pressing Start in a valid lobby transitions every connected client to a "Round 1" view that clearly names the host as the drawer.

**Independent Test**: With Alice + Bob in a lobby, Alice presses Start. Both tabs render "Round 1 — Alice is drawing" within ~2s; Alice's tile carries a "Drawer" indicator; Bob's does not.

### Tests for User Story 1

- [X] T005 [P] [US1] In `backend/src/services/roomStore.test.ts`, add cases asserting that after a successful `startRoom(code, hostId)` the room satisfies: `status === "round"`, `room.round !== null`, `room.round.roundNumber === 1`, `room.round.drawerParticipantId === room.hostParticipantId`. Cite **FR-001, FR-002**.
- [X] T006 [P] [US1] In `backend/src/services/roomStore.test.ts`, add cases asserting `startRoom` is idempotent once a round exists: calling it twice with the host id returns `{ ok: true }` both times and the second call's room is the **same reference** (or deeply equal) — same `drawerParticipantId`, same `secretWord`, `roundNumber` still `1`. Also assert a non-host call during an active round returns `{ ok: false, reason: "not_host" }`. Cite **FR-007**.
- [X] T007 [P] [US1] In `backend/src/api/rooms.test.ts`, add a case asserting `POST /rooms/:code/start` with the host id, after a join, returns `200` with `room.status === "round"`, `room.round.roundNumber === 1`, `room.round.drawerParticipantId === room.hostParticipantId`, and at least one `participants[i].isDrawer === true`. Cite **FR-001, FR-002, FR-003**.
- [X] T008 [P] [US1] In `backend/src/api/rooms.test.ts`, add a case asserting that calling `POST /rooms/:code/start` **twice** with the host id returns 200 both times and the second body is deep-equal to the first (same drawer, same word). Cite **FR-007**.
- [X] T009 [P] [US1] Create `frontend/src/components/RoundView.test.tsx` (new file) exercising a pure-function `getRoundViewState(room, viewerParticipantId)` exported from `frontend/src/components/RoundView.tsx`: returns `{ mode: "lobby" }` when `room.round === null`; `{ mode: "drawer", drawerName, word, maskedWord, roundNumber }` when the viewer is the drawer; `{ mode: "guesser", drawerName, maskedWord, roundNumber }` otherwise. Cite **FR-001, FR-003**.

### Implementation for User Story 1

- [X] T010 [US1] In `backend/src/services/roomStore.ts`, extend `startRoom(code, requesterId)`: on the existing `ok` outcome, if `room.round === null`, set `room.round = { roundNumber: 1, drawerParticipantId: room.hostParticipantId, secretWord: selectWordForRound(STARTER_WORDS, 1) }` and `room.status = "round"`; refresh `updatedAt`. If `room.round !== null`, **return the existing room unchanged** (idempotent). Preserve the existing `not_host` / `not_enough_players` / `not_found` paths. Cite **FR-001, FR-002, FR-007**.
- [X] T011 [US1] In `backend/src/services/roomStore.ts`, extend `toRoomSnapshot(room, viewerParticipantId)`: emit `status: room.status`; when `room.round !== null` emit `round: { roundNumber, drawerParticipantId, maskedWord }` (maskedWord built later in US2 — for now use `room.round.secretWord.replace(/[^ ]/g, "_")`); attach `isDrawer: participant.id === room.round.drawerParticipantId` on every `ParticipantView`. Do **not** yet emit `secretWord` — US2 wires the drawer-only reveal. Cite **FR-001, FR-003**.
- [X] T012 [US1] In `frontend/src/components/RoundView.tsx` (new file), export `getRoundViewState(room, viewerParticipantId)` returning the discriminated state from T009 and render: a banner reading **"Round {roundNumber} — {drawerName} is drawing"**; for now show the `maskedWord` as the word area for everyone (US2 splits drawer vs guesser). No new dependencies. Cite **FR-001, FR-003**.
- [X] T013 [US1] In `frontend/src/pages/LobbyPage.tsx`, render `<RoundView room={room} viewerParticipantId={participantId} />` when `room.round !== null`; hide the Start Game button while in round; keep the participant list and `RoomCodeBadge` visible above the round panel. Also tag the host's participant tile with a **"Drawer"** badge when `participant.isDrawer === true`. Cite **FR-001, FR-003**.

**Checkpoint**: Two-tab quickstart Scenario 1 transition works; both tabs see "Round 1 — Alice is drawing"; everyone sees the same masked word area (no leakage yet because no cleartext is emitted at all — US2 makes it drawer-only).

---

## Phase 4: User Story 2 - The secret word is visible only to the drawer (Priority: P1)

**Goal**: The drawer sees the cleartext secret word; every other participant's payload and UI show only a length-only mask.

**Independent Test**: After Start, Alice's UI prominently shows `Your word: ROCKET`. Bob's UI shows `______` and a search of Bob's network response for the substring `rocket` returns zero matches.

### Tests for User Story 2

- [X] T014 [P] [US2] In `backend/src/services/roomStore.test.ts`, add cases asserting `toRoomSnapshot` returns `round.secretWord === "rocket"` **only** for the drawer's `viewerParticipantId`, and that `round.secretWord` is `undefined` (key absent) for any non-drawer or for `undefined` viewer; `round.maskedWord` length equals the secret word length in **all** in-round cases. Cite **FR-005, FR-006**.
- [X] T015 [P] [US2] In `backend/src/api/rooms.test.ts`, add a case that: creates a room, joins as Bob, starts the round, polls `GET /rooms/:code?participantId=<bob>` and asserts the **raw JSON response body** (not the parsed object) does not contain the substring `"secretWord"`. Polling with `participantId=<alice>` MUST contain `"secretWord":"rocket"`. Cite **FR-005**.
- [X] T016 [P] [US2] In `frontend/src/components/RoundView.test.tsx`, add cases asserting that for `mode: "drawer"`, the rendered DOM contains the cleartext word (case-insensitive match) **and** the masked indicator; for `mode: "guesser"`, the rendered DOM contains the masked indicator and does NOT contain the cleartext word as a standalone token. Cite **FR-005, FR-006**.

### Implementation for User Story 2

- [X] T017 [US2] In `backend/src/services/roomStore.ts`, finalise `toRoomSnapshot`'s round payload: compute `maskedWord = room.round.secretWord.replace(/[^ ]/g, "_")`; attach `secretWord: room.round.secretWord` **only** when `viewerParticipantId !== undefined && viewerParticipantId === room.round.drawerParticipantId`. Otherwise the field is omitted entirely (do not set to `null`, do not set to empty string). Cite **FR-005, FR-006**.
- [X] T018 [US2] In `frontend/src/components/RoundView.tsx`, split the rendering: when `state.mode === "drawer"` render a prominent "Your word" panel showing `state.word` plus the small `maskedWord` underneath as a UI hint; when `state.mode === "guesser"` render only the `maskedWord` panel and a "Waiting for the drawer…" sub-line. No client-side computation of the mask — render the string from the server byte-for-byte. Cite **FR-005, FR-006**.

**Checkpoint**: Quickstart Scenario 1 (steps 4–7) passes. The "guesser network response contains no `rocket` substring" assertion holds. **MVP for this feature is complete.**

---

## Phase 5: User Story 3 - The secret word is selected deterministically (Priority: P2)

**Goal**: For the current starter word list, round 1's word is always the first list entry (`"rocket"`), every reset, every room. Empty word list fails fast.

**Independent Test**: 10 backend resets in a row each produce `"rocket"` as round-1's `secretWord`. Two independent rooms started at round 1 both see `"rocket"`.

### Tests for User Story 3

- [X] T019 [P] [US3] In `backend/src/services/roomStore.test.ts`, add cases for the `selectWordForRound` helper: round 1 against `["a","b","c"]` → `"a"`; round 3 → `"c"`; round 4 → `"a"` (wrap); round 100 → `"a"` (still deterministic); empty array → throws `Error("No words available")`. Cite **FR-004, FR-010**.
- [X] T020 [P] [US3] In `backend/src/services/roomStore.test.ts`, add a case asserting that for two independently created rooms, after each starts the round, both `room.round.secretWord === "rocket"` against the live `STARTER_WORDS`. Cite **FR-004**.

### Implementation for User Story 3

- [X] T021 [US3] Confirm `selectWordForRound` from T003 is called inside `startRoom` (wired in T010) and that no caller substitutes a randomised selection elsewhere. If a divergence is found, fix it in `backend/src/services/roomStore.ts`. Otherwise this task is a code-grep verification, not a code change. Cite **FR-004**.

**Checkpoint**: All three user stories pass independently. Quickstart Scenario 2 passes 10/10.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T022 [P] Update `README.md` "Current Implementation" section: move "start game flow" and "drawer assignment" and "secret word visibility rules" out of "Not implemented yet" into a new "Implemented today (Scenario 2 — Game Start & Drawer)" bullet list. Do not touch unrelated bullets. Cite constitution Principle V.
- [X] T023 Run `npm test` in both `backend/` and `frontend/` and confirm the full suite (existing 57 + new cases) passes. Capture the totals in this task's notes.
- [X] T024 Walk through `specs/002-game-start-drawer/quickstart.md` end-to-end with two browser tabs and confirm all four scenarios pass. Note any deviations in `specs/002-game-start-drawer/checklists/requirements.md` Notes.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Phase 1; **blocks every user story**.
- **US1 (Phase 3)**: depends on Phase 2.
- **US2 (Phase 4)**: depends on Phase 2 (independent of US1's UI but reuses the snapshot shape that US1 wires). Practically: run after US1's T010+T011 since US2 finalises the same `toRoomSnapshot` function.
- **US3 (Phase 5)**: depends on Phase 2's T003 (`selectWordForRound` helper). Can run in parallel with US1/US2 tests; impl task T021 only needs T010 to land.
- **Polish (Phase 6)**: after all stories complete.

### Within Each User Story

- Tests are written first and fail until their paired implementation task lands.
- Backend types (T002) come before backend logic (T010, T011, T017).
- Frontend types (T004) come before frontend rendering (T012, T013, T018).
- Story complete before moving to next priority.

### Parallel Opportunities

- T003 and T004 (helper + frontend types) can land in parallel after T002.
- All tests within a story marked `[P]` can be written in parallel.
- Backend test file `roomStore.test.ts` is appended-to by T005, T006, T014, T019, T020 — these are not literally parallelisable in the file-system sense (same file), but each adds an independent `describe` block; the `[P]` marker still applies because they have no logical dependency on each other. Land them in any order.
- Frontend test file `RoundView.test.tsx` is created fresh in T009 and extended in T016; T009 must precede T016 in the same file.

---

## Parallel Example: User Story 1

```bash
# After T002 + T003 + T004 are green, all five US1 test tasks can be drafted in parallel
# (T007/T008 live in rooms.test.ts; T005/T006 in roomStore.test.ts; T009 in a new file):

Task: "T005 [P] [US1] roomStore.test.ts — startRoom assigns host as drawer"
Task: "T006 [P] [US1] roomStore.test.ts — startRoom is idempotent"
Task: "T007 [P] [US1] rooms.test.ts — POST start returns round payload"
Task: "T008 [P] [US1] rooms.test.ts — POST start is idempotent over the HTTP boundary"
Task: "T009 [P] [US1] RoundView.test.tsx — pure helper getRoundViewState"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

Constitution Principle V treats the word-visibility guarantee (FR-005) as non-negotiable. The MVP therefore bundles both P1 stories:

1. Phase 1: Setup.
2. Phase 2: Foundational (T002–T004).
3. Phase 3: US1 (T005–T013) → drawer is named and visible.
4. Phase 4: US2 (T014–T018) → cleartext is drawer-only.
5. **STOP and VALIDATE** with Quickstart Scenario 1 (Tab 1 drawer / Tab 2 guesser).

### Incremental Delivery

- After US1 alone the UI changes to a round view but the cleartext is not emitted to anyone (T011 deliberately withholds `secretWord` until T017). This is a safe intermediate state — no word leak, no game yet.
- After US2 the drawer sees the word; guessers see the mask. Demo-able.
- After US3 the determinism guarantee is independently asserted by tests; no UI surface changes.

### Parallel Team Strategy

With two developers after Phase 2 lands:

- Developer A: T005, T006, T010, T011 (backend store + tests).
- Developer B: T009, T012, T013 (frontend RoundView + LobbyPage).
- Then collaboratively finish US2 (T014–T018) since `toRoomSnapshot` is shared.

---

## Traceability Matrix

| FR | Tasks |
|---|---|
| **FR-001** transition lobby → round | T002, T004, T010, T011, T012, T013 + T005, T007 |
| **FR-002** drawer = host in round 1 | T010 + T005 |
| **FR-003** `drawerParticipantId` and `isDrawer` exposed to everyone | T002, T004, T011, T013 + T007, T009 |
| **FR-004** deterministic word selection | T003, T010, T021 + T019, T020 |
| **FR-005** cleartext only to drawer | T017 + T014, T015, T016, T018 |
| **FR-006** masked-length indicator to guessers | T011, T017, T018 + T014, T015, T016 |
| **FR-007** idempotent Start during a round | T010 + T006, T008 |
| **FR-008** repolling returns same drawer + word | T010, T017 (immutability inside `startRoom`) + T014 (re-evaluated snapshot stays stable) |
| **FR-009** name validation non-regression | (no new tasks — existing 001 tests guarantee this; T023 re-runs them) |
| **FR-010** empty word list fails fast | T003 + T019 |

---

## Notes

- `[P]` tasks across **different files** are wall-clock parallelisable; within the **same file** they are logically independent but should be applied sequentially to avoid merge friction.
- Every task cites at least one `FR-###` per constitution Principle V.
- `tasks.md` does not weaken or delete any existing test from `001-room-setup-lobby` (Principle V).
- The drawer-only filter intentionally lives inside `toRoomSnapshot` (decided in `research.md` R-002); tasks must not relocate it to the route layer.
- The masked-word rendering on the frontend is a pure echo of the server string (R-008); tasks must not introduce client-side mask computation.
