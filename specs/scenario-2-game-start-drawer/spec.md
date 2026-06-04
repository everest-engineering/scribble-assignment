# Feature Specification: Scenario 2 — Game Start & Drawer Flow

**Created**: 2026-06-04
**Status**: Draft

## User Scenarios & Testing

### User Story 1 — Host Starts the Game (Priority: P1)

The host initiates the game from the lobby. The system assigns a drawer deterministically using the room code, selects a secret word, and transitions all players to the game view.

**Why this priority**: Foundational for all gameplay — no drawing, guessing, or scoring can happen without a started game.

**Independent Test**: Host clicks Start Game with 2+ players present. Both players see the game page. One player is clearly identified as the drawer. The drawer sees the secret word; guessers do not.

**Acceptance Scenarios**:

1. **Given** a lobby with 2+ players, **When** the host clicks "Start Game", **Then** the game status changes to "playing" and all players are redirected to the game page.

2. **Given** a game has started, **When** a player views the game page, **Then** exactly one participant has `drawerId` matching their participant ID and that player sees the secret word.

3. **Given** a game has started, **When** a non-drawer player views the game page, **Then** they see `secretWord: null` and their role is displayed as "Guesser".

4. **Given** the same room code, **When** the game starts multiple times, **Then** the same drawer and word are always selected (deterministic behavior).

---

### Edge Cases

- What happens when the host tries to start with only 1 player? — API returns 400 "At least 2 players are required to start".
- What happens when a non-host tries to start? — API returns 403 "Only the host can start the game".
- What happens when the game starts and the drawer leaves? — Drawer remains assigned; room state is unchanged until restart.

## Requirements

### Functional Requirements

- **FR-001**: Host MUST be the only participant who can start the game.
- **FR-002**: Game start MUST require at least 2 participants.
- **FR-003**: Drawer assignment MUST be deterministic — based on the room code, not random.
- **FR-004**: Secret word selection MUST be deterministic — based on the room code, not random.
- **FR-005**: Secret word MUST come from the starter word list.
- **FR-006**: Secret word MUST be `null` in snapshots for non-drawer viewers while game is playing.

### Key Entities

- **Room**: Contains `drawerId`, `secretWord`, `status`, `round`.
- **RoomSnapshot**: Client projection — `secretWord` masked for non-drawers.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Game starts in under 500ms from host clicking the button.
- **SC-002**: Drawer receives the secret word immediately on game start.
- **SC-003**: Guessers never see the secret word in any API response.
