---
description: "Task list for Game Start, Drawer Selection & Secret Word Reveal"
---

# Tasks: Game Start, Drawer Selection & Secret Word Reveal

**Input**: Design documents from `specs/002-game-start-word-reveal/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/rooms-api.md](./contracts/rooms-api.md), [quickstart.md](./quickstart.md)

**Tests**: Per the constitution, **manual two-browser validation is the primary acceptance gate** and automated tests are optional. Test tasks below are marked _(optional)_ and are NOT TDD-ordered. They are recommended for the word-secrecy invariant (FR-007/SC-003) and determinism (SC-005), which are hard to eyeball, and to preserve regression coverage (Constitution V).

**Organization**: Tasks are grouped by user story (priority order from spec.md). This is a **brownfield extension** of feature 001 — tasks modify existing files; no rewrites. Builds directly on the `playing` transition already shipped in 001.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US3 maps to the spec's user stories
- Exact file paths included in every task

## Path Conventions

Web app layout (existing): `backend/src/...`, `frontend/src/...` at repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish a known-green baseline before changes (brownfield — structure already exists).

- [X] T001 Ensure dependencies are installed (`cd backend && npm install`; `cd frontend && npm install`) and capture a green baseline by running `cd backend && npm run build` and `cd frontend && npm run build`.
- [X] T002 [P] Run existing tests to record the regression baseline: `cd backend && npm test` and `cd frontend && npm test` (all currently passing).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared type and helper changes every story depends on. No user story work begins until this phase is complete.

**⚠️ CRITICAL**: These are blocking prerequisites.

- [X] T003 Extend domain types in `backend/src/models/game.ts`: add `interface Round { number: number; drawerId: string; word: string }`; add `round: Round | null` to `Room`; add `interface RoundSnapshot { number: number; drawerId: string; wordLength: number; maskedWord: string; word?: string }`; add `round: RoundSnapshot | null` to `RoomSnapshot`. (Leave `availableWords` in place for now; it is removed in US2.)
- [X] T004 [P] Create the deterministic word picker `backend/src/services/wordSelection.ts`: export `selectWord(code: string, roundNumber: number): string` — pure djb2 hash of `` `${code}:${roundNumber}` `` indexed into `STARTER_WORDS` (import from `../seed/starterData.js`). No `Math.random`/`Date`. (research D1, data-model)
- [X] T005 [P] Update frontend types in `frontend/src/services/api.ts`: add a `RoundSnapshot` interface (`number`, `drawerId`, `wordLength`, `maskedWord`, optional `word`) and add `round: RoundSnapshot | null` to `RoomSnapshot`. (Leave `availableWords` for now; removed in US2.)

**Checkpoint**: Types compile (`cd backend && npm run build`, `cd frontend && npm run build`); stories can begin.

---

## Phase 3: User Story 1 - First round begins with a clearly identified drawer (Priority: P1) 🎯 MVP

**Goal**: Starting the game creates round 1 with the host as the single, clearly-identified drawer; every player sees who the drawer is and their own role.

**Independent Test**: With Host + 1 Guesser in a lobby, Host clicks **Start Game**. Within ~2s both browsers reach the game screen and both clearly show the host badged as **drawer**; the host's view says "you are the drawer", the guesser's view says "you are guessing". (FR-001, FR-002, FR-003, SC-002)

- [X] T006 [US1] In `backend/src/services/roomStore.ts` `startGame`: when transitioning to `playing`, set `room.round = { number: 1, drawerId: room.hostId, word: selectWord(room.code, 1) }` (import `selectWord` from `./wordSelection.js`). Drawer is the host (FR-002). Ensure `round` is `null` everywhere else (lobby).
- [X] T007 [US1] In `backend/src/services/roomStore.ts` `toRoomSnapshot`: project `round` for all viewers as `{ number: room.round.number, drawerId: room.round.drawerId }` (word/length added in US2); return `round: null` when `room.round` is `null`.
- [X] T008 [US1] In `frontend/src/pages/GamePage.tsx`: badge the drawer — for each participant, mark the one whose `id === room.round?.drawerId` as "Drawer"; in the Player Info panel show whether the viewer is the **drawer** or a **guesser** (compare `participantId` to `room.round?.drawerId`). Drive the "Round N" header from `room.round?.number`.
- [X] T009 [P] [US1] _(optional)_ In `backend/src/services/roomStore.test.ts`: assert `startGame` on a 2-player room sets `room.round.number === 1` and `room.round.drawerId === room.hostId`, and that a lobby room reports `round: null` in its snapshot.

**Checkpoint**: Round starts with a clearly identified drawer for everyone; US1 is independently demoable.

---

## Phase 4: User Story 2 - Secret word is visible only to the drawer (Priority: P1)

**Goal**: The drawer sees the full secret word; guessers receive only blanks (length only). The actual word never appears in a guesser's response body. Selection is deterministic per room code.

**Independent Test**: After start, the Host (drawer) browser shows the full word; the Guesser browser shows only blanks. Inspecting the guesser's `GET /rooms/:code` response (devtools → Network) shows `wordLength`/`maskedWord` but **no** `word`. Restarting with the same room code yields the same word. (FR-006, FR-007, FR-008, SC-003, SC-004, SC-005)

- [X] T010 [US2] In `backend/src/services/roomStore.ts` `toRoomSnapshot`: extend the `round` projection so every viewer gets `wordLength: room.round.word.length` and `maskedWord` (one `_` per letter, e.g. join with spaces); include `word: room.round.word` **only when** `viewerParticipantId === room.round.drawerId` — omit the `word` key entirely otherwise (FR-007 secrecy invariant).
- [X] T011 [US2] Stop projecting the full word list: remove `availableWords` from the returned snapshot in `backend/src/services/roomStore.ts` `toRoomSnapshot`, from `RoomSnapshot` in `backend/src/models/game.ts`, and from `RoomSnapshot` in `frontend/src/services/api.ts`. (research D3) Verify both builds still pass.
- [X] T012 [US2] In `frontend/src/pages/GamePage.tsx`: render the word area role-aware — if the viewer is the drawer, show `room.round?.word` (the secret word to draw); otherwise show the concealed blanks (`room.round?.maskedWord`, or build from `wordLength`). Never render the word for a guesser.
- [X] T013 [P] [US2] _(optional)_ In `backend/src/services/roomStore.test.ts`: after `startGame`, assert the drawer's snapshot includes `round.word` equal to the stored word, the guesser's snapshot has `round.word === undefined`, and `round.wordLength` equals the word's length.
- [X] T014 [P] [US2] _(optional)_ Create `backend/src/services/wordSelection.test.ts`: assert `selectWord(code, 1)` is stable across calls for the same `code`, returns a member of `STARTER_WORDS`, and can differ across different codes.

**Checkpoint**: Drawer-only word reveal works and is verifiable in the network response; US1 + US2 deliver a playable, fair round start.

---

## Phase 5: User Story 3 - Player names are validated and normalized before play (Priority: P2)

**Goal**: Names are trimmed (internal spaces kept); empty/whitespace-only names are rejected with a clear message at both client and server — superseding feature 001's silent `"Player"` default.

**Independent Test**: Submitting a blank or spaces-only name on Create or Join is rejected with a clear message and no room is created/joined. Submitting `"  Ada  "` succeeds and the lobby shows `"Ada"`. (FR-009, FR-010, FR-011)

- [X] T015 [US3] In `backend/src/api/schemas.ts`: change `playerName` in `createRoomSchema` and `joinRoomSchema` to `z.string().trim()` (still parsed, but trimming applied). Keep the field shape so the route can produce a specific message.
- [X] T016 [US3] In `backend/src/api/rooms.ts` (POST `/` and POST `/:code/join`): after parsing, if the trimmed `playerName` is empty, `throw new HttpError(400, "Please enter a name to continue.")` before calling the store (FR-010). Pass the trimmed name into `createRoom`/`joinRoom`.
- [X] T017 [US3] In `backend/src/services/roomStore.ts`: since names are now guaranteed non-empty by the API layer, keep `disambiguateName` unchanged and ensure `displayName` no longer needs to default empty→`"Player"` for the create/join paths (it may remain as a defensive fallback). Add a brief comment noting the validation moved to the API layer (FR-011, supersedes 001 default — research D5).
- [X] T018 [P] [US3] In `frontend/src/pages/CreateRoomPage.tsx`: block submit when `playerName.trim()` is empty — set a clear error ("Please enter a name to continue.") and do not call the API; send the trimmed name on success.
- [X] T019 [P] [US3] In `frontend/src/pages/JoinRoomPage.tsx`: add an empty-name guard mirroring the room-code guard — if `playerName.trim()` is empty, show "Please enter a name to continue." and do not call the API (it already trims and sends the name).
- [X] T020 [P] [US3] _(optional)_ In `backend/src/api/schemas.test.ts` (and/or a small rooms-level test): assert a whitespace-only `playerName` is rejected with a 400 + the clear message, and that `"  Ada  "` is trimmed to `"Ada"`.

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, regression safety, and the drawer-departure edge case.

- [X] T021 [P] Verify FR-013 (drawer/host leaves after start) requires **no new code** — confirm the existing `closeIfEmptyOrHostGone` in `backend/src/services/roomStore.ts` closes the room when the host (round-1 drawer) is pruned, and that `frontend/src/state/roomStore.ts` already ejects on the resulting 404. Note this in a code comment if helpful.
- [X] T022 [P] Update `frontend/src/services/api.test.ts` if it asserts the old `RoomSnapshot` shape (e.g. `availableWords`) so it reflects the new `round` field and the removed list.
- [X] T023 Run the build + test gate: `cd backend && npm run build`, `cd frontend && npm run build`, `cd backend && npm test` — all green before raising a PR (Constitution: Build gate).
- [X] T024 Execute the two-browser acceptance script in [quickstart.md](./quickstart.md): US3 name validation, US1 drawer identity, US2 drawer-only word + guesser blanks + network-response secrecy check, determinism, and host-leaves-room-closes.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories** (types + `selectWord`).
- **User Stories (Phase 3–5)**: All depend on Foundational.
- **Polish (Phase 6)**: Depends on the user stories being implemented.

### User Story Dependencies

- **US1 (P1)**: After Foundational. No dependency on other stories.
- **US2 (P1)**: After Foundational. Shares `startGame`/`toRoomSnapshot`/`GamePage.tsx` with US1, so in practice sequence US1 → US2 (same files); US2 reads `room.round.word` created in US1's `startGame` (T006).
- **US3 (P2)**: After Foundational. Fully independent of US1/US2 (different files: `schemas.ts`, `rooms.ts`, create/join pages) — can be built in parallel with US1/US2.

### Within Each User Story

- Backend store/snapshot before frontend rendering.
- Optional tests can be written alongside or after the implementation they cover (not TDD-gated, per constitution).

### Parallel Opportunities

- T004 and T005 (Foundational) are different files → parallel.
- US3 (T015–T020) touches different files from US1/US2 → an additional developer can run US3 in parallel once Foundational is done.
- Optional test tasks (T009, T013, T014, T020) are `[P]` within their story.
- T021 and T022 (Polish) are parallel.

---

## Parallel Example: Foundational

```bash
# After T003 lands the shared types:
Task: "Create backend/src/services/wordSelection.ts with deterministic selectWord (T004)"
Task: "Add RoundSnapshot + round field to frontend/src/services/api.ts (T005)"
```

## Parallel Example: cross-story staffing

```bash
# Once Foundational (T003–T005) is complete:
Developer A: US1 (T006–T008) then US2 (T010–T012)   # shared backend/game files
Developer B: US3 (T015–T019)                          # independent name-validation files
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Phase 1 Setup → Phase 2 Foundational.
2. US1 (drawer designation) → **validate**: both browsers see the drawer.
3. US2 (drawer-only word) → **validate**: drawer sees word, guessers see blanks, response hides the word.
4. This pair is the playable MVP for "game starts with a fair, role-based round."

### Incremental Delivery

1. Foundational ready.
2. US1 → demo drawer identity.
3. US2 → demo secret-word reveal (the core mechanic).
4. US3 → harden name input.
5. Polish → build gate + quickstart + FR-013 confirmation.

---

## Notes

- [P] = different files, no dependency on an incomplete task.
- [Story] label maps each task to a spec user story for traceability.
- **Brownfield**: every backend task modifies existing functions except `wordSelection.ts` (new pure helper) — no rewrites (Constitution I).
- **Secrecy invariant (FR-007)**: the `word` key must be *absent* from guesser responses, not nulled/blanked — verify in the network tab (quickstart step 8).
- **Behavior change (Constitution V)**: empty names now rejected, not defaulted to `"Player"` — re-validate any 001 step that relied on the default.
- No new dependencies, no transport, no persistence; round start rides the existing ~2s poll.
- Commit after each task or logical group; messages traceable to task IDs.
