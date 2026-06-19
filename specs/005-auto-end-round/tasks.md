# Tasks: Auto-end Round on Correct Guess

**Input**: Design documents from `specs/005-auto-end-round/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/rooms-api.md ✅

**Tests**: Backend test tasks included (per request) at the **service level** (`backend/src/services/roomStore.test.ts`).
Frontend needs no change (existing result handling), so it's validated via [quickstart.md](./quickstart.md).

**Organization**: one user story (US1). Refines Groups 3 & 4 — backend-only.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: different file, no dependency on an incomplete task
- **[Story]**: US1 traceability

---

## Phase 1: Setup

- [X] T001 Verify baseline: on `scribble-assignment`, `npm test` green in both packages, and Groups 1–4 run (full create → start → guess → host End Round → restart loop works).

---

## Phase 2: User Story 1 — Auto-end on correct guess (Priority: P1)

**Goal**: A correct guess scores then moves the room to `result` for all; incorrect guesses keep playing; no guesses once the round isn't active; host End Round stays as fallback (FR-001..006).

**Independent Test**: A guesser submits the correct word → both tabs show the result view (word revealed) and the guesser's score is 100; a wrong guess leaves the round active.

### Tests for User Story 1

- [X] T002 [P] [US1] In `backend/src/services/roomStore.test.ts`: assert that a correct guess sets the guesser's `score` to 100 **and** `room.status === "result"`, and that `toRoomSnapshot(room, guesserId).word === secretWord` after it; an incorrect guess leaves `room.status === "active"`; and `submitGuess` throws 409 ("The round is not active.") when the room is not `active`.

### Implementation for User Story 1

- [X] T003 [US1] In `backend/src/services/roomStore.ts`: in `submitGuess`, (a) add an early guard that throws `HttpError(409, "The round is not active.")` when `room.status !== "active"`; (b) when a guess is correct and the guesser is scored, set `room.status = "result"` (after awarding 100). Leave `endRound`/`restartGame` untouched (End Round stays a fallback).

**Checkpoint**: correct guess auto-ends to the shared result; incorrect keeps playing (quickstart V1–V3).

---

## Phase 3: Polish & Cross-Cutting

- [X] T004 Run [quickstart.md](./quickstart.md) V1–V5 with two browsers (auto-end, incorrect keeps playing, no guess after end, host End Round fallback, restart no-regression); record pass/fail.
- [X] T005 [P] Confirm `npm test` passes in both `backend/` and `frontend/`.
- [X] T006 Note in this spec/quickstart that increment 005 supersedes the Group 4 "host ends it explicitly" clarification for the correct-guess case (host End Round retained as fallback); record any deviation (Principle VII).

---

## Dependencies & Execution Order

- Setup (T001) → US1 (T002 test → T003 impl) → Polish.
- **Within-file**: `roomStore.ts` is touched only by T003; `roomStore.test.ts` only by T002. No frontend file changes.

## Implementation Strategy

- Single small slice: write the test (T002), make it pass (T003), validate in two browsers, commit `feat(group3): end the round automatically on a correct guess`.

## Notes

- No model change — `result` status already exists (Group 4). No new endpoint — reuses `POST /rooms/:code/guess`.
- No frontend change — the client applies the returned snapshot and `GamePage` already shows the result view / navigates on status changes.
- `/speckit.analyze` runs before implementation now that tasks.md exists.
