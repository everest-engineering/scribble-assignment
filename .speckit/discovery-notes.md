# Discovery Notes

> **Required coverage:** this document lists **6 gaps / incomplete behaviors** (requirement: ≥3) and
> **5 assumptions** (requirement: ≥2), plus the list of relevant files. See the two sections below.

## Gaps / Incomplete Behaviors (6 — requirement: ≥3)

### 1. No host or drawer assignment
The backend room model currently stores only `participants` and `status`. There is no separate host field and no role assignment tied to a player.

Impact:
- Cannot enforce host-only start behavior.
- Cannot support drawer-specific word visibility or gameplay roles.
- Cannot persist participant-specific game permissions.

### 2. Lobby refresh is manual only
The lobby page only supports a `Refresh Room` button and no automatic polling.

Impact:
- Joined players only appear after a manual refresh.
- The lobby does not behave like a live multiplayer waiting room.
- Scenario 1 requirement for ~2s polling is not satisfied.

### 3. Game flow is not connected with backend state
The `Start Game` button in `LobbyPage.tsx` just navigates to `/game` without updating backend room state.

Impact:
- The game page can be opened even when the backend still thinks the room is in `lobby`.
- There is no server-controlled state transition from lobby to active game.

### 4. Game page is a placeholder without real gameplay
`GamePage.tsx` renders a static canvas placeholder, a `GuessForm`, and UI components, but no interactive behavior is wired.

Impact:
- The drawer cannot actually draw.
- Guess submission is disconnected from backend validation.
- Scores, results, and round state are not real.

### 5. No input validation or name normalization
Frontend create and join flows accept any string as a player name, and backend fills empty names as `Player`.

Impact:
- Empty and whitespace-only names are not rejected.
- Scenario 2 requires trimming and rejecting invalid names.
- User feedback for invalid input is currently too weak.

### 6. Room snapshot is viewer-agnostic
Backend `toRoomSnapshot()` ignores `viewerParticipantId` and always returns the same snapshot to everyone.

Impact:
- Drawer-specific secret word visibility cannot be enforced.
- The frontend cannot show role-specific content based on the viewer.

## Assumptions (5 — requirement: ≥2)

### Assumption 1
Rooms are temporary and stored only in memory. Backend restart resets all active rooms.

### Assumption 2
Frontend routing and room state are intended to be maintained by a single-page React store, not by browser storage or sessions.

### Assumption 3
Room codes are case-insensitive and should be normalized to uppercase for lookup.

### Assumption 4
The room creator should be the host by default, and the host is the only player allowed to start the game.

### Assumption 5
Polling every 2 seconds is acceptable for lobby and gameplay sync given the explicit out-of-scope ban on WebSockets.

## Relevant Files

### Backend
- `backend/src/api/rooms.ts`
- `backend/src/services/roomStore.ts`
- `backend/src/models/game.ts`
- `backend/src/api/schemas.ts`
- `backend/src/seed/starterData.ts`

### Frontend
- `frontend/src/pages/CreateRoomPage.tsx`
- `frontend/src/pages/JoinRoomPage.tsx`
- `frontend/src/pages/LobbyPage.tsx`
- `frontend/src/pages/GamePage.tsx`
- `frontend/src/services/api.ts`
- `frontend/src/state/roomStore.ts`
- `frontend/src/components/GuessForm.tsx`
- `frontend/src/components/Scoreboard.tsx`
- `frontend/src/components/ResultPanel.tsx`

## Discovery Questions Answered

1. Where is the room object defined?
   - In `backend/src/services/roomStore.ts` and typed in `backend/src/models/game.ts`.

2. What fields does a room currently have?
   - `code`, `status`, `participants`, `createdAt`, `updatedAt`.
   - No host, no drawer, no selected word, no guesses, no canvas state.

3. Which file handles room creation?
   - `backend/src/api/rooms.ts`.

4. Which file renders the lobby?
   - `frontend/src/pages/LobbyPage.tsx`.

5. Is there already a Game page component?
   - Yes, `frontend/src/pages/GamePage.tsx`, but it is currently mostly placeholder content and not wired to real gameplay.

6. How is the frontend room state managed?
   - Through `frontend/src/state/roomStore.ts` using a custom store with `useSyncExternalStore`.

7. What is the backend API shape today?
   - `POST /rooms` creates a room.
   - `POST /rooms/:code/join` joins a room.
   - `GET /rooms/:code` fetches room snapshot.
   - There is no endpoint for start game, submit guess, clear canvas, or restart.

8. What frontend validations are currently missing?
   - Player name trimming and rejection.
   - Empty room code handling beyond uppercase normalization.
   - No frontend-level guard for starting the game before 2 players.

## Short discovery summary
The starter supports room creation, joining, and manual lobby refresh, but it lacks host/drawer assignment, actual game state transitions, role-aware snapshots, polling, validation, and gameplay endpoints. This means the next work should focus on Scenario 1 first: room setup, host tracking, join validation, lobby polling, and host-only start rules.
