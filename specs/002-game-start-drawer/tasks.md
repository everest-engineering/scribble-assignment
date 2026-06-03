# Tasks: Game Start & Drawer Flow

---

### T1: Backend — add drawer, word, and round to models

**Files**: `backend/src/models/game.ts`

- Add `drawerId: string`, `secretWord: string`, `round: number` to `Room` interface
- Add `drawerId: string`, `secretWord?: string`, `round: number` to `RoomSnapshot` interface

**Verify**: `npm run build` passes in backend

---

### T2: Backend — assign drawer and word on start, filter word in snapshot

**Files**: `backend/src/services/roomStore.ts`

- In `startGame()`:
  - Set `drawerId = participants[0].id` (host is drawer)
  - Set `secretWord = STARTER_WORDS[0]` ("rocket")
  - Set `round = 1`
- In `toRoomSnapshot()`:
  - Always include `drawerId` and `round`
  - Include `secretWord` only if `viewerParticipantId === room.drawerId`

**Verify**: `npm run build` passes

---

### T3: Frontend — update types and game page UI

**Files**: `frontend/src/services/api.ts`, `frontend/src/pages/GamePage.tsx`

- Add `drawerId`, `secretWord?`, `round` to `RoomSnapshot` type
- In `GamePage`:
  - Show the drawer's name prominently
  - If viewer is drawer, show the secret word
  - If viewer is guesser, show "Waiting for the drawer..." or similar

**Verify**: `npm run build` passes in frontend, test with two tabs
