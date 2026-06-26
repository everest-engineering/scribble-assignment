# Discovery Notes — Scribble Assignment


## Missing Features (Gaps)

### 1. Host tracking & host-only permissions
The backend creates rooms (`POST /rooms`) but does not mark any participant as the **host**. There is no endpoint or logic that enforces host-only actions (e.g., starting the game). The `Participant` model in `backend/src/models/game.ts` has no `isHost` flag.

**Relevant files:** `backend/src/models/game.ts`, `backend/src/api/rooms.ts`, `backend/src/services/roomStore.ts`

### 2. Player name validation
Player names are accepted as-is with no trimming and no rejection of empty or whitespace-only input. The `createRoomSchema` and `joinRoomSchema` in `backend/src/api/schemas.ts` only check that `playerName` is a string.

**Relevant files:** `backend/src/api/schemas.ts`, `frontend/src/pages/CreateRoomPage.tsx`, `frontend/src/pages/JoinRoomPage.tsx`

### 3. Automatic lobby polling
The Lobby page has a manual "Refresh Room" button but no automatic polling mechanism. Scenario 1 requires the lobby to refresh automatically at ~2s intervals.

**Relevant files:** `frontend/src/pages/LobbyPage.tsx`, `frontend/src/state/roomStore.ts`

### 4. Start game flow
There is no backend endpoint to transition a room from `"lobby"` status to an active game state. The `RoomStatus` type in `backend/src/models/game.ts` only defines `"lobby"`. No drawer assignment, word selection, or round initialization exists.

**Relevant files:** `backend/src/api/rooms.ts`, `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, `frontend/src/pages/LobbyPage.tsx`

### 5. Drawing interaction & clear canvas
The Game page shows a placeholder canvas area but no interactive drawing. There is no clear canvas action.

**Relevant files:** `frontend/src/pages/GamePage.tsx`

### 6. Guess submission & history
No backend endpoint exists for submitting guesses. No guess history is tracked on the room state or synced to players via polling.

**Relevant files:** `backend/src/api/rooms.ts`, `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, `frontend/src/pages/GamePage.tsx`

### 7. Scoring
No scoring logic exists. Scenario 3 requires correct guesses to award 100 points.

**Relevant files:** `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`

### 8. Result state & restart
No result display after a round ends. No restart flow to return players to the lobby with round state cleared.

**Relevant files:** `backend/src/api/rooms.ts`, `backend/src/models/game.ts`, `frontend/src/pages/GamePage.tsx`

### 9. Secret word visibility rules
There is no mechanism to ensure the secret word is visible only to the drawer. All players would currently see the same data.

**Relevant files:** `backend/src/api/rooms.ts`, `backend/src/models/game.ts`, `frontend/src/pages/GamePage.tsx`

### 10. Round lifecycle management
No round state (current round number, round active flag, round end logic). The `Room` model has no concept of rounds.

**Relevant files:** `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`

## Assumptions

### A1. Polling-based sync (no WebSockets)
The README and AGENTS.md explicitly forbid WebSockets. All real-time sync between players is assumed to use HTTP polling at ~2s intervals. This affects lobby refresh, guess history sync, and game state updates.

### A2. First player (creator) is host
Since there is no explicit host assignment yet, the assumed convention is that the room creator (first player to join) is the host. The host is the only player who can start the game.

### A3. Deterministic word selection
Words are selected from the fixed seed list (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) using a deterministic method (e.g., based on round number), not random. This ensures consistent behavior across clients.

### A4. Flat scoring (100 / 0)
Correct guesses score exactly 100 points. Incorrect guesses add 0. No speed bonuses, streak bonuses, or partial credit. This keeps scoring simple and deterministic.

### A5. Single round only (no rotation)
Multiple rounds, drawer rotation, timers, and countdowns are explicitly out of scope. The implementation covers exactly one round per game session, then a restart back to lobby.

### A6. In-memory only (no persistence)
All room data is stored in memory via `Map` in `roomStore.ts`. Restarting the backend clears all rooms. No database of any kind is used.

### A7. No authentication
Anyone can create or join a room without accounts, login, or sessions. Room codes are the only access mechanism. No rate limiting or security measures are in scope.

### A8. Case-insensitive guess comparison
Guesses are compared case-insensitively against the secret word. Input is trimmed before comparison. Empty guesses are rejected.

## Out of Scope (Confirmed from README)

### Technical
- WebSockets / real-time sync
- Databases / persistent storage
- Authentication / accounts / sessions
- Deployment / hosting / CI pipelines
- Docker / containerization
- New state-management or routing libraries (beyond what the starter ships)

### Game features
- Multiple rounds
- Drawer rotation
- Round timers / countdowns
- Speed or drawer bonuses
- Custom or random word packs
- Spectator mode
- Room moderation (kick / mute)
- Room passwords or invite links

### Process
- Rewriting the starter from scratch — extend, don't replace
- Adding top-level dependencies your spec doesn't justify
- Refactoring unrelated code
