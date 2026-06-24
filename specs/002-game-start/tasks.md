# Tasks: Game Start & Drawer Flow (Scenario 2)

## Task List

### T1: Backend player name validation
- [ ] Add `validatePlayerName(name?: string): string` — trim, reject empty
- [ ] Use in createRoom and joinRoom
- [ ] Update Zod schemas to require non-empty trimmed name
- **Files:** `roomStore.ts`, `schemas.ts`

### T2: Extend Room model for game round
- [ ] Add drawerId, secretWord, scores, guesses to Room
- [ ] Add ParticipantView with role and score to snapshot types
- [ ] Add optional secretWord to RoomSnapshot
- **Files:** `models/game.ts`

### T3: Deterministic word selection
- [ ] Add `selectWord(code: string)` pure function
- [ ] Unit test: same code → same word
- **Files:** `roomStore.ts`, `roomStore.test.ts`

### T4: Update startGame and toRoomSnapshot
- [ ] startGame sets drawerId=hostId, secretWord, scores init 0
- [ ] toRoomSnapshot assigns roles, scores, conditional secretWord
- **Files:** `roomStore.ts`

### T5: Frontend name validation
- [ ] Trim and validate on CreateRoomPage and JoinRoomPage
- **Files:** `CreateRoomPage.tsx`, `JoinRoomPage.tsx`

### T6: GamePage role and word display
- [ ] Show drawer/guesser role for viewer
- [ ] Show secret word card for drawer only
- [ ] Identify drawer in UI
- [ ] Poll every 2s while on game page with status "playing"
- **Files:** `GamePage.tsx`, `api.ts`

### T7: Tests
- [ ] Backend: name validation rejects empty
- [ ] Backend: snapshot includes secretWord for drawer only
- [ ] Backend: deterministic word selection
- **Files:** `roomStore.test.ts`, `schemas.test.ts`

### T8: Manual validation
- [ ] Two-tab: drawer sees word, guesser does not
- [ ] Empty name rejected on create/join
