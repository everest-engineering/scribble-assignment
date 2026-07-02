# Implementation Tasks - Game Start & Drawer Flow (Slice 2)

This task list tracks the step-by-step implementation and verification steps for Slice 2.

---

## Task Checklist

### Phase 1: Shared Models & Backend Updates
- [x] **Task 1.1: Extend Room & Snapshot Interfaces**
  - Update `Room` and `RoomSnapshot` interfaces in `backend/src/models/game.ts` to include optional fields: `drawerId?: string` and `secretWord?: string`.
  - Align `RoomSnapshot` in `frontend/src/services/api.ts` to include `drawerId?: string` and `secretWord?: string`.
- [x] **Task 1.2: Enforce Backend Name Trimming**
  - Verify and ensure both `createRoom()` and `joinRoom()` in `backend/src/services/roomStore.ts` trim player names before saving them in the participant lists.

---

### Phase 2: Game Start Logic & Privacy Guards
- [x] **Task 2.1: Implement Deterministic Word Selection**
  - Add helper function `getDeterministicWord(code: string)` in `backend/src/services/roomStore.ts` using the room code (ASCII summation modulo length) to pick a word from `STARTER_WORDS`.
- [x] **Task 2.2: Assign Drawer & Word on Game Start**
  - Update `startGame(code, hostParticipantId)` in `backend/src/services/roomStore.ts` to:
    - Set `room.drawerId` to the participant ID of the first player (`participants[0].id`).
    - Set `room.secretWord` to the deterministically selected word.
- [x] **Task 2.3: Implement Privacy Guard in Snapshot**
  - Update `toRoomSnapshot(room, viewerParticipantId)` in `backend/src/services/roomStore.ts` to include `secretWord` if and only if `viewerParticipantId === room.drawerId`.

---

### Phase 3: Frontend Layout & UI Integration
- [x] **Task 3.1: Add Role and Word Info on Game Screen**
  - Modify `frontend/src/pages/GamePage.tsx` to:
    - Determine if current player is the drawer: `const isDrawer = room.drawerId === participantId`.
    - Display player's role (`Drawer` or `Guesser`) under Player Info card.
    - If drawer, show the secret word clearly in the canvas or header area.
    - If guesser, hide the secret word and show a status message indicating who is drawing (e.g. `"Alice is drawing. Guess the word!"`).

---

### Phase 4: Verification & Automated Tests
- [x] **Task 4.1: Write Backend Unit Tests**
  - Create/add test cases in `backend/src/services/roomStore.test.ts` to verify:
    - Player name trimming on create and join.
    - `startGame` sets status to `"active"`, drawer to first player, and a secret word.
    - `toRoomSnapshot` includes secret word for the drawer, and omits it for other participants.
- [x] **Task 4.2: Manual E2E Validation**
  - Run the frontend and backend.
  - Launch 2 browser tabs. Connect both to a room.
  - Start the game from the host tab and verify the drawer tab sees the secret word, while the guesser tab does not.
- [x] **Task 4.3: Final Build Check**
  - Run `npm run build` in both frontend and backend directories.
