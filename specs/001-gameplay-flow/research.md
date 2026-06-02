# Research: Gameplay Flow Build-Out

## Decision: Polling-based synchronization

**Decision**: Use periodic HTTP polling from the frontend to refresh lobby and game state every 1.5–2 seconds.

**Rationale**: The existing starter app already uses a simple REST API and a room snapshot endpoint. The feature instructions explicitly forbid WebSockets, so polling is the cleanest compatible mechanism for keeping multiple browser tabs in sync.

**Alternatives considered**:
- WebSockets / Socket.IO: rejected because the project guidelines explicitly forbid real-time push protocols.
- Long polling: rejected because it adds unnecessary complexity for this small in-memory game.
- Local-only state refresh: rejected because this feature requires shared room state across separate browser tabs.

## Decision: Extend the existing backend and frontend surface

**Decision**: Keep the current `backend/src/services/roomStore.ts` and `frontend/src/state/roomStore.ts`, and extend them with game lifecycle state instead of replacing them.

**Rationale**: The starter already implements room creation, joining, and snapshot fetching. Extending existing domain models minimizes risk and preserves app behavior while enabling the new gameplay requirements.

**Alternatives considered**:
- Rewrite the room store from scratch: rejected to avoid unnecessary disruption and because the starter already provides correct baseline behavior.
- Add a separate game service: rejected since the game can live naturally as extended room state and new REST actions.

## Decision: Use explicit validation in both frontend and backend

**Decision**: Validate player names and room codes in the frontend before submission, and enforce the same rules in backend Zod schemas.

**Rationale**: Duplication ensures quick user feedback while preserving security and correctness at the API boundary. Existing backend schemas and frontend forms already provide a good foundation for expanding validation.

## Decision: Preserve in-memory storage and explicit state transitions

**Decision**: Maintain room state in memory and model room phases explicitly as `lobby`, `active`, and `results`.

**Rationale**: The repository rules forbid persisted storage and require simple in-memory state. Explicit lifecycle phases make it easier to enforce host-only start, guard guess submission, and reset rounds correctly.
