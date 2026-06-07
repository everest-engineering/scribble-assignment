# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer-flow`

**Status**: Implemented

## Scenario

### F2.1 Start Game Transition
- `POST /rooms/:code/start` transitions room from `"lobby"` to `"playing"`.
- The first participant (by join order) is assigned as the drawer.
- A secret word is deterministically selected from `availableWords` (index-based).

### F2.2 Drawer Assignment
- The drawer is clearly identified on their own screen.
- Non-drawers are identified as guessers.

### F2.3 Word Visibility
- The secret word is visible ONLY to the drawer.
- Guessers see `"???"` or nothing in place of the word.

### F2.4 Player Name Validation
- Player names are trimmed on submission.
- Empty or whitespace-only names are rejected with a message.

## Acceptance Criteria
- [ ] Starting the game transitions room status and assigns a drawer.
- [ ] Drawer sees the secret word; guessers do not.
- [ ] First-joined participant is the drawer.
- [ ] Word is deterministic (same room always picks same word).

## Requirements

### Functional Requirements
- **FR-001**: System MUST provide `POST /rooms/:code/start` endpoint.
- **FR-002**: System MUST transition room status from `"lobby"` to `"playing"` on start.
- **FR-003**: System MUST assign the first participant (by join order) as the drawer.
- **FR-004**: System MUST select a word deterministically from sorted `availableWords`.
- **FR-005**: System MUST identify the drawer on their screen.
- **FR-006**: System MUST identify non-drawers as guessers.
- **FR-007**: System MUST show the secret word ONLY to the drawer.
- **FR-008**: System MUST hide the secret word from guessers (show null).

### Key Entities
- **Room**: Extended with `currentDrawerId`, `currentWord`, `status` (lobby/playing/roundEnd).
- **RoomSnapshot**: Extended with `currentDrawerId`, `currentWord` (null for guessers).

## Edge Cases
- Non-host cannot start the game.
- Game cannot be started from non-lobby status.
- At least 2 players required to start.
