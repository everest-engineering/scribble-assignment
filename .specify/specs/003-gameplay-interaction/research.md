# Research: Gameplay Interaction

## Unknowns & Clarifications

- **Polling Frequency**: Determine optimal polling interval for perceived real-time canvas and scoreboard updates without overloading the server.
- **Canvas Interaction**: Research browser Canvas API implementation for real-time drawing and synchronization.
- **Drawing State**: Define how canvas drawing events are serialized and synced between drawer and guessers.

## Technology Best Practices

- **Canvas API**: Use `requestAnimationFrame` for smooth drawing updates.
- **Polling**: Implement exponential backoff for polling to manage server load gracefully.
- **State Synchronization**: Maintain a clean state object containing `canvasData`, `guessHistory`, and `scoreboard` for atomic synchronization.
- **Input Validation**: Use Zod schema validation on backend for all incoming guess submissions.

## Decisions

- **Decision**: Drawing events will be serialized as JSON strokes and sent via poll.
- **Rationale**: Keeps backend stateless, compatible with polling constraint, and avoids WebSockets.
- **Alternatives considered**: Canvas pixel data transfer (too high bandwidth), binary protocols (too complex for this stack).

- **Decision**: Polling interval will be set to 500ms for active rounds.
- **Rationale**: Provides responsive enough updates while staying within server resource limits.
- **Alternatives considered**: 100ms (too frequent), 2000ms (too sluggish).
