# Specify Iteration 2: Game Start and Drawer Flow

## Requirement

When the host starts a valid lobby, the first round begins. The host is assigned as drawer, all players receive zero scores, and the secret word is visible only to the drawer.

## Acceptance Criteria

1. Starting from lobby changes room status from `lobby` to `playing`.
2. The drawer id is the host participant id.
3. The deterministic first word is `rocket`, selected from the starter word list.
4. Drawer snapshots include `secretWord`.
5. Guesser snapshots hide `secretWord` and expose only the word length.
6. Score entries exist for all participants and start at 0.

## Edge Cases

- Fetching the same room as drawer and guesser returns different word visibility.
- Starting an already-started room fails.
- Joining after the game has started fails with a clear message.
