# Research: Room Setup & Lobby

## HTTP Polling Implementation

- **Decision**: Use a simple React `useEffect` with `setInterval` to fetch the room state every 2 seconds on the frontend.
- **Rationale**: The project explicitly forbids WebSockets. HTTP polling is the only allowed method. A 2-second interval strikes a balance between perceived real-time responsiveness and server load.
- **Alternatives considered**: Long-polling (rejected as it holds connections open, adding complexity on the backend).

## In-Memory Room Storage & Cleanup

- **Decision**: Use a global `Map<string, Room>` on the backend to store active rooms. Implement a periodic cleanup interval (e.g., every 1 minute) that scans the map and deletes rooms where the last polling activity is older than 5 minutes.
- **Rationale**: Meets the strict "No databases" and "No Stateful Bloat" constraints while ensuring idle rooms do not leak memory.
- **Alternatives considered**: Explicit timeout for each room (rejected due to slightly more complex `setTimeout` management vs a single garbage collection loop).

## Room Code Generation

- **Decision**: Generate a random 6-character string using uppercase letters and numbers (e.g., `A1B2C3`), ensuring uniqueness by checking the `Map` before assigning.
- **Rationale**: As specified in the clarification phase, 6-character alphanumeric strikes a balance between security and user convenience.
- **Alternatives considered**: UUIDs (rejected, too long for users to type easily).
