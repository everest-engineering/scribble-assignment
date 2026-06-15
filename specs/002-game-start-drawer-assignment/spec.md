# Feature Specification: Game Start, Drawer Assignment & Secret Word Visibility

**Feature Branch**: `002-game-start-drawer-assignment`

**Created**: 2026-06-15

**Status**: Implemented

**Parent Feature**: `001-scribble-gameplay`

**Input**: Scenario 2 from Scribble lab business requirements – drawer role assignment and secret word visibility rules.

## User Scenarios & Testing *(mandatory)*

### User Story 2 - Game start, drawer assignment, and secret word visibility (Priority: P1)

The game must begin with a single drawer, a deterministic word choice, and role-specific visibility.

**Why this priority**: The first round's role assignment and secret word visibility define the core gameplay experience and prevent confusion.

**Independent Test**: Start a room with two valid players, verify the drawer is assigned clearly, and confirm only the drawer sees the secret word.

**Acceptance Scenarios**:

1. **Given** the host starts the game with at least two players and both names are valid, **When** the game begins, **Then** the host or the first joined player is assigned as the drawer and the drawer sees a secret word.
2. **Given** a player enters a name that is empty or only whitespace, **When** they submit the name, **Then** the system rejects it and shows a validation error.
3. **Given** the game has started, **When** a guesser views their screen, **Then** the secret word remains hidden from them.
4. **Given** the game begins, **When** the system selects the secret word, **Then** it is chosen deterministically from the starter list provided by the repository.

---

## Acceptance Criteria Mapping

| Scenario | Implementation | Validation |
|----------|---|---|
| Drawer assignment | Host/first participant assigned drawer; drawer sees secret word in UI | Verify role indicator in GamePage; secret word displayed only to drawer |
| Name validation | Frontend validates non-empty, non-whitespace names on form submit | GuessForm/CreateRoomPage reject empty names with error message |
| Secret word visibility | RoomSnapshot reveals secretWord only to drawer, hidden from all guessers | Check api.ts and toRoomSnapshot() – secretWord field conditional |
| Deterministic selection | Hash-based modulo word selection from starterData array | Verify roomStore.ts line implementing wordIndex = hash(code) % words.length |

---

## Edge Cases & Error Handling

- **Empty name submitted**: Reject with message "Please enter your name".
- **Whitespace-only name**: Trim and reject if empty after trim with message "Please enter your name".
- **Game start with one player**: Reject with message "At least 2 players required to start".
- **Secret word out of bounds**: Verify hash-based selection always yields valid array index.
