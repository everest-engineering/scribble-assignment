# Scenario 1 Discovery: Room Setup & Lobby

## Gaps (Incomplete Behaviors)

- No host identification in the room model or snapshots.
- No automatic lobby polling; the lobby currently refreshes only via manual action.
- No start-game restriction for host only or minimum player count.
- Room code validation is incomplete and does not reject empty/invalid input clearly.

## Assumptions

- The creator of a room is the host.
- Room codes are normalized to uppercase and trimmed.
- The lobby should refresh automatically every ~2 seconds.
- Room isolation must prevent one room from affecting another.
