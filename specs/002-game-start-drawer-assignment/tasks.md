# Tasks: Game Start, Drawer Assignment & Secret Word Visibility

**Input**: Design documents from `/specs/002-game-start-drawer-assignment/`

**Prerequisites**: spec.md, plan.md

## Phase 1: Backend Infrastructure

- [X] T101 Implement deterministic word selection logic in `backend/src/services/roomStore.ts` using hash-based modulo
- [X] T102 Add drawer assignment to `backend/src/services/roomStore.ts` startRoom() method
- [X] T103 Extend ActiveRound model in `backend/src/models/game.ts` with drawerId and secretWord fields
- [X] T104 Update toRoomSnapshot() in `backend/src/services/roomStore.ts` to conditionally reveal secretWord to drawer only

---

## Phase 2: Frontend UI & Validation

- [X] T105 Add name validation to `frontend/src/pages/CreateRoomPage.tsx` – reject empty/whitespace names
- [X] T106 Add name validation to `frontend/src/pages/JoinRoomPage.tsx` – reject empty/whitespace names
- [X] T107 Update `frontend/src/pages/GamePage.tsx` to display role indicator (Drawer / Guesser)
- [X] T108 Conditionally render secret word in `frontend/src/pages/GamePage.tsx` for drawer role only
- [X] T109 Add secretWord field to RoomSnapshot type in `frontend/src/services/api.ts`

---

## Phase 3: Integration & Testing

- [X] T110 Verify POST /rooms/:code/start returns correct drawer assignment
- [X] T111 Verify secret word is visible to drawer in GamePage
- [X] T112 Verify secret word is hidden from guessers in GamePage
- [X] T113 Verify name validation errors display correctly on join/create pages
- [X] T114 Test two-player start flow end-to-end

---

## Dependencies

- Depends on: `001-scribble-gameplay` (room creation and lobby)
- Blocks: `003-guess-submission-scoring` (gameplay requires active round)
