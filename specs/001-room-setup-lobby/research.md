# Research Notes: Room Setup & Lobby

This document details the architectural decisions, rationales, and alternatives evaluated during the planning of the Room Setup & Lobby feature.

## Technical Decisions & Rationales

### 1. HTTP Polling Mechanism
- **Decision**: Implement client-side periodic polling every 2 seconds (`setInterval`) in the lobby React view to synchronize state with the server.
- **Rationale**: WebSockets and real-time push protocols are strictly forbidden by the project constitution. Standard HTTP polling is reliable, stateless, and integrates natively with the existing Express backend routes.
- **Alternatives Considered**: 
  - *Server-Sent Events (SSE)*: Rejected because the constitution forbids any real-time push protocols, enforcing polling as the exclusive sync mechanism.

### 2. Room Code Generation
- **Decision**: Generate exactly 6-character alphanumeric, case-sensitive room codes (e.g., `3x8F2P`).
- **Rationale**: Chosen by the user during the clarification phase (Question 3). Alphanumeric keys provide a high degree of collision resistance ($62^6 \approx 56.8 \text{ billion}$ combinations) which prevents overlap in server memory.
- **Alternatives Considered**: 
  - *4-character uppercase codes (e.g., `ABCD`)*: Rejected in favor of the user's preference for alphanumeric code length and format.

### 3. Nickname Validation & Constraints
- **Decision**: Validate and trim player nicknames on join and create requests. Enforce a minimum length of 1 character (after trimming) and a maximum of 20 characters, allowing any unicode characters (including emojis and spaces).
- **Rationale**: Chosen by the user during the clarification phase (Question 2). A limit of 20 characters keeps the scoreboard and lobby lists visually clean while supporting multi-language characters and emojis.
- **Alternatives Considered**: 
  - *Alphanumeric only, max 15 characters*: Rejected to support free-form names.

### 4. Active Connection Tracking & Idle Pruning
- **Decision**: Store a `lastActiveAt` (UNIX epoch timestamp) on each `Participant` in server memory. Whenever the client polls the server via `GET /rooms/:code`, update the viewer's `lastActiveAt` to the current time. Run a background cleanup loop (`setInterval`) every 5 seconds on the server to remove participants who have not polled within the last 10 seconds.
- **Rationale**: Simple in-memory garbage collection that prevents orphan players from occupying room slots or preventing a room from closing when a player abruptly closes their tab.
- **Alternatives Considered**: 
  - *WebRTC/Socket ping-pong*: Rejected because we cannot use socket-based persistent connections.

### 5. Host Identification & Role Promotion
- **Decision**: Define the host implicitly as the player at index 0 of the room's `participants` list. Since players are appended chronologically, the creator is always index 0. If the host leaves or is pruned, they are removed from the array, and the player at index 1 shifts to index 0, becoming the new host automatically.
- **Rationale**: Eliminates explicit host-state mutation bugs, simplifies JSON payload structure, and naturally implements the chronological join order priority.
- **Alternatives Considered**: 
  - *Explicit `hostParticipantId` field in Room state*: Rejected because index-based lookup is simpler and less error-prone under deletion scenarios.
