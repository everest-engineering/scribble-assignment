# Technical Research: Room Setup & Lobby

## Summary of Findings

### 1. Host Tracking and Identification (F1)
- **Design**: The creator of a room is automatically the host. In [backend/src/services/roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.ts), when a room is created, we will record the host participant's ID in a new `hostId` field on the `Room` entity.
- **Participant Mapping**: In the participant snapshot payload, we will set `isHost: participant.id === room.hostId` dynamically in `toRoomSnapshot`. This allows the frontend to easily display a host badge or render host-only UI elements.

### 2. Lobby Auto-Polling (F4)
- **Frontend Sync**: The client waiting in the lobby page needs to see the participant list update automatically. We will use a standard `useEffect` hook with `setInterval` on the [frontend/src/pages/LobbyPage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/LobbyPage.tsx) page at a regular ~2s cadence.
- **Hook Cleanup**: The interval must be cleared on component unmount (when game starts or player leaves) to prevent memory leaks and unnecessary network calls.
- **Warning Banner on Failure**: If polling fails (e.g. network offline), the error state will render a banner at the top of the lobby, but the interval will continue to attempt to reconnect.

### 3. Host-Only Start with 2-Player Minimum (F5)
- **Visibility**: The `Start Game` button will only be rendered in [frontend/src/pages/LobbyPage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/LobbyPage.tsx) if `room.participants.find(p => p.id === currentParticipantId)?.isHost` is true.
- **Constraint**: The start button will be `disabled` if `room.participants.length < 2`.
- **API Start Enforcement**: When the host starts the game, the room status will update on the backend to `"game"` (or similar active status), which will be detected by other participants in the next polling cycle, triggering their redirect to the game canvas.

## Alternatives Considered

### Option A: WebSockets / Socket.io for Real-Time Sync
- **Pros**: Lower latency updates when players join.
- **Cons**: Violates the explicit project constitution principle ("strictly forbidden: No WebSockets... All sync must use HTTP polling").
- **Resolution**: Rejected. Auto-polling at a ~2s interval is robust and compliant.

### Option B: Shared state re-evaluation on the Client
- **Pros**: Client calculates who is the host locally by picking the first participant.
- **Cons**: If the first participant disconnects or reconnects, the order might change, creating inconsistent host mappings on different clients.
- **Resolution**: Rejected. Storing a dedicated `hostId` on the `Room` entity on the backend ensures single-source-of-truth host identification.
