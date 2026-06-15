# Tasks: Guess Submission, Scoring & Shared History

**Input**: Design documents from `/specs/003-guess-submission-scoring/`

**Prerequisites**: spec.md, plan.md

## Phase 1: Backend Infrastructure

- [X] T201 Implement normalizeGuess() in `backend/src/services/roomStore.ts` – trim whitespace
- [X] T202 Implement createGuess() factory in `backend/src/services/roomStore.ts`
- [X] T203 Add Guess interface to `backend/src/models/game.ts` with id, participantId, participantName, text, isCorrect, createdAt
- [X] T204 Implement submitGuess() in `backend/src/services/roomStore.ts` with case-insensitive comparison and 100-point scoring
- [X] T205 Implement clearCanvas() in `backend/src/services/roomStore.ts` with drawer-only validation
- [X] T206 Add POST /rooms/:code/guess route in `backend/src/api/rooms.ts`
- [X] T207 Add POST /rooms/:code/clear-canvas route in `backend/src/api/rooms.ts`
- [X] T208 Update toRoomSnapshot() to include guesses array

---

## Phase 2: Frontend UI & Validation

- [X] T209 Create GuessForm component in `frontend/src/components/GuessForm.tsx` with input validation
- [X] T210 Add submitGuess() method to `frontend/src/services/api.ts`
- [X] T211 Add clearCanvas() method to `frontend/src/services/api.ts`
- [X] T212 Add canvas status indicator to `frontend/src/pages/GamePage.tsx` (e.g., "Canvas cleared")
- [X] T213 Add "Clear Canvas" button to GamePage visible to drawer only
- [X] T214 Create ResultPanel component in `frontend/src/components/ResultPanel.tsx` for guess history display
- [X] T215 Add Guess type to `frontend/src/services/api.ts`

---

## Phase 3: Integration & Testing

- [X] T216 Verify POST /rooms/:code/guess normalizes whitespace and case
- [X] T217 Verify correct guess scores 100 points
- [X] T218 Verify incorrect guess preserves history with isCorrect=false
- [X] T219 Verify drawer cannot submit guesses
- [X] T220 Verify empty guesses are rejected
- [X] T221 Verify guesses sync via polling to all players
- [X] T222 Test canvas clearing endpoint access control

---

## Dependencies

- Depends on: `002-game-start-drawer-assignment` (requires active round)
- Blocks: `004-results-restart` (requires guess history and scoring)
