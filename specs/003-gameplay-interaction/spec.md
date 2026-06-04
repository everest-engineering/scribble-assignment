# Scenario Specification: Gameplay Interaction

**Parent Feature**: [001-scribble-game](../001-scribble-game/spec.md)

**Priority**: P3

**Status**: Draft

**Depends on**: [002-game-start-drawer](../002-game-start-drawer/spec.md)

## User Story

The drawer paints on the canvas; strokes sync to guessers via 2s polling. Guessers submit guesses validated by the backend. Correct guesses earn 100 points; incorrect earn 0. Guess history syncs to all players. A correct guess ends the round (`"result"` status).

**Why this priority**: Core gameplay loop for drawing, syncing, guessing, and scoring.

**Independent Test**: Drawer paints a stroke and verify it appears on the guesser canvas after poll; submit a correct guess and verify 100 points and `"result"` status.

## Acceptance Scenarios

1. **Given** a round is active, **When** the drawer paints, **Then** the drawing renders locally and is saved to the backend.
2. **Given** a round is active, **When** the drawer clicks "Clear Canvas", **Then** the canvas clears locally and on the backend.
3. **Given** a round is active, **When** guessers poll, **Then** the latest drawing updates on their canvas.
4. **Given** a round is active, **When** guessers submit guesses, **Then** empty guesses are rejected; non-empty guesses are trimmed and compared case-insensitively to the secret word.
5. **Given** a guess is incorrect, **When** it is submitted, **Then** it is added to the guess list, synced to all players, and scores 0.
6. **Given** a guess is correct, **When** it is submitted, **Then** it scores 100, syncs to all players, and the room status becomes `"result"`.

## Functional Requirements

- **FR-009**: Backend MUST support `POST /rooms/:code/draw` and `POST /rooms/:code/guess`.
- **FR-010**: Backend MUST award 100 points for correct guesses and transition status to `"result"` immediately.
- **FR-004**: Frontend MUST poll every 2 seconds on the game page for canvas and guesses.

## Edge Cases

- Empty or whitespace-only guesses rejected.
- Case-insensitive guess matching.
- Drawing/guessing in one room must not affect other rooms.
- Only guessers (not drawer) submit guesses.

## Success Criteria

- **SC-002**: Drawings appear on guesser screens within 2.5 seconds of drawer painting.
- **SC-003**: 100% of empty or whitespace guesses are rejected.

## Related Artifacts

- API: [Draw, Guess, Fetch Snapshot](../001-scribble-game/contracts/api.md)
- Data model: [Line, Guess](../001-scribble-game/contracts/data-model.md)
