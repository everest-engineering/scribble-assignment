# Research: Gameplay Interaction

## Decision: Polling Interval & Strategy
- **Decision**: 1000ms polling interval for game state (drawing data and guesses).
- **Rationale**: Meets the constraints of the Constitution (No WebSockets) while providing a reasonably responsive drawing and guessing experience. 
- **Alternatives considered**: 500ms (higher server load), 2000ms (too laggy for drawing).

## Decision: In-Memory Game State
- **Decision**: Store all room state (guesses, canvas actions, player scores, drawer timeout) in the existing memory structures.
- **Rationale**: Mandated by the Constitution (No Databases).
- **Alternatives considered**: None (strictly forbidden by Constitution).

## Decision: Drawer Timeout
- **Decision**: Implement a last-polled timestamp for players. If the current drawer's `lastPolledAt` is older than 10 seconds, end the round.
- **Rationale**: Fulfills the edge case requirement specified in `spec.md` to cleanly end the round if the drawer drops offline.
