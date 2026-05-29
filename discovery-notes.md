# Discovery Notes

## Incomplete Behaviors

1. The lobby only supports manual refresh, there is no automatic polling to keep participants in sync across tabs.
2. There is no host concept in the current room model, so the app cannot restrict game start to the room creator.
3. The game screen is scaffolded only, drawing, guess submission, scoring, and result handling are not implemented.
4. Room snapshots are not viewer-specific, so there is currently no way to show the secret word only to the drawer.
5. Restart flow is missing, once the user enters the game screen, there is no real round lifecycle to reset back to the lobby.

## Assumptions

1. The backend in-memory room store should remain the source of truth for room and game state, with the frontend using polling to stay updated.
2. A single-round implementation is sufficient because multiple rounds, drawer rotation, and timers are explicitly out of scope.
3. Validation and permission checks such as host-only start should be enforced on the backend, not only hidden in the UI.
