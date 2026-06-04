# Scenario Specification: Result, Restart & Final Validation

**Parent Feature**: [001-scribble-game](../001-scribble-game/spec.md)

**Priority**: P4

**Status**: Draft

**Depends on**: [003-gameplay-interaction](../003-gameplay-interaction/spec.md)

## User Story

Once a correct guess is made, the game moves to `"result"` status. Everyone sees the secret word, final scores, and complete guess history. The host can restart, returning everyone to the lobby while preserving players and resetting round state.

**Why this priority**: Resolves the round and enables replay without re-creating the room.

**Independent Test**: Submit a correct guess, verify both players see the revealed word and scores; host clicks "Restart" and both return to lobby with players preserved.

## Acceptance Scenarios

1. **Given** the game is in `"result"` status, **When** players view the screen, **Then** the secret word is revealed to all and the scoreboard shows final scores.
2. **Given** the game is in `"result"` status, **When** the host clicks "Restart Game", **Then** status returns to `"lobby"`, scores/guesses/canvas clear, and players are preserved.
3. **Given** the host restarts, **When** guessers poll status, **Then** they redirect back to `/lobby`.

## Functional Requirements

- **FR-008**: Backend MUST reveal `secretWord` to all participants when status is `"result"`.
- **FR-011**: Backend MUST support host-only `POST /rooms/:code/restart`, resetting to `"lobby"` while preserving `participants` and clearing scores, guesses, and canvas.
- **FR-005**: Frontend MUST restrict "Restart Game" to the host.
- **FR-012**: Frontend MUST redirect game → lobby when status becomes `"lobby"`.

## Edge Cases

- Non-host cannot restart.
- Restart clears round state but not participant list or `hostId`.

## Success Criteria

- **SC-004**: Non-host players cannot restart the game.
- Full round lifecycle (lobby → playing → result → lobby) completes in one session.

## Related Artifacts

- API: [Restart, Fetch Snapshot](../001-scribble-game/contracts/api.md)
- Data model: [Room status `result` → `lobby`](../001-scribble-game/contracts/data-model.md)
