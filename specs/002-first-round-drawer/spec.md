# Feature Specification: First Round Drawer and Secret Word

**Feature Branch**: `002-first-round-drawer`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Valid Player Names Before Play (Priority: P1)

When the game is about to start, every participant’s display name is normalized and validated so that only meaningful names enter the first round.

**Why this priority**: Invalid names break trust in the scoreboard and drawer identification; validation must happen before roles and secret words are assigned.

**Independent Test**: Attempt to start or enter a game with blank or whitespace-only names; verify rejection messages and that no round begins until all active participants have valid trimmed names.

**Acceptance Scenarios**:

1. **Given** a participant name with leading or trailing spaces, **When** the game is starting, **Then** the name is stored and displayed without those outer spaces.
2. **Given** a participant name that is empty or only whitespace, **When** the game attempts to start or the name is submitted, **Then** the action is blocked and a clear message explains that a non-empty name is required.
3. **Given** all participants have valid trimmed names, **When** the host starts the game from the lobby, **Then** the transition to the first round proceeds without name-validation errors.

---

### User Story 2 - First-Round Drawer Is Clear to Everyone (Priority: P1)

When the first round begins, exactly one participant is the drawer and everyone can see who is drawing.

**Why this priority**: Guessers cannot play without knowing who is drawing; the drawer must know they are responsible for the canvas.

**Independent Test**: Start a two-player game from the lobby; confirm one participant is labeled as drawer for all viewers and that non-drawers are identified as guessers.

**Acceptance Scenarios**:

1. **Given** a game starting from the lobby with at least two valid participants, **When** the first round begins, **Then** exactly one participant is assigned the drawer role for that round.
2. **Given** the host is present in the room, **When** the first round begins, **Then** the host is the drawer for round one.
3. **Given** no host is designated but participants exist (edge policy), **When** the first round begins, **Then** the participant who joined first becomes the drawer.
4. **Given** the first round is active, **When** any participant views the game screen, **Then** the drawer is clearly identified (e.g., labeled as drawing) and is distinguishable from guessers.

---

### User Story 3 - Secret Word for the Drawer Only (Priority: P1)

When the first round begins, the drawer receives the round’s secret word chosen in a predictable way from the game’s starter word list; guessers must not see it.

**Why this priority**: The core guessing mechanic depends on a hidden word known only to the person drawing.

**Independent Test**: Start a first round with two clients; the drawer’s view shows the secret word, the guesser’s view does not, and repeating the same start conditions yields the same word.

**Acceptance Scenarios**:

1. **Given** the first round is beginning, **When** the secret word is chosen, **Then** it is one of the words from the fixed starter list bundled with the game (e.g., common nouns such as objects and food items).
2. **Given** the same room and first-round start conditions, **When** the word is selected multiple times (e.g., after a controlled restart test), **Then** the same secret word is chosen every time (deterministic selection).
3. **Given** a participant is the drawer for round one, **When** they view the game during the drawing phase, **Then** they can see the secret word clearly.
4. **Given** a participant is a guesser for round one, **When** they view the game during the drawing phase, **Then** they cannot see the secret word anywhere in the interface.
5. **Given** round one has not been revealed to guessers, **When** guessers interact with the game screen, **Then** they see only non-revealing prompts (e.g., waiting for the drawer or submit-guess affordances), not the answer.

---

### Edge Cases

- What happens when a name becomes invalid only after trimming during game start? Start is blocked for that participant until they provide a valid name; other players see an appropriate waiting or error state.
- What happens if the host leaves after start was initiated but before round one is visible? Drawer assignment for round one already made remains with the designated drawer participant identity; host-only actions are unaffected for guessers (out of scope for host transfer).
- What happens when the starter word list has only one entry? That word is always selected for round one (deterministic degenerate case).
- What happens if two participants share the same display name after trimming? Roles still differ by drawer vs guesser; names may duplicate visually but internal identities remain distinct.
- What happens when a guesser refreshes during round one? They resume as a guesser and still must not see the secret word.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST trim leading and trailing whitespace from participant display names when validating names for game start and when persisting names for active play.
- **FR-002**: The system MUST reject empty or whitespace-only display names with a clear, user-readable message.
- **FR-003**: The system MUST prevent the first round from beginning until every participant who will be in the round has a valid trimmed name.
- **FR-004**: When the host starts the game from the lobby, the system MUST transition the room from waiting to the first active drawing round.
- **FR-005**: For round one, the system MUST assign exactly one drawer and all other active participants as guessers.
- **FR-006**: For round one, the system MUST assign the host as the drawer when a host is designated for the room.
- **FR-007**: When no host is designated, the system MUST assign the drawer role for round one to the participant who joined the room first.
- **FR-008**: The system MUST make the drawer identity visible to all participants during round one.
- **FR-009**: The system MUST select the round-one secret word deterministically from the game’s fixed starter word list (the same inputs MUST always produce the same word).
- **FR-010**: The system MUST expose the secret word only to the participant in the drawer role during round one.
- **FR-011**: The system MUST NOT expose the secret word to guessers during round one through the standard game interface.
- **FR-012**: The system MUST keep guessers informed that they are waiting to guess or can submit guesses without revealing the secret word.

### Key Entities

- **Round**: A single drawing-and-guessing cycle; round one is the first cycle after the lobby start.
- **Drawer**: The participant who draws and receives the secret word for that round.
- **Guesser**: Any active participant who is not the drawer for the current round.
- **Secret word**: The target word the drawer must illustrate, chosen from the starter word list.
- **Starter word list**: A fixed, bundled set of allowed secret words used for deterministic selection in early rounds.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In test scenarios, 100% of whitespace-only or empty names submitted at game start are rejected with an explicit error message.
- **SC-002**: In test scenarios, 100% of names with outer whitespace are stored and shown without that whitespace after validation.
- **SC-003**: When a host starts a valid multi-player game, all participants reach the first-round game view within 30 seconds under normal conditions.
- **SC-004**: In two-client tests of round one, 100% of guesser sessions show no secret word while 100% of drawer sessions show the same assigned word.
- **SC-005**: Repeating first-round start under identical room conditions yields the same secret word in 100% of trials (determinism check).
- **SC-006**: In structured observation, 100% of participants can correctly identify who is the drawer within 5 seconds of entering round one.

## Assumptions

- Lobby create/join, host-only start, and minimum player count are handled by the room feature; this feature begins when the host successfully starts the game.
- The starter word list is a fixed set shipped with the game (five common single-word prompts); expanding or editing the list is out of scope unless separately specified.
- Deterministic selection depends only on stable room and round context defined by the product (e.g., room identity and round index), not on clocks or random numbers.
- Round-one scope covers assignment and visibility at round start; scoring, guessing, canvas sync, and round end belong to follow-on features.
- “Clearly-identified drawer” means all participants see who is drawing via labels or role indicators, not merely inferring from canvas activity.
- If the host and “first player” differ in edge cases, host takes precedence for round-one drawer per the user description.
