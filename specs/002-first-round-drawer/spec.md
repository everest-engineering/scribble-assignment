---
description: "Feature specification: First Round — Drawer Assignment and Secret Word"
---

# Feature Specification: First Round — Drawer Assignment and Secret Word

**Feature Branch**: `scribble-lab`

**Created**: 2026-06-02

**Status**: Draft

**Input**: User description: "Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Drawer Is Identified on the Game Screen (Priority: P1)

When the game transitions from lobby to active, the host is designated as the drawer for the first round. Every participant on the game screen can see clearly who is drawing — their own name if they are the drawer, or the other player's name if they are a guesser.

**Why this priority**: Without knowing who is drawing, the game is unplayable. This is the foundational game-state signal that all other round behaviour depends on.

**Independent Test**: With 2 players in a room, host starts the game — the game screen for both players clearly identifies the host as the drawer, and the non-host player is shown as a guesser. No manual refresh or interaction required.

**Acceptance Scenarios**:

1. **Given** a room with ≥2 players where the host has just started the game, **When** the game screen loads for any participant, **Then** the host's name is labelled as the drawer and all other participants are labelled as guessers.

2. **Given** a non-host player on the game screen, **When** they view the player list, **Then** they see the host marked as "drawing" (or equivalent visual indicator) and their own role as "guessing".

3. **Given** the host on their own game screen, **When** they view their player info, **Then** they see themselves labelled as the drawer.

---

### User Story 2 — Secret Word Is Visible Exclusively to the Drawer (Priority: P1)

The game screen shows the secret word only to the player who is the drawer. Every other player sees a visual indicator that a word has been selected (e.g. hidden blanks or a "word chosen" message) but cannot read the actual word.

**Why this priority**: The core mechanic of Scribble depends on the drawer knowing the word and guessers not knowing it. Without this privacy, the game has no challenge.

**Independent Test**: With 2 players (host = drawer, second player = guesser), start the game — the drawer's screen shows the secret word text in full; the guesser's screen shows that a word has been chosen but does not display the word.

**Acceptance Scenarios**:

1. **Given** the host (drawer) on the game screen, **When** the round begins, **Then** the full secret word text is displayed on their screen.

2. **Given** a non-host player (guesser) on the game screen, **When** the round begins, **Then** the word text is not shown; only an indication that a word has been selected is visible (e.g. blank tiles or a placeholder message).

3. **Given** a secret word is selected, **When** the same game is started again from the same room state, **Then** the same word is selected (deterministic, not random per refresh).

---

### Edge Cases

- What happens if the host refreshes the game page mid-round? — Session persistence (from feature 001) restores their participant identity; they should still see the secret word and be identified as the drawer.
- What if only the minimum 2 players are present? — The host is the drawer; the single other player is the guesser. No change to behaviour.
- What if the word list has only one word? — That word is selected; no error condition.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a room transitions to `active` status, the host MUST be designated as the drawer for the first round.
- **FR-002**: All participants on the game screen MUST be able to identify which participant is the drawer and which are guessers.
- **FR-003**: The secret word MUST be deterministically selected as the first word from the starter seed list (no random selection).
- **FR-004**: The secret word MUST be displayed in full only on the drawer's game screen.
- **FR-005**: The secret word MUST NOT be displayed on any guesser's game screen; guessers MUST see only a non-revealing indicator that a word has been chosen.
- **FR-006**: The game screen MUST reflect drawer identity and word visibility immediately when the round begins, without requiring any additional interaction.

### Key Entities

- **Round**: The active period of play within a room. Has one designated drawer (the host), one secret word, and one or more guessers. Scoped to a single game session (no multi-round rotation).
- **DrawerAssignment**: The binding of a participant to the drawer role for the first round. Determined by host identity established in feature 001.
- **SecretWord**: A single word taken from the starter seed list. Deterministically chosen (first word in list). Visible only to the drawer participant.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of game sessions correctly display the host as the labelled drawer on all participants' game screens within 1 second of the game becoming active.
- **SC-002**: The secret word is visible in full on the drawer's screen for 100% of game sessions.
- **SC-003**: The secret word text is never shown on any guesser's screen in 100% of game sessions.
- **SC-004**: The same secret word is selected every time the first round begins (deterministic — identical word for identical room state, no random variance per page load or refresh).
- **SC-005**: A participant who refreshes the game page mid-round continues to see the correct role (drawer or guesser) and correct word visibility without any additional action.

## Assumptions

- Feature 001 (Room Setup & Lobby) is complete. The game is guaranteed to have ≥2 players and a designated host before reaching this feature's scope.
- "Host" and "first player" are the same participant — the one whose `participantId` matches `room.hostId`, established when the room was created.
- "Deterministically selected" means the first word in the static starter seed list (`STARTER_WORDS[0]`). There is no runtime randomness, no word rotation, and no per-game customisation.
- Player name trimming and empty-name rejection are enforced at join/create time (feature 001). This feature does not re-validate names.
- Drawer rotation across multiple rounds is explicitly out of scope (constitution §IV Scope Discipline).
- Guessing, scoring, drawing canvas interaction, and timers are out of scope for this feature.
- All players navigate to the game screen automatically when `room.status` becomes `"active"` (handled by feature 001 lobby polling).
