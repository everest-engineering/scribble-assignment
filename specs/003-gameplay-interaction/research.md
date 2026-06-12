# Research: Gameplay Interaction

## Decision

Use the existing backend and frontend architecture to extend room state for active-round gameplay. The implementation will remain in-memory, use HTTP polling for sync, and add just enough API contract support for guesses and round state refresh.

## Rationale

- The repository already uses a shared room snapshot model and polling for lobby updates.
- Adding a guess submission endpoint and extending the room snapshot keeps the feature aligned with the established architecture.
- Canvas updates should be modeled as serializable round state so the drawer can see immediate local changes without introducing WebSockets.
- Score logic is deterministic and fits naturally in the room service layer.

## Alternatives considered

- WebSocket-based real-time updates: rejected because the project constitution explicitly forbids WebSockets and real-time push.
- Client-only guess handling without backend validation: rejected because shared guess history and score sync require server-side state.
- A separate round-specific API namespace: rejected in favor of extending the existing `/rooms/:code` contract for consistency and room isolation.

## Outcome

The chosen design preserves the current web application structure, minimizes new surface area, and ensures that all active-round state remains isolated to the current room and viewer.
