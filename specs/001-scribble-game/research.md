# Research & Design Decisions: Scribble Multiplayer Drawing Game

## 1. API Suffix Bug decision
- **Decision**: Remove the `/bug` suffix from `API_BASE_URL` in `frontend/src/services/api.ts` to allow requests to route directly to `http://localhost:3001/rooms`.
- **Rationale**: The backend server registers routes at `/rooms`, not `/bug/rooms`.
- **Alternatives considered**: Mounting the API routes under `/bug` on the backend, which was rejected because it deviates from standard REST patterns.

## 2. Canvas Drawing Representation
- **Decision**: Store canvas drawing as a JSON-serialized array of vector lines. A line is defined as:
  ```typescript
  export interface Line {
    color: string;
    width: number;
    points: { x: number; y: number }[];
  }
  ```
- **Rationale**: Serialized lines are lightweight (typically <5KB per drawing), scale natively to high-DPI screens, respond cleanly to resize, and avoid heavy image upload payloads over polling.
- **Alternatives considered**: Base64-encoded PNG image URL. Rejected due to large payload size (~100-300KB per draw stroke) causing latency over HTTP polling.

## 3. Client Synchronization (HTTP Polling)
- **Decision**: Use `setInterval` with a 2000ms interval on the frontend pages (`LobbyPage.tsx` and `GamePage.tsx`) to pull the snapshot.
- **Rationale**: Complies with the absolute constraint of no WebSockets. 2 seconds balances server load and synchronization speed.
- **Alternatives considered**: 1-second polling. Rejected because it doubles request load on the in-memory backend without material UX improvements.

## 4. End-of-Round Trigger
- **Decision**: The round ends immediately when any guesser submits a correct guess. The backend sets the room status to `"result"`, which is naturally picked up by the next client poll.
- **Rationale**: Fits standard draw-and-guess paradigms without requiring complex timer logic.
