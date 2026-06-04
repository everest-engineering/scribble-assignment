# Discovery Notes

## Relevant Files

### Backend

* backend/src/models/game.ts
* backend/src/services/roomStore.ts
* backend/src/api/rooms.ts

### Frontend

* frontend/src/state/roomStore.ts
* frontend/src/services/api.ts
* frontend/src/pages/LobbyPage.tsx
* frontend/src/pages/GamePage.tsx
* frontend/src/components/GuessForm.tsx
* frontend/src/components/Scoreboard.tsx
* frontend/src/components/ResultPanel.tsx

## Incomplete Behaviors

### 1. Lobby Polling Missing

Lobby refresh currently requires manual interaction through the Refresh Room button.

Scenario 1 requires automatic polling approximately every 2 seconds.

### 2. Host Ownership Missing

Room creation does not track a host participant.

Scenario 1 requires the creator to automatically become the host.

### 3. Game Start Flow Missing

Start Game currently performs client-side navigation only.

No backend game state transition exists.

### 4. Drawer Assignment Missing

No participant is assigned the drawer role.

Scenario 2 requires deterministic drawer assignment.

### 5. Secret Word Visibility Missing

No secret word is selected or restricted to the drawer.

### 6. Gameplay Interaction Missing

Drawing, canvas clearing, guess submission, scoring, and result state are not implemented.

## Assumptions

### 1. Room State

Room state remains entirely in memory and is reset on server restart.

### 2. Synchronization

Polling will use existing HTTP endpoints rather than introducing WebSockets.

### 3. Host Selection

The room creator becomes the host.

### 4. Game Scope

Only a single round is required because multiple rounds and drawer rotation are explicitly out of scope.

## Risks

### 1. Polling Synchronization

Frequent polling may introduce stale snapshots between clients.

### 2. Shared State

Incorrect room updates could leak state between rooms if isolation is not maintained.

### 3. Feature Alignment

Implementing features beyond assignment scope may reduce evaluation scores.
