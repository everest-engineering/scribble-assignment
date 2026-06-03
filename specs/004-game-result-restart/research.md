# Research: Game Result and Restart

## Decision 1: HTTP Polling for State Transitions
- **Decision**: Rely entirely on the existing HTTP polling mechanism for clients to discover state transitions (to `RESULT` and then to `LOBBY`).
- **Rationale**: The Constitution strictly forbids WebSockets or push protocols. Since clients are already polling the room state, when the backend updates the room state to `RESULT`, clients will fetch it and render the results screen. When the host restarts and the state becomes `LOBBY`, clients will fetch it and navigate to the lobby.
- **Alternatives considered**: None, as push protocols are explicitly banned by the Constitution.

## Decision 2: State Clearing Mechanism
- **Decision**: The backend `RoomService` will have a `restartGame()` method that explicitly resets transient arrays/objects (e.g., `guesses = []`, `drawingData = []`, `scores = {}`, `currentWord = null`) while keeping the `players` array and `hostId` intact.
- **Rationale**: Minimal in-memory footprint is required. Rather than creating a new room object, we re-initialize the existing object's properties to avoid updating room IDs or dropping players.
- **Alternatives considered**: Creating a new room and issuing a new code. Rejected because the feature spec requires preserving the room code and avoiding the need to share a new link.

## Decision 3: Host Disconnect Handling
- **Decision**: The backend polling or a heartbeat mechanism must detect a disconnected host. Upon detection, if the game is in the `RESULT` state (or any state), the backend selects the next oldest player to become the host.
- **Rationale**: Complies with the clarification to transfer host privileges.
- **Alternatives considered**: Closing the room. Rejected per clarification decision.
