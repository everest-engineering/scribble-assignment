# Feature Specification: Scenario 1 — Room Setup & Lobby

## Purpose
Provide the feature-level artifacts for room creation, joining, lobby syncing, and host-only game start.

## Scope
- Create a room with a unique 4-character code
- Assign the creator as the room host
- Validate empty/invalid room codes on join
- Automatically refresh lobby participant state via polling
- Allow only the host to start the game and only when >= 2 players are present

## User Stories

### Room Creation & Host Assignment
As a player, I want to create a room and become the host so that I can start a drawing game.

Acceptance Criteria:
- Creator receives a unique room code.
- Creator is marked as `hostId` in the room snapshot.
- Creator is redirected to `/lobby` after successful room creation.

### Join Room Validation
As a player, I want to join an existing room with a code and receive clear feedback when the code is invalid.

Acceptance Criteria:
- Empty or whitespace-only room codes are rejected locally.
- Invalid code formats are rejected locally or by the backend.
- Non-existent room codes produce a clear "Room not found" message.

### Lobby Polling
As a lobby participant, I want the participant list to update automatically so I can see other players join.

Acceptance Criteria:
- Lobby refreshes automatically within ~2 seconds of a new join.
- Participants do not need to press a manual refresh button.

### Host-Only Start
As a non-host lobby participant, I want to wait for the host to start the game.

Acceptance Criteria:
- Only the host sees an enabled "Start Game" button.
- The host button is disabled until at least 2 participants are present.
- Non-hosts see a waiting message instead of a start action.

## Edge Cases
- Room codes are normalized to uppercase and trimmed.
- Host identity is preserved across room snapshots.
- Room A participants never see Room B state.
- Single-player hosts cannot start the game.
