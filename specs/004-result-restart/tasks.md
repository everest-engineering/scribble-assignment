---
description: "Task list for Scenario 4 — Result, Restart & Final Validation"
---

# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `specs/004-result-restart/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md); builds on Scenarios 1–3.

**Tests**: Included — Vitest unit tests for store.

## Format: `[ID] [P?] [Story] Description`

- **[Story]**: US1 (result/round-end), US2 (restart), US3 (end-to-end validation)

---

## Phase 1: Foundational (Model + Store)

- [ ] T001 [US1] Extend `RoomStatus` to `"lobby" | "playing" | "finished"` in
      `backend/src/models/game.ts`.
- [ ] T002 [US1] In `backend/src/services/roomStore.ts`, update `submitGuess`: on
      a correct guess set `status="finished"`; reject any guess when status is
      already `finished` (new `finished` error).
- [ ] T003 [US1] In `roomStore.ts`, update `toRoomSnapshot` to reveal `word` to
      everyone when `status === "finished"` (in addition to the drawer while
      playing).

**Checkpoint**: A correct guess ends the round and the word is public.

---

## Phase 2: User Story 2 — Restart (P1)

- [ ] T004 [US2] In `roomStore.ts`, add `restartGame(code, requesterId)`:
      host-only; clear `strokes`/`guesses`, reset all `scores` to 0, clear
      `drawerId`, set `status="lobby"`, advance `wordIndex=(wordIndex+1) %
      STARTER_WORDS.length`, preserve participants.
- [ ] T005 [US2] In `backend/src/api/schemas.ts` add a restart body schema; in
      `backend/src/api/rooms.ts` add `POST /:code/restart` mapping non-host → 403,
      not-found → 404.
- [ ] T006 [US2] In `frontend/src/services/api.ts` extend the snapshot `status`
      union with `"finished"` and add `restartGame`; in
      `frontend/src/state/roomStore.ts` add a `restartGame()` method.

**Checkpoint**: Host can restart; round state cleared, players preserved.

---

## Phase 3: User Story 1 — Result UI (P1)

- [ ] T007 [US1] In `frontend/src/components/ResultPanel.tsx`, when the round is
      finished show the correct word and emphasize final scores alongside the
      guess history.
- [ ] T008 [US1] In `frontend/src/pages/GamePage.tsx`, render the result state
      when `finished` (word + final scores + history), show a host-only Restart
      button, and navigate all players to `/lobby` when polling reports `lobby`.

**Checkpoint**: Both tabs see the result; host sees Restart.

---

## Phase 4: Tests & Final Validation

- [ ] T009 [US1] In `backend/src/services/roomStore.test.ts`, add tests: correct
      guess → `finished`; `word` present for a guesser when finished; a guess to a
      finished room is rejected; `restartGame` clears strokes/guesses, zeroes
      scores, clears drawer, sets lobby, advances word, preserves participants;
      non-host restart rejected.
- [ ] T010 `cd backend && npm run build && npm test` — zero errors.
- [ ] T011 `cd frontend && npm run build && npm test` — zero errors.
- [ ] T012 [US3] Two-tab end-to-end: create+join → start → draw → correct guess →
      result on both → host restart → both back in lobby with players preserved.

---

## Dependencies & Execution Order

- Phase 1 (T001–T003) blocks the rest.
- US2 restart (T004–T006) and US1 result UI (T007–T008) both depend on Phase 1;
  T008 consumes the `restartGame` store method (T006).
- Tests/validation (Phase 4) last; T012 is the final acceptance of all four
  scenarios composed.

## Notes

- Guard navigation: GamePage → `/lobby` only on `lobby`; LobbyPage → `/game` only
  on `playing`; result shown on `finished`. Avoids redirect loops.
- Restart advances the word deterministically (index-based) — no randomness.
- Commit in groups: (a) round-end + reveal, (b) restart endpoint + wiring,
  (c) result UI + tests. Short messages, no co-author line, after user approval.
