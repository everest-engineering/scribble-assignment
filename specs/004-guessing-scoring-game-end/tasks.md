---

description: "Task list for Guessing, Scoring & Game End feature"

---

# Tasks: Guessing, Scoring & Game End

**Input**: Design documents from `specs/004-guessing-scoring-game-end/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No automated test tasks — manual validation per quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization (SKIP — brownfield project; all infrastructure exists)

No setup tasks needed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data model additions that ALL user stories depend on.

- [x] T001 [P] Add `Guess`, `RoundResult` types and Zod schemas (`submitGuessSchema`, `restartGameSchema`) to `backend/src/models/game.ts` and `backend/src/api/schemas.ts`
- [x] T002 [P] Add `guesses: Guess[]`, `scores: Record<string, number>`, `roundResult: RoundResult | null` fields to `Room` interface and extend `RoomSnapshot` with corresponding fields in `backend/src/models/game.ts`
- [x] T003 [P] Extend `toRoomSnapshot` in `backend/src/services/roomStore.ts` — include `guesses`, `scores`, `roundResult` in snapshot; always reveal `word` to all participants when `status === "finished"`; implement `resetRoomToLobby`
- [x] T004 [P] Add `Guess`, `RoundResult` frontend types and `submitGuess`, `restartRoom` API methods with response types to `frontend/src/services/api.ts`
- [x] T005 [P] Add `submitGuess`, `restartRoom` methods to `RoomStore` in `frontend/src/state/roomStore.ts` — each calls the corresponding API method and updates room state

**Checkpoint**: Foundation ready — types, model, snapshot, API client, and store exist; user story implementation can begin.

---

## Phase 3: User Story 1 & 2 — Guess Submission & Correct Detection (Priority: P1) 🎯 MVP

**Goal**: A guesser can type and submit a guess. The guess is validated (trimmed, not empty, case-insensitive comparison, max 100 chars). All participants see the guess appear in a shared history. Correct guesses are marked with a green checkmark, incorrect with a red X. The round ends immediately on a correct guess.

**Independent Test**: Open game as guesser — submit a guess — verify it appears in the shared history for all participants within 2 seconds. Submit the correct word (any case) — verify it is marked with a green checkmark and the round ends.

### Implementation for User Story 1 & 2

- [x] T006 [P] [US1] Implement `submitGuess` in new `backend/src/services/roundService.ts` — validate guesser role, trim text, check length (1–100 chars), compare case-insensitively to secret word, append guess to room, if correct: set status to `"finished"`, award 100 points, populate `roundResult` with secret word, guess history, scores, winnerId, and endedAt timestamp
- [x] T007 [US1] Implement POST `/api/rooms/:code/guess` endpoint in `backend/src/api/rooms.ts` — parse Zod-validated body, delegate to `roundService.submitGuess`, return updated room snapshot with guesses, scores, and roundResult; register route in router
- [x] T008 [P] [US1] Implement GuessForm submission logic in `frontend/src/components/GuessForm.tsx` — on submit: trim input, validate non-empty client-side, call `api.submitGuess`, show loading spinner on button while in flight, show inline error message on failure, keep guess text intact for retry, clear input on success
- [x] T009 [US2] Create `GuessHistory` component in `frontend/src/components/GuessHistory.tsx` — display ordered list of guesses showing participant name, guess text, green checkmark icon for correct, red X icon for incorrect
- [x] T010 [US2] Wire `GuessHistory` into `ResultPanel` in `frontend/src/components/ResultPanel.tsx` — accept `guesses` array as prop, render via GuessHistory; replace existing placeholder content
- [x] T011 [US2] Wire guess flow into `GamePage` in `frontend/src/pages/GamePage.tsx` — pass guesses from room state to ResultPanel; draw from guesses (or room.guesses); disable GuessForm when viewer is drawer; handle guess submission response (transition to finished)

**Checkpoint**: Core guess flow verified — guesses appear in shared history; correct guesses end the round; incorrect guesses allow continued play.

---

## Phase 4: User Story 3 — Scores Displayed on Scoreboard (Priority: P2)

**Goal**: When the round ends, all participants see final scores on the scoreboard. The first correct guesser receives 100 points; all others (including the drawer) have 0 points.

**Independent Test**: Complete a round with a correct guess — verify that the scoreboard shows the winner with 100 points and all other participants with 0 points.

### Implementation for User Story 3

- [x] T012 [P] [US3] Implement `Scoreboard` component in `frontend/src/components/Scoreboard.tsx` — accept `scores` (Record<string, number>) and `participants` arrays as props; display participant names with their scores sorted descending; highlight the winner row; replace existing placeholder content
- [x] T013 [US3] Wire `Scoreboard` into `GamePage` in `frontend/src/pages/GamePage.tsx` — pass `room.scores` and `room.participants` to Scoreboard component

**Checkpoint**: Scoring verified — scoreboard displays final scores with winner highlighted on round end.

---

## Phase 5: User Story 4 — All Players See Round Results (Priority: P2)

**Goal**: When the round ends, all players see a result screen showing the secret word, the full guess history, final scores, and the winner.

**Independent Test**: Complete a round — verify all participants see the result screen with the secret word revealed, full guess history with correct/incorrect indicators, final scores, and the winner announced.

### Implementation for User Story 4

- [x] T014 [US4] Replace the existing "Game Over" finished-state in `GamePage` at `frontend/src/pages/GamePage.tsx` with a full result screen — show the secret word prominently, the full guess history via ResultPanel (or inline), final scores via Scoreboard, and the winner name; continue room polling during result screen to catch any late state changes
- [x] T015 [US4] Add winner announcement section to the result screen in `frontend/src/pages/GamePage.tsx` — display "Winner: {name}" or "No winner this round" if no one guessed correctly

**Checkpoint**: Result screen verified — all participants see the secret word, guess history, scores, and winner on round end.

---

## Phase 6: User Story 5 — Players Can Restart the Game (Priority: P2)

**Goal**: After the result screen, the host can click "Back to Lobby" to return all players to the lobby. Participants are preserved; round state is cleared.

**Independent Test**: Host clicks "Back to Lobby" on the result screen — verify all participants return to the lobby with their names preserved and round state (guesses, scores, drawing) cleared.

### Implementation for User Story 5

- [x] T016 [P] [US5] Implement `resetRoomToLobby` in `backend/src/services/roomStore.ts` — validate requesting participant is host, validate current status is `"finished"`, reset round state (status → `"lobby"`, word → `undefined`, guesses → `[]`, scores → `{}`, roundResult → `null`, canvasState → `null`), preserve participants array
- [x] T017 [US5] Implement POST `/api/rooms/:code/restart` endpoint in `backend/src/api/rooms.ts` — parse Zod-validated body, delegate to `roomStore.resetRoomToLobby`, return updated room snapshot (lobby state); register route in router
- [x] T018 [US5] Implement restart flow in `RoomStore.restartRoom` in `frontend/src/state/roomStore.ts` — call `api.restartRoom`, update state with returned lobby snapshot
- [x] T019 [US5] Wire "Back to Lobby" button in `GamePage` at `frontend/src/pages/GamePage.tsx` — visible only to host on the result screen; onClick calls `roomStore.restartRoom()`; on success (status becomes `"lobby"`), navigate to `/lobby`; show loading state on button while request is in flight

**Checkpoint**: Restart flow verified — host clicks "Back to Lobby", all players return to lobby with names preserved and round state cleared.

---

## Phase 7: Polish & Edge Cases

**Purpose**: Cross-cutting verification and edge case handling.

- [x] T020 Run build verification — `cd backend && npm run build && cd ../frontend && npm run build`
- [x] T021 Execute full manual validation per `specs/004-guessing-scoring-game-end/quickstart.md` — run all 9 scenarios with two browser windows

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Not applicable — skip
- **Foundational (Phase 2)**: T001, T002, T003, T004, T005 are parallel — no dependencies between them
- **US1+US2 (Phase 3)**: Depends on foundational (T001–T005)
- **US3 (Phase 4)**: Depends on US1+US2 (scoring happens in submitGuess flow; display can be done independently)
- **US4 (Phase 5)**: Depends on US1+US2 (result screen needs guess history) + US3 (scores)
- **US5 (Phase 6)**: Depends on US4 (restart from result screen)
- **Polish (Phase 7)**: Depends on all user stories

### User Story Dependencies

- **User Story 1+2 (P1)**: Depends on foundational types — no dependency on other stories
- **User Story 3 (P2)**: Scoring logic is embedded in US2 submitGuess flow; display depends on US3 Scoreboard component; functionally independent for frontend work
- **User Story 4 (P2)**: Depends on US1+US2 (guess history exists) and US3 (scores)
- **User Story 5 (P2)**: Depends on US4 (result screen provides the restart button)

### Within Each Phase

- [P] tasks can run in parallel (different files, no cross-dependencies)
- Non-[P] tasks must run sequentially
- Backend tasks before frontend tasks where the frontend consumes the API

### Parallel Opportunities

- T001, T002, T003, T004, T005 can all run in parallel — five independent files
- T006 (roundService) and T008 (GuessForm) can run in parallel — backend vs frontend
- T007 follows T006 sequentially (same backend module)
- T009 (GuessHistory) and T012 (Scoreboard) can run in parallel — independent components
- T010 follows T009 sequentially (wires into ResultPanel)
- T011 follows T010 sequentially (wires into GamePage)
- T013 follows T012 sequentially (wires into GamePage)
- T014 and T015 (result screen) can be combined into one GamePage task
- T016 (backend) and T018 (frontend) can run in parallel
- T017 follows T016 sequentially
- T019 follows T018 sequentially

---

## Parallel Example: User Story 1 & 2

```bash
# Launch T006 (backend service) and T008 (frontend component) together:
Task: "Implement submitGuess in roundService at backend/src/services/roundService.ts"
Task: "Implement GuessForm submission logic at frontend/src/components/GuessForm.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 & 2 Only)

1. Complete Phase 2: Foundational (T001, T002, T003, T004, T005)
2. Complete Phase 3: User Story 1 & 2 (T006, T007, T008, T009, T010, T011)
3. **STOP and VALIDATE**: Open game as guesser — verify guess submission appears in history, correct guess ends round
4. Deliver — guess submission and correct detection works (MVP!)

### Incremental Delivery

1. Complete Foundational + US1+US2 → Validate independently → Deliver (MVP!)
2. Complete US3 (scoreboard) → Validate independently → Deliver
3. Complete US4 (result screen) → Validate independently → Deliver
4. Complete US5 (restart) → Validate independently → Deliver
5. Complete Polish → Final validation → Deliver

### Notes

- Scoring calculation is atomic with correct guess detection — happens inside `submitGuess` in `roundService.ts`
- The `GET /rooms/:code` endpoint is reused for all state fetching — guesses, scores, and roundResult are returned as part of the room snapshot
- The `toRoomSnapshot` function must reveal the secret word to all participants when status is `"finished"` (not just the drawer)
- The `POST /rooms/:code/guess` response includes the full updated room snapshot — the frontend updates its entire state from this, avoiding a separate poll cycle for the guesser
- Canvas polling continues during the game but is stopped when status transitions to `"finished"` (result screen shown instead)
- Room polling continues during the result screen to detect the restart → lobby transition
- On restart, `canvasState` must be set to `null` to clear the drawing
- The GuessForm is disabled for the drawer and when the round is finished
- Build (`npm run build`) must pass on both backend and frontend before phase completion
- Per constitution Principle V: commits must be granular and traceable to the spec
