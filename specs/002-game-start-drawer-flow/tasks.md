---

description: "Task list for game start and drawer flow"

# Tasks: Game Start and Drawer Flow

**Input**: Design documents from `/specs/002-game-start-drawer-flow/`

## Phase 1: Backend — Round state and drawer assignment

- [ ] T018 Add `RoundState` interface to `backend/src/models/game.ts`
- [ ] T019 Update `startRoom()` in `backend/src/services/roomStore.ts` to create round with host as drawer, `STARTER_WORDS[0]` as word, empty drawing/guesses, null winner
- [ ] T020 Zero all participant scores in `startRoom()` in `backend/src/services/roomStore.ts`
- [ ] T021 Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to filter secret word by viewer identity
- [ ] T022 Add tests for round state, drawer assignment, word selection, zero scores, and word visibility in `backend/src/services/roomStore.test.ts`

## Phase 2: Frontend — Game navigation and display

- [ ] T023 Add auto-redirect from lobby to game on phase change in `frontend/src/pages/LobbyPage.tsx`
- [ ] T024 Render drawer name in GamePage status area in `frontend/src/pages/GamePage.tsx`
- [ ] T025 Show secret word card only when viewer is drawer in `frontend/src/pages/GamePage.tsx`
- [ ] T026 Update Scoreboard to render real participant names and scores in `frontend/src/components/Scoreboard.tsx`
- [ ] T027 Add polling to GamePage with cleanup on unmount in `frontend/src/pages/GamePage.tsx`

## Phase 3: Validation

- [ ] T028 Manual two-tab validation: start game, verify drawer identity, confirm drawer sees word, guesser sees null word, scores at 0
- [ ] T029 Run backend and frontend test suites
