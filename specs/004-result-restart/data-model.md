# Data Model: Result & Restart

**Branch**: `004-result-restart` | **Date**: 2026-05-31

## Key Entities

### 1. Game Room State (Update)

The central state object holding the entire game's data in-memory on the backend.

- **Phase**: Needs a new valid state: `results`. (Transitions: `lobby` -> `playing` -> `results` -> `lobby`).
- **Canvas State**: Must be preserved when entering `results` phase to allow the frontend to render the snapshot of the final drawing. Must be cleared when entering `lobby` phase.
- **Players**: Array of player objects. When transitioning to `lobby`, each player's `score` must be reset to `0`.
- **Target Word**: Must be preserved when entering `results` phase to be displayed on the result screen.
- **Round Results** (New Field): An object or array tracking the outcome of the round (can simply be derived from the current player scores and the target word).

### 2. Player (Update)

- **Score**: Integer tracking points. Must be displayed on the `results` screen. Must be reset to `0` upon returning to the `lobby`.
- **Role/Host**: Boolean/Enum. The system must ensure one player is always the host. If the host drops, the oldest player (e.g., index 0 in the players array) must become the new host.

## State Transitions

### `playing` -> `results`
**Trigger**: Timer expires OR all guessers correctly guess the word.
**Actions**:
- Change phase to `results`.
- Pause or clear the round timer.
- Calculate final points (if not already accumulated).
- Retain `canvasState` and `targetWord`.

### `results` -> `lobby`
**Trigger**: Host manually sends a request to return to lobby.
**Actions**:
- Change phase to `lobby`.
- Clear `canvasState`.
- Clear `targetWord`.
- Reset `score` to `0` for all players.
- Reset any turn/drawer tracking.

### Host Disconnect (Any Phase)
**Trigger**: Host WebSocket/polling timeout or explicit disconnect.
**Actions**:
- Identify the first remaining player in the room's player list.
- Set their host flag to `true`.
