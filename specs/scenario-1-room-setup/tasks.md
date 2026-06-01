# Tasks - Scenario 1 Room Setup And Lobby

## Phase 1 - Investigation

### T-001 Explore Room Creation Flow

Files

- frontend/src/pages/CreateRoomPage.tsx
- backend/src/api

Goal

- Find why room creation shows "Route not found".

### T-002 Explore Lobby Flow

Files

- frontend/src/pages/LobbyPage.tsx

Goal

- Understand how lobby participant data is loaded.

## Phase 2 - Backend Changes

### T-003 Add Host Tracking

Files

- backend/src/models
- backend/src/services

Dependencies

- T-001

Goal

- Creator of the room becomes host automatically.

### T-004 Add Start Game Validation

Files

- backend/src/api
- backend/src/services

Dependencies

- T-003

Goal

- Only host can start the game.
- Minimum 2 players required.

## Phase 3 - Frontend Changes

### T-005 Fix Room Creation Navigation

Files

- frontend/src/pages/CreateRoomPage.tsx
- frontend/src/App.tsx

Dependencies

- T-001

Goal

- Room creation should navigate to lobby correctly.

### T-006 Add Join Room Validation

Files

- frontend/src/pages/JoinRoomPage.tsx

Dependencies

- None

Goal

- Empty or invalid room codes show clear messages.

### T-007 Add Lobby Polling

Files

- frontend/src/pages/LobbyPage.tsx

Dependencies

- T-002

Goal

- Refresh room data automatically every 2 seconds.

### T-008 Show Host Controls

Files

- frontend/src/pages/LobbyPage.tsx

Dependencies

- T-003
- T-004

Goal

- Show Start Game button only for host.

## Phase 4 - Testing

### T-009 Verify Room Isolation

Goal

- Players only see users from their own room.

### T-010 Verify Host Rules

Goal

- Host can start game.
- Non-host cannot start game.

### T-011 Verify Lobby Polling

Goal

- New players appear automatically without manual refresh.
