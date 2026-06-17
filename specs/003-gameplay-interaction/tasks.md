# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/003-gameplay-interaction/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/rooms-api.md ✅

**Tests**: Backend test tasks included (per request) at the **service level** (`backend/src/services/roomStore.test.ts`),
matching the Group 1–2 pattern — no new test deps. Frontend behavior (canvas, scoreboard, history UI) validated via [quickstart.md](./quickstart.md).

**Organization**: grouped by user story (US1–US4). Builds on Groups 1 & 2 (active round, drawer, secret word).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: different file, no dependency on an incomplete task
- **[Story]**: US1–US4 traceability

---

## Phase 1: Setup

- [ ] T001 Verify baseline: on `scribble-assignment`, `npm test` green in both packages, and the app runs through Group 2 (create → join → start → drawer sees word).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared data-shape additions for guesses and scores.

- [X] T002 [P] In `backend/src/models/game.ts`: add `score: number` to `Participant`; add a `Guess` interface `{ id; participantId; name; text; correct; at }`; add `guesses: Guess[]` to `Room` and to `RoomSnapshot`.
- [X] T003 [P] In `frontend/src/services/api.ts`: add `score: number` to `Participant`; add a `Guess` type; add `guesses: Guess[]` to `RoomSnapshot`.
- [X] T004 In `backend/src/services/roomStore.ts`: set `score: 0` in `createParticipant`; initialize `guesses: []` in `createRoom`.

**Checkpoint**: model + snapshot can carry scores and a guess history.

---

## Phase 3: User Story 1 — Drawer canvas (draw + clear) (Priority: P1)

**Goal**: Drawer has an interactive freehand canvas + Clear; guessers cannot draw (FR-001…003). Drawer-local.

**Independent Test**: As drawer, draw + clear works; as guesser, no drawing surface.

### Implementation for User Story 1

- [ ] T005 [P] [US1] Create `frontend/src/components/DrawingCanvas.tsx`: an interactive freehand `<canvas>` (pointer events) with a Clear button; accepts an `enabled` prop so only the drawer can draw.
- [ ] T006 [US1] In `frontend/src/pages/GamePage.tsx`: replace the canvas placeholder with `<DrawingCanvas enabled={isDrawer} />` (interactive for the drawer, inert for guessers).

**Checkpoint**: drawer draws/clears; guessers can't (quickstart V1). No backend involved (drawer-local).

---

## Phase 4: User Story 2 — Submit & validate guesses (Priority: P1) 🎯 MVP core

**Goal**: Guessers submit guesses; trim + reject empty; drawer refused; case-insensitive correctness; each accepted guess recorded (FR-004…007).

**Independent Test**: Guesser submits empty (rejected), wrong (recorded incorrect), word-in-any-case (recorded correct); drawer has no guess input.

### Tests for User Story 2

- [ ] T007 [P] [US2] In `backend/src/services/roomStore.test.ts`: assert `submitGuess` throws 400 for empty/whitespace text, 403 for the drawer; a correct guess ("  CASTLE " vs the word) is appended with `correct:true`; a wrong guess with `correct:false`.

### Implementation for User Story 2

- [ ] T008 [US2] In `backend/src/api/schemas.ts`: add `submitGuessSchema = z.object({ participantId: z.string().min(1), text: z.string() })`.
- [ ] T009 [US2] In `backend/src/services/roomStore.ts`: add `submitGuess(code, participantId, text)` — 404 if missing; throw `HttpError(403, "The drawer cannot guess.")` if `participantId === drawerId`; trim and throw `HttpError(400, "Enter a guess.")` if empty; compute `correct` via case-insensitive compare to `secretWord`; append `{ id, participantId, name, text(trimmed), correct, at }` to `room.guesses`; return the saved room. (Scoring added in US4.)
- [ ] T010 [US2] In `backend/src/api/rooms.ts`: add `POST /:code/start`-style handler `POST /:code/guess` parsing `submitGuessSchema` and calling `submitGuess`, returning `{ room: toRoomSnapshot(...) }`.
- [ ] T011 [P] [US2] In `frontend/src/services/api.ts`: add `submitGuess(code, participantId, text)` calling `POST /rooms/:code/guess`.
- [ ] T012 [US2] In `frontend/src/state/roomStore.ts`: add a `submitGuess(text)` action that calls `api.submitGuess(code, participantId, text)` and applies the returned snapshot.
- [ ] T013 [US2] In `frontend/src/components/GuessForm.tsx`: wire submit to the store; trim and reject empty with `"Enter a guess."` (no API call); render only for guessers (the drawer gets no guess input). (Disable-after-correct added in US4.)

**Checkpoint**: guesses submit, validate, and record (quickstart V2).

---

## Phase 5: User Story 3 — Synced guess history (Priority: P1)

**Goal**: The shared guess history is in the snapshot for all viewers and rendered, kept current by polling (FR-007, FR-008).

**Independent Test**: A guess from one tab appears in every tab's Activity panel within ~2s.

### Tests for User Story 3

- [ ] T014 [P] [US3] In `backend/src/services/roomStore.test.ts`: after a guess, assert `toRoomSnapshot(room, anyViewerId).guesses` contains the guess and is identical for drawer and guesser viewers.

### Implementation for User Story 3

- [ ] T015 [US3] In `backend/src/services/roomStore.ts`: include `guesses: room.guesses.map(...)` in `toRoomSnapshot` (same for all viewers).
- [ ] T016 [US3] In `frontend/src/components/ResultPanel.tsx`: render the shared guess history from room state (each entry: guesser name, text, correct/incorrect), newest-aware ordering.

**Checkpoint**: history visible and synced across tabs (quickstart V3).

---

## Phase 6: User Story 4 — Scoring & disable-after-correct (Priority: P1)

**Goal**: Scores start 0; correct = 100 once; incorrect = 0; input disabled after a correct guess; scores synced (FR-009…012, FR-011a).

**Independent Test**: Scores start 0; correct guess → 100 on all tabs; incorrect → no change; after correct, guesser input disabled.

### Tests for User Story 4

- [ ] T017 [P] [US4] In `backend/src/services/roomStore.test.ts`: a correct guess sets the guesser's `score` to 100; an incorrect guess leaves it 0; a repeat guess after a correct one throws 409 and the score stays 100 (scored once).

### Implementation for User Story 4

- [ ] T018 [US4] In `backend/src/services/roomStore.ts`: in `submitGuess`, before recording, throw `HttpError(409, "You already guessed the word.")` if the guesser's `score === 100`; when a guess is correct and the guesser's score is 0, set it to 100.
- [ ] T019 [US4] In `frontend/src/components/Scoreboard.tsx`: render participants and their `score` from room state (drawer included).
- [ ] T020 [US4] In `frontend/src/components/GuessForm.tsx`: disable the input/submit once the viewer's own participant `score === 100` (already guessed correctly).

**Checkpoint**: full Scenario 3 works end-to-end (quickstart V4).

---

## Phase 7: Polish & Cross-Cutting

- [ ] T021 Run [quickstart.md](./quickstart.md) V1–V5 with two browsers (V6 optional curl); record pass/fail.
- [ ] T022 [P] Confirm `npm test` passes in both `backend/` and `frontend/`.
- [ ] T023 Record any spec/implementation deviation in spec.md or plan.md (Principle VII); none expected.

---

## Dependencies & Execution Order

### Phase order
Setup → Foundational (blocks all) → US1 (independent) / US2 → US3 → US4 → Polish.

### Story dependencies
- **US1**: needs Foundational only; frontend-only and independent of US2–US4 (can be done any time after Foundational).
- **US2**: needs Foundational; core guess flow.
- **US3**: needs US2 (guesses exist) — exposes + renders the history.
- **US4**: needs US2 (submitGuess) — adds scoring + 409 + disable; render scores.

### Within-file ordering (NOT parallel — same file)
- `backend/src/services/roomStore.ts`: **T004 → T009 → T015 → T018**.
- `backend/src/services/roomStore.test.ts`: **T007 → T014 → T017**.
- `frontend/src/services/api.ts`: **T003 → T011**.
- `frontend/src/components/GuessForm.tsx`: **T013 → T020**.

### Parallel opportunities
- T002 [P] ∥ T003 [P] (backend model vs frontend type).
- US1 (T005/T006) is independent of the US2–US4 backend work — can proceed in parallel.

---

## Implementation Strategy

- **MVP**: US2 + US3 (submit guesses + see synced history) is the smallest demoable gameplay slice;
  US1 (drawing) and US4 (scoring) layer on independently.
- One commit per task or tight group, scoped `feat(group3):`.

## Notes

- Backend tests live at the service layer (`roomStore.ts`) — guess validation, correctness, history, scoring all unit-testable without HTTP.
- Drawing is drawer-local (no backend, no test) — validated via quickstart V1.
- Verify each new test fails before implementing the behavior it covers.
- `/speckit.analyze` runs before implementation — reconcile any flagged inconsistency there.
