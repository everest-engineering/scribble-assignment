# Research: Room Setup & Lobby

## Decision 1: Polling Management
**Decision**: Use `setInterval` within the frontend `RoomStore` to manage the 2-second polling lifecycle.

**Rationale**: Centralizing the polling logic in the store ensures that state updates are handled consistently across all components. The `LobbyPage` will trigger `startPolling` on mount and `stopPolling` on unmount.

**Alternatives considered**: 
- Component-level `useEffect` polling: Rejected as it fragments state management and makes it harder to maintain a single source of truth.

---

## Decision 2: Host Tracking & Disconnection
**Decision**: Store `hostId` in the `Room` entity on the backend. If the host's `participantId` is removed from the `participants` list, the room will be immediately closed (deleted).

**Rationale**: This aligns with the "Functional Minimalism" and "Simplicity & Scope Discipline" principles. If the host (creator) leaves, the room is no longer valid for starting a game.

---

## Decision 3: Name Uniqueness
**Decision**: Enforce unique player names within a single room during the `joinRoom` service call.

**Rationale**: Prevents confusion in the UI and simplifies player identification without requiring complex ID-based display logic.

---

## Decision 4: Room Capacity Enforcement
**Decision**: Add a capacity check (max 8) in the `joinRoom` service and return a `400 Bad Request` with a clear message if full.

**Rationale**: Ensures the system remains within its defined performance and UI constraints.
