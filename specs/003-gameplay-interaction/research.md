# Research: Gameplay Interaction

## Decision: Poll shared gameplay state over HTTP

- Drawing, guesses, and scores are held in the existing room state.
- Clients poll snapshots instead of using WebSockets.
- Correct guesses use fixed deterministic scoring.

## Rationale

- HTTP polling satisfies the lab constraints.
- Fixed scoring keeps gameplay predictable.
- Drawer-only drawing and guesser-only guesses keep roles clear.

## Alternatives Considered

- Real-time push: rejected because WebSockets are out of scope.
- Bonus scoring: rejected because timers and speed bonuses are out of scope.
- Client-only guess history: rejected because all players must see shared history.
