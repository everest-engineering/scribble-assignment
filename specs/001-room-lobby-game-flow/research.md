# Research: Room Lobby Game Flow

## Decision: Keep the in-memory, HTTP-polling multiplayer architecture

- The project already splits frontend and backend with TypeScript and Express/Vite.
- The feature spec explicitly excludes databases and WebSockets.
- Room state is modeled as an in-memory Map in `backend/src/services/roomStore.ts` and mirrored as transient frontend state during in-app navigation.

## Rationale

- In-memory rooms and session state minimize scope and fit the lab constraints.
- HTTP polling for lobby and gameplay sync avoids introducing real-time protocols.
- Normalizing room codes to uppercase, validating trimmed names and guesses, and preserving form state on join failure improves UX without adding backend complexity.

## Alternatives considered

- Full real-time sync with WebSocket-style events: rejected because the lab forbids WebSockets/Socket.io.
- Persistent room storage: rejected because the spec requires in-memory rooms only.
- Web storage session persistence: rejected because refresh should be treated as leaving the app and rejoining from scratch.

## Game lifecycle scope for this feature

- Implemented: room creation, join, automatic lobby polling, host-only start, deterministic drawer assignment, deterministic word selection, drawer-only word visibility, drawing, clear canvas, guesses, deterministic scoring, results, and host-only restart.
- Out of scope: multiple rounds, drawer rotation, timers, bonus scoring, authentication, persistent storage, databases, and WebSockets.
- The UI treats the game page as the single-round play surface and results screen.
