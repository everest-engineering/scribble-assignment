# Research & Technical Decisions: Room Setup & Lobby

This document details the engineering research and decisions for the Room Setup & Lobby feature.

## Decisions

### 1. Host Tracking and Identity
- **Decision**: Add a `hostId` field (string) to the backend `Room` entity (and `RoomSnapshot` sent to client). When a player creates a room, their generated `participantId` is stored as the `hostId`.
- **Rationale**: Storing a explicit `hostId` is more robust and self-documenting than assuming the first item in the `participants` array is always the host.
- **Alternatives Considered**: 
  - *First participant as host*: Fragile if array ordering changes or when promoting a new host if the creator leaves.

### 2. Synchronization (Lobby Polling)
- **Decision**: Implement a 2-second `setInterval` in the frontend `LobbyPage` component that invokes `roomStore.fetchRoom()`.
- **Rationale**: Simple, lightweight, and directly conforms to the Project Constitution Principle IV (HTTP Polling Sync Only).
- **Alternatives Considered**: 
  - *Short-polling via page focus*: Does not provide a continuous update when window is inactive but visible. Continuous 2s interval is preferred.

### 3. Validation for Duplicate Usernames
- **Decision**: Add a check in `joinRoom` service in backend: if a player attempts to join with a `playerName` (case-insensitive trim comparison) that matches an existing participant's name, return an error.
- **Rationale**: Prevents name collisions in drawing and guessing, ensuring clear UI and scoring.

### 4. Promotion of Host when Host Leaves
- **Decision**: If the current host leaves the room, the next oldest participant (first element in the `participants` array) is promoted to host by updating `hostId`.
- **Rationale**: Keeps the lobby functional and active if the host disconnects or leaves.
