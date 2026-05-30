# Research: Results, Restart, and Final Validation

## Decision: Restart clears round state in the same room

- The room code and participants are preserved.
- Round state is cleared completely.
- Players return to lobby by polling.

## Rationale

- Preserving players avoids unnecessary room recreation.
- Clearing round state matches the single-round scope.
- Polling keeps all clients synchronized without WebSockets.

## Alternatives Considered

- Creating a new room on restart: rejected as unnecessary complexity.
- Restarting immediately into another round: rejected because multiple rounds are out of scope.
- Non-host restart: rejected for consistency with host-only start.
