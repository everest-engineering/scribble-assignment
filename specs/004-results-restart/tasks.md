# Tasks: Round Results, Final Scores & Restart Flow

**Input**: Design documents from `/specs/004-results-restart/`

**Prerequisites**: spec.md, plan.md

## Phase 1: Backend Infrastructure

- [X] T301 Extend ActiveRound model in `backend/src/models/game.ts` with isFinished and finishedAt fields
- [X] T302 Update submitGuess() in `backend/src/services/roomStore.ts` to set isFinished=true and finishedAt on correct match
- [X] T303 Implement restartRoom() in `backend/src/services/roomStore.ts` with host-only validation
- [X] T304 Update toRoomSnapshot() to compute and expose canRestartGame metadata
- [X] T305 Add POST /rooms/:code/restart route in `backend/src/api/rooms.ts`
- [X] T306 Implement state reset logic in restartRoom() – clear activeRound, guesses, canvasCleared; reset scores to 0

---

## Phase 2: Frontend UI & State Management

- [X] T307 Create ResultPanel component in `frontend/src/components/ResultPanel.tsx` to display secret word, scores, and guess history
- [X] T308 Add isRoundFinished computed state to `frontend/src/pages/GamePage.tsx`
- [X] T309 Add conditional rendering of ResultPanel when round is finished
- [X] T310 Add "Restart Round" button to GamePage visible to host only
- [X] T311 Implement restartRoom() async action in `frontend/src/state/roomStore.ts`
- [X] T312 Add restartRoom() method to `frontend/src/services/api.ts`
- [X] T313 Implement auto-navigation to /lobby on restart in GamePage via useEffect

---

## Phase 3: Integration & Testing

- [X] T314 Verify correct guess triggers round completion
- [X] T315 Verify all players see secret word in result state
- [X] T316 Verify all players see final scores in result
- [X] T317 Verify all players see complete guess history with ✅/❌ indicators
- [X] T318 Verify POST /rooms/:code/restart returns room to "lobby" status
- [X] T319 Verify participants list is preserved after restart
- [X] T320 Verify scores reset to 0 in lobby after restart
- [X] T321 Verify new activeRound can start after restart without stale data
- [X] T322 Test end-to-end multi-round sequence with two players

---

## Dependencies

- Depends on: `003-guess-submission-scoring` (requires guess history and scoring)
- Blocks: (completes the core gameplay loop)
