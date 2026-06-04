# Scenario Specification: Game Start & Drawer Flow

**Parent Feature**: [001-scribble-game](../001-scribble-game/spec.md)

**Priority**: P2

**Status**: Draft

**Depends on**: [001-room-setup-lobby](../001-room-setup-lobby/spec.md)

## User Story

When the host starts the game, the room status transitions to `"playing"`. The host is the drawer. A secret word is deterministically selected from `["rocket", "pizza", "castle", "guitar", "sunflower"]`. The secret word is visible only to the drawer; other players are guessers.

**Why this priority**: Establishes roles and secret word state before drawing and guessing.

**Independent Test**: Start a game with 2 players; verify the drawer sees the secret word and the guesser sees the guess form with the word hidden.

## Acceptance Scenarios

1. **Given** at least 2 players are in the lobby, **When** the host clicks "Start Game", **Then** the room status updates to `"playing"`.
2. **Given** the game starts, **When** the round begins, **Then** the host becomes the drawer and guessers redirect to `/game` via polling.
3. **Given** the game is active, **When** the drawer views their screen, **Then** they see the secret word.
4. **Given** the game is active, **When** a guesser views their screen, **Then** the secret word is hidden (`null` in API snapshot) and they see the canvas and guess form.

## Functional Requirements

- **FR-007**: Backend MUST transition to `playing`, assign `drawerId` to the host, and pick the secret word via `sum(ASCII(code)) % starterWords.length`.
- **FR-008**: Backend MUST hide `secretWord` from guessers in the room snapshot.
- **FR-005**: Only the host may trigger start (enforced on frontend and backend).
- **FR-012**: Frontend MUST redirect lobby → `/game` when status becomes `"playing"`.

## Edge Cases

- Non-host attempts to start (must fail).
- Start with fewer than 2 players (button disabled / request rejected).
- `viewerRole` must be `"drawer"` or `"guesser"` in snapshots.

## Success Criteria

- **SC-004**: Non-host players cannot start the game.
- Drawer sees word; guesser snapshot has `secretWord: null`.

## Related Artifacts

- API: [Start Game, Fetch Snapshot](../001-scribble-game/contracts/api.md)
- Data model: [Room status transitions](../001-scribble-game/contracts/data-model.md)
