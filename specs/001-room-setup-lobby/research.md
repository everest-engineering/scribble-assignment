# Research: Room Setup & Lobby

## Decision

Implement the room setup and lobby feature using the existing Express backend and React frontend. Room state will remain in-memory, with room codes used as the isolation boundary. Lobby state will refresh via periodic polling from the frontend to the backend.

## Rationale

- The repository already separates backend and frontend code, so extending both in their existing folders keeps the feature minimal and consistent.
- HTTP polling is required by the project constitution, making it the correct approach for lobby refresh.
- In-memory room storage is already present in `backend/src/services/roomStore.ts`, so reuse avoids introducing new persistence mechanisms.
- The frontend already has a room session store and a lobby page, so the feature can be implemented by extending those existing flows rather than introducing a new architecture.

## Alternatives Considered

- WebSockets or Socket.io: rejected because the constitution explicitly forbids push-based sync.
- Persistent storage or database: rejected because the feature must remain in-memory only.
- Using browser session storage to track host identity: not necessary, since the current session flow can retain participantId and room snapshot in the client-side store.

## Outcome

Proceed with a plan that updates the backend API for join and room lookup, extends the frontend room store for session and snapshot polling, and adds lobby host/start controls with validation on room code and player count.
