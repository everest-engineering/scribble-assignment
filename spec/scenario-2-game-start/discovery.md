# Scenario 2 Discovery: Game Start & Drawer Flow

## Gaps (Incomplete Behaviors)

- No backend route exists to transition a room from `"lobby"` to `"game"`.
- There is no logic to assign a drawer when the game starts.
- There is no deterministic secret word selection.
- `secretWord` is not masked from non-drawers in room snapshots.

## Assumptions

- The host becomes the initial drawer for the first round.
- Secret words are selected deterministically from the starter word list.
- The drawer must see the secret word, while guessers must not.
- Game start requires at least 2 players in the room.
