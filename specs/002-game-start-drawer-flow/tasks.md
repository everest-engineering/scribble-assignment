# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer-flow/`

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Add `Round` interface and round fields to `Room`/`RoomSnapshot` in `backend/src/models/game.ts`
- [X] T002 [P] Update frontend `RoomSnapshot` type in `frontend/src/services/api.ts` with new fields

## Phase 2: Foundational

- [X] T003 Add `selectWord()` helper in `backend/src/services/roomStore.ts` (deterministic word selection)
- [X] T004 Update `startGame()` in `backend/src/services/roomStore.ts` to create Round 1, assign host as drawer, select word
- [X] T005 Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to include `currentRound`, `drawerId`, and `secretWord` (only for drawer)
- [X] T006 Backfill `rooms.get()` return for new room structure throughout roomStore

## Phase 3: User Story 1 — Round 1 Drawer Assignment (Priority: P1)

**Goal**: Host is assigned as drawer for round 1. All players see who the drawer is.

- [X] T007 [US1] Verify `startGame()` sets drawer to host in round 1 via test
- [X] T008 [US1] Update `GamePage.tsx` in `frontend/src/pages/GamePage.tsx` to display drawer identity to all players

## Phase 4: User Story 2 — Secret Word Visibility (Priority: P1)

**Goal**: Drawer sees the secret word; guessers do not.

- [X] T009 [US2] Update `GamePage.tsx` to show secret word prominently when player is drawer
- [X] T010 [US2] Verify `GamePage.tsx` hides secret word when player is not drawer

## Phase 5: Polish & Testing

- [X] T011 [P] Add backend test for `startGame()` round 1 creation with drawer assignment in `backend/src/services/roomStore.test.ts`
- [X] T012 [P] Add backend test for word determinism in `backend/src/services/roomStore.test.ts`
- [X] T013 [P] Add backend test for `toRoomSnapshot()` drawer vs guesser word visibility in `backend/src/services/roomStore.test.ts`
