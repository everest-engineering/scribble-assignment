# Research: Result & Restart

**Branch**: `004-result-restart` | **Date**: 2026-05-31

## Context

The feature involves transitioning a game room from the `playing` state to a `results` state, and finally back to a clean `lobby` state. The technical constraints dictate an in-memory state on the backend and HTTP polling for updates. No WebSockets or persistent databases are used.

There were no critical unknowns (`NEEDS CLARIFICATION`) remaining in the Technical Context during planning, as the `speckit-clarify` phase successfully resolved all ambiguities.

## Findings & Decisions

### Decision 1: Room State Transitions
- **Decision**: Introduce a `results` phase to the existing room state machine (`lobby` -> `playing` -> `results` -> `lobby`).
- **Rationale**: Keeps the state machine linear and predictable. The frontend can use this phase property to conditionally render the result screen vs. the drawing canvas vs. the waiting lobby.
- **Alternatives considered**: Storing an `isRoundOver` boolean alongside the `playing` state. Rejected because a distinct phase maps better to React Router or top-level component conditional rendering.

### Decision 2: Storing the Final Canvas
- **Decision**: The backend will retain the final array of drawing strokes (the canvas state) when transitioning to the `results` phase, instead of clearing it immediately.
- **Rationale**: The specification requires displaying a snapshot of the final completed drawing on the result screen (FR-008). By preserving the drawing strokes in memory during the `results` phase, the frontend can render the final image exactly as it was drawn.
- **Alternatives considered**: Having the frontend snapshot the canvas to an image and upload it. Rejected due to unnecessary complexity and payload size compared to just reusing the existing stroke data array.

### Decision 3: Host Disconnect Handling
- **Decision**: Upon a host disconnecting during the `results` phase (or any phase), the backend will automatically assign the host role to the next oldest player in the room's player array.
- **Rationale**: Aligns with the clarified edge-case requirement. Ensures the room is not deadlocked if the host drops before returning everyone to the lobby.

### Decision 4: Score Reset
- **Decision**: The backend service handling the transition from `results` back to `lobby` will iterate through all active players in the room and explicitly reset their `score` properties to `0`.
- **Rationale**: Fulfills FR-006 to completely reset game data and scores for a fresh start when returning to the lobby.
