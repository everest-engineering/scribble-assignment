# Pull Request: Scribble Assignment - Complete Implementation

## Overview
This PR implements all four required Scribble game scenarios with comprehensive Spec Kit artifacts (constitution, specifications, plans, and tasks) for a multiplayer drawing and guessing game.

## Scenarios Implemented

### ✅ Scenario 001: Room Setup & Lobby
**Description**: Players can create or join rooms with automatic host tracking and lobby polling.

**Key Features**:
- Unique 4-character room code generation
- Host automatically assigned to room creator
- Automatic lobby polling (~2 seconds) to see participant updates
- Player name validation (empty/whitespace rejected with error messages)
- Room code validation with clear error feedback
- Minimum 2-player requirement enforced for game start
- Multi-room isolation verified
- Only host can start the game

**Files Modified**:
- `backend/src/api/schemas.ts` - Validation schemas
- `backend/src/services/roomStore.ts` - Room management
- `frontend/src/pages/LobbyPage.tsx` - Polling loop, start game
- `frontend/src/state/roomStore.ts` - Room store implementation

---

### ✅ Scenario 002: Game Start & Drawer Flow
**Description**: Game start triggers drawer assignment and secret word visibility management.

**Key Features**:
- Player names trimmed and validated on both client and server
- Drawer assigned to first participant on game start
- Deterministic secret word selection ("rocket" from starter word list)
- Drawer-only word visibility via `toRoomSnapshot()` filtering
- Role assignment ("drawer" or "guesser") synced to all players
- Role-based UI display in game page

**Files Modified**:
- `backend/src/api/schemas.ts` - Enhanced submitGuessSchema
- `backend/src/services/roomStore.ts` - Name validation, role assignment
- `frontend/src/pages/CreateRoomPage.tsx` - Client-side name validation
- `frontend/src/pages/JoinRoomPage.tsx` - Client-side name validation
- `frontend/src/pages/GamePage.tsx` - Role-based content display

---

### ✅ Scenario 003: Gameplay Interaction
**Description**: Players interact with canvas, submit guesses, and sync state via polling.

**Key Features**:
- Interactive canvas for drawer (add lines, clear canvas)
- Canvas synchronization via `POST /rooms/:code/canvas`
- Guess submission with validation (non-empty, trimmed)
- Case-insensitive guess comparison
- Scoring: 100 points for correct guess, 0 for incorrect
- Guess history with player name, message, and correctness indicator
- Automatic synchronization via 2-second polling
- Role-based access control (drawer cannot guess, guessers cannot draw)

**Files Modified/Created**:
- `backend/src/api/rooms.ts` - Canvas and guess endpoints
- `backend/src/services/roomStore.ts` - Canvas and guess logic
- `frontend/src/components/GuessForm.tsx` - Guess input with validation
- `frontend/src/components/Scoreboard.tsx` - Real-time score display
- `frontend/src/components/ResultPanel.tsx` - Guess history
- `frontend/src/pages/GamePage.tsx` - Canvas, guess form integration
- `frontend/src/state/roomStore.ts` - submitGuess, saveCanvas methods
- `frontend/src/services/api.ts` - API methods for canvas and guess

---

### ✅ Scenario 004: Result, Restart & Final Validation
**Description**: Round completion triggers result display and host-initiated restart flow.

**Key Features**:
- Result screen displays correct answer to all players
- Final scoreboard with all participant scores
- Complete guess history with all guesses and results
- Host-only restart button
- Clean round reset: guesses, canvas, scores, roles cleared
- Participant list preserved across restarts
- Auto-return to lobby after restart
- Round counter incremented for tracking

**Files Modified/Created**:
- `backend/src/api/rooms.ts` - Added `POST /rooms/:code/restart` endpoint
- `backend/src/services/roomStore.ts` - Added `restartGame()` function
- `frontend/src/services/api.ts` - Added `restartGame()` API method
- `frontend/src/state/roomStore.ts` - Added `restartGame()` store method
- `frontend/src/components/ResultPanel.tsx` - Enhanced with restart button and result display

---

## Spec Kit Artifacts Created

### Constitution
**File**: `.specify/memory/constitution.md`
- Code quality standards (TypeScript strict, React hooks)
- Architecture constraints (polling only, in-memory, no external deps)
- Validation requirements
- Workflow discipline (spec → plan → tasks → implement)

### Specifications (4 files)
Each with user stories, acceptance criteria, and edge cases:
- `specs/001-room-setup-lobby/spec.md` - 8 acceptance criteria
- `specs/002-game-start/spec.md` - 15 acceptance criteria
- `specs/003-gameplay/spec.md` - 10 acceptance criteria
- `specs/004-results/spec.md` - 13 acceptance criteria

### Plans (4 files)
Each with architecture, endpoints, and data flow details:
- `specs/001-room-setup-lobby/plan.md`
- `specs/002-game-start/plan.md`
- `specs/003-gameplay/plan.md`
- `specs/004-results/plan.md`

### Tasks (4 files)
Total of 86 granular, testable tasks with dependencies:
- `specs/001-room-setup-lobby/tasks.md` - 10 tasks
- `specs/002-game-start/tasks.md` - 20 tasks
- `specs/003-gameplay/tasks.md` - 36 tasks
- `specs/004-results/tasks.md` - 20 tasks

---

## Implementation Details

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Validation**: Zod schemas for all requests
- **Storage**: In-memory `Map<string, Room>` (no database)
- **Endpoints**:
  - `POST /rooms` - Create room
  - `POST /rooms/:code/join` - Join room
  - `GET /rooms/:code` - Get room state
  - `POST /rooms/:code/start` - Start game
  - `POST /rooms/:code/guess` - Submit guess
  - `POST /rooms/:code/canvas` - Save canvas
  - `POST /rooms/:code/restart` - Restart round

### Frontend Architecture
- **Framework**: React 18 with TypeScript, Vite
- **Routing**: React Router v6
- **State Management**: Custom RoomStore (external store pattern with useSyncExternalStore)
- **Polling**: 2-second intervals for room state synchronization
- **Pages**: Start, Create, Join, Lobby, Game
- **Components**: Canvas, GuessForm, Scoreboard, ResultPanel, RoomCodeBadge

### Data Model
```typescript
interface Room {
  code: string;
  status: "lobby" | "playing";
  hostId: string;
  participants: Participant[];
  currentDrawerId?: string;
  currentWord?: string;
  guesses: Guess[];
  canvasLines: string[];
  round: number;
}

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  role?: "drawer" | "guesser";
  score: number;
}

interface Guess {
  id: string;
  participantId: string;
  playerName: string;
  message: string;
  isCorrect: boolean;
  createdAt: string;
}
```

---

## Verification

### Backend Compilation
```bash
cd backend
npm install
npm run build
✅ TypeScript compiles without errors
```

### Frontend Compilation
```bash
cd frontend
npm install
npm run build
✅ TypeScript + Vite build successful
```

### Manual Testing
✅ All 4 scenarios tested across multiple browser tabs:
- Scenario 1: Room creation, joining, lobby polling, multi-room isolation
- Scenario 2: Name validation, drawer assignment, word visibility
- Scenario 3: Canvas drawing, guess submission, scoring, history sync
- Scenario 4: Result display, restart flow, participant preservation

### Edge Cases Verified
- ✅ Empty player names rejected with error
- ✅ Whitespace-only names rejected
- ✅ Case-insensitive guess matching ("RoCkEt" == "rocket")
- ✅ Non-host cannot restart (error thrown and displayed)
- ✅ Canvas clears properly on clear button
- ✅ Multiple guesses display in order
- ✅ Scores reset after restart
- ✅ Participants preserved across restarts
- ✅ Round counter increments on restart

---

## Testing Completed

### Scenario 001: Room Setup & Lobby
- ✅ Create room generates unique code
- ✅ First creator becomes host
- ✅ Join room with valid code works
- ✅ Join with invalid code shows error
- ✅ Empty names rejected
- ✅ Whitespace-only names rejected
- ✅ Lobby auto-polls every ~2 seconds
- ✅ Participant list updates without refresh
- ✅ Start game button visible only to host
- ✅ Start requires 2+ players

### Scenario 002: Game Start & Drawer Flow
- ✅ Player names trimmed before display
- ✅ First participant assigned as drawer
- ✅ Secret word set to "rocket"
- ✅ Drawer sees word in game page
- ✅ Guessers don't see word (undefined)
- ✅ Roles assigned correctly to all players
- ✅ Game page shows role indicator

### Scenario 003: Gameplay Interaction
- ✅ Drawer can draw (add lines)
- ✅ Drawer can clear canvas
- ✅ Canvas updates sync via polling
- ✅ Guessers see drawer's canvas
- ✅ Guessers can submit guesses
- ✅ Empty guesses rejected with error
- ✅ Whitespace-only guesses rejected
- ✅ Correct guess awards 100 points
- ✅ Incorrect guess awards 0 points
- ✅ Case-insensitive matching works
- ✅ Guess history displays all guesses
- ✅ Guess history syncs via polling
- ✅ Drawer cannot submit guesses

### Scenario 004: Result & Restart
- ✅ Result screen displays correct answer
- ✅ Final scoreboard shows all scores
- ✅ Guess history displays on result screen
- ✅ Host-only restart button visible
- ✅ Restart transitions to lobby
- ✅ Guesses cleared after restart
- ✅ Canvas cleared after restart
- ✅ Scores reset to 0
- ✅ Roles cleared
- ✅ Participants preserved
- ✅ Round number incremented

---

## Key Implementation Decisions

1. **Polling Over WebSockets**: HTTP polling chosen per constraint; 2-second interval provides acceptable UX
2. **In-Memory Store**: Single `Map<string, Room>` for simplicity; sufficient for MVP scope
3. **Deterministic Word Selection**: Always "rocket" for first round; consistent for testing
4. **Simple Canvas Representation**: String array instead of HTML5 Canvas; demonstrates sync mechanics
5. **Viewer-Specific Snapshots**: Backend filters `currentWord` in `toRoomSnapshot()`; single source of truth
6. **Dual Validation**: Client-side for UX, server-side for security

---

## What Was NOT Included (Out of Scope)

- WebSockets or real-time push
- Persistent database (SQL, NoSQL, SQLite)
- Authentication, sessions, or user accounts
- Multiple rounds or drawer rotation
- Interactive HTML5 Canvas (using string array instead)
- Deployment, CI/CD, Docker
- Custom or random word selection
- Drawing timers or bonuses

---

## Commit History

All work organized in granular, meaningful commits:
- Scenario spec/plan/task artifacts created
- Backend endpoints and validation implemented
- Frontend pages and components enhanced
- Name validation added (client + server)
- Restart endpoint and logic added
- ResultPanel enhanced with restart button

---

## Contributor Information

- Email: nagusha.madasu@everest.engineering
- Role (select one):
  - [x] Developer
  - [ ] Product

---

## Review Checklist

- [ ] All 4 scenarios implemented and tested
- [ ] Spec Kit artifacts complete (constitution, specs, plans, tasks)
- [ ] Backend compiles without errors
- [ ] Frontend compiles without errors
- [ ] Manual testing verified across multiple browser tabs
- [ ] Edge cases handled and tested
- [ ] Code follows TypeScript strict mode
- [ ] Commits are granular and meaningful
- [ ] README instructions still work (install, run dev)
- [ ] No breaking changes to existing functionality

---

## How to Review

1. **Read the Specs**: Start with `specs/*/spec.md` to understand requirements
2. **Review the Plans**: Check `specs/*/plan.md` for architecture decisions
3. **Examine Tasks**: See `specs/*/tasks.md` for implementation scope
4. **Test Manually**:
   ```bash
   # Terminal 1
   cd backend && npm install && npm run dev
   
   # Terminal 2
   cd frontend && npm install && npm run dev
   
   # Browser: Open http://localhost:5173 in two tabs
   # Tab 1: Create room
   # Tab 2: Join room with code from Tab 1
   # Both tabs: Play through all 4 scenarios
   ```
5. **Verify Implementation**: Check commits and code changes
6. **Validate Against Spec**: Confirm behavior matches acceptance criteria

---

## Summary

This implementation delivers a fully functional multiplayer Scribble game with:
- ✅ Spec Kit discipline across 4 scenarios
- ✅ Complete planning and task breakdowns
- ✅ Type-safe TypeScript implementation
- ✅ Polling-based synchronization
- ✅ Comprehensive testing across scenarios
- ✅ Clear, incremental git history
- ✅ Production-ready validation and error handling

The game is ready for review and merging.
