# Feature Specification: Game Start & Drawer Flow

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "When the first round begins, the host becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## User Scenarios & Testing

### User Story 1 - Drawer assignment and identification (Priority: P1)

When the host starts the game, the host (first participant) is assigned as the drawer. All players can see who the drawer is.

**Why this priority**: Core flow — without a drawer, no drawing happens.

**Independent Test**: Can be tested by starting a game and verifying the drawer name is visible to all participants.

**Acceptance Scenarios**:

1. **Given** a room with 2+ players and the host starts the game, **When** the room transitions to "playing", **Then** the host is assigned as the drawer.
2. **Given** a game is in progress, **When** any participant views the game screen, **Then** they can see who the current drawer is.

---

### User Story 2 - Secret word assigned and selectively visible (Priority: P1)

A secret word is deterministically chosen from the starter list. Only the drawer sees the word; guessers see no word.

**Why this priority**: Core mechanic — the word is the puzzle.

**Independent Test**: Can be tested by opening two tabs (one drawer, one guesser) and confirming only the drawer sees the word.

**Acceptance Scenarios**:

1. **Given** a game has started, **When** the drawer views the game screen, **Then** the secret word is displayed to them.
2. **Given** a game has started, **When** a guesser views the game screen, **Then** the secret word is not visible to them.
3. **Given** a game starts, **When** the round begins, **Then** the secret word matches one of the starter words (rocket, pizza, castle, guitar, sunflower).

### Edge Cases

- What happens if a participant joins after the game started? — Not supported; joining is lobby-only.
- What if the host leaves after the game starts? — Out of scope (no disconnection tracking).
- What word is used for the first round? — Index 0 ("rocket"), deterministically selected.

## Requirements

### Functional Requirements

- **FR-001**: Backend MUST assign the host participant as the drawer when `startGame` is called.
- **FR-002**: Backend MUST select a secret word deterministically from the starter list when starting a game.
- **FR-003**: Backend MUST expose `drawerId` in the room snapshot so all players know who is drawing.
- **FR-004**: Backend MUST only include the `secretWord` in the snapshot when the requesting participant is the drawer.
- **FR-005**: Backend MUST track the current round number in the room state.
- **FR-006**: Frontend MUST display the drawer's name prominently on the game page.
- **FR-007**: Frontend MUST display the secret word to the drawer only.
- **FR-008**: Frontend MUST show a placeholder or "waiting for drawer" message to guessers.

### Key Entities

- **Room**: Now includes `drawerId`, `secretWord`, and `round`.
- **RoomSnapshot**: Now includes `drawerId`, `secretWord` (only for drawer), and `round`.

## Success Criteria

### Measurable Outcomes

- **SC-001**: After starting a game, all participants see the drawer's name in under 1 second.
- **SC-002**: The drawer sees the correct secret word immediately upon game start.
- **SC-003**: Guessers do not see the secret word at any point.

## Assumptions

- Drawer is always the host (first participant), since multiple rounds and drawer rotation are out of scope.
- Word selection uses `STARTER_WORDS[round - 1]` for deterministic selection.
- Only 1 round is played; round number starts at 1.
