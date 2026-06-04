# Tasks: Scribble — Full Game Implementation

## Phase 1: Fix Existing Bugs

- [x] T001 Fix hostId not set in createRoom (roomStore.ts)
- [x] T002 Fix toRoomSnapshot to include hostId and use viewerParticipantId
- [x] T003 Fix API_BASE_URL default (remove `/bug` suffix) in api.ts
- [x] T004 Add .min(1) to roomCodeParamsSchema.code in schemas.ts
- [x] T005 Add trimming and rejection of empty/whitespace player names in schemas.ts

## Phase 2: Scenario 1 — Room Setup & Lobby

- [x] T006 Add auto-polling to LobbyPage (useEffect with setInterval)
- [x] T007 Add POST /rooms/:code/start endpoint on backend
- [x] T008 Add startGame service logic (host check, min 2 players check)
- [x] T009 Wire LobbyPage "Start Game" to call API and gate on host + player count
- [x] T010 Add startGame method to frontend api.ts and roomStore

## Phase 3: Scenario 2 — Game Start & Drawer Flow

- [x] T011 Extend RoomStatus and Room model with game state fields (drawerId, secretWord, round, guesses, scores, drawing)
- [x] T012 Assign drawer and select secret word in startGame logic
- [x] T014 Mask secret word in toRoomSnapshot for non-drawer viewers
- [x] T015 Update GamePage to show drawer identification and role-based UI

## Phase 4: Scenario 3 — Gameplay Interaction

- [x] T016 Add drawing storage and clear endpoint (POST/DELETE /rooms/:code/draw)
- [x] T017 Add guess submission endpoint (POST /rooms/:code/guess) with trimming, validation, case-insensitive comparison, scoring
- [x] T018 Add submitGuess method to frontend api.ts and roomStore
- [x] T019 Wire GuessForm to submit guesses via API
- [x] T020 Wire Scoreboard to display real scores
- [x] T021 Wire ResultPanel to display guess history
- [x] T022 Add drawing canvas component
- [x] T023 Add auto-polling to GamePage for drawing, guesses, scores
- [x] T024 Add canvas clear button for drawer

## Phase 5: Scenario 4 — Result, Restart & Final Validation

- [x] T025 Add game end detection (all guessers correct or drawer ends round)
- [x] T026 Update GamePage to show results (correct word, final scores, guess history)
- [x] T027 Add restart endpoint (POST /rooms/:code/restart) — resets round, preserves players
- [x] T028 Wire restart button in results view
- [x] T029 Navigate to lobby on restart
