# Feature Specification: Game Start, Drawer Selection & Secret Word Reveal

**Feature Branch**: `002-game-start-word-reveal`

**Created**: 2026-06-08

**Status**: Draft

**Input**: User description: "Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## Clarifications

### Session 2026-06-08

- Q: How should the secret word be deterministically selected from the starter list? → A: Seed the selection by the room code and the round number, so a given room code (round 1) always yields the same word, reproducible and testable.
- Q: If the round-1 drawer (the host) leaves/disconnects right after the first round begins, what happens? → A: Close the room (consistent with the existing lobby rule); remaining players are ejected to the entry screen.
- Q: How strictly should the secret word be hidden from guessing players? → A: Withhold the actual word from guessers' data entirely — only the concealed (blanks) form is sent to guessers, so it cannot be recovered by inspecting received data.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First round begins with a clearly identified drawer (Priority: P1)

When the host starts the game from the lobby, the first round begins and one participant is designated as the drawer. Every player in the room can clearly see who the drawer is, so everyone understands their role for the round (one person draws, the others guess).

**Why this priority**: This is the transition from "waiting room" to "playing the game." Without a designated, clearly identified drawer, no round can take place. It is the foundational slice that turns a lobby into an actual game.

**Independent Test**: Can be fully tested by starting a game with at least 2 players and confirming that exactly one player is marked as the drawer, that the same drawer is shown consistently to every player, and that the round state has advanced from "lobby" to "round in progress."

**Acceptance Scenarios**:

1. **Given** a lobby with at least 2 players whose names are valid, **When** the host starts the game, **Then** the first round begins and the host (the first player) is designated as the drawer.
2. **Given** a round that has just begun, **When** any player views the game screen, **Then** they see a clear, unambiguous indication of which single player is the drawer.
3. **Given** a round that has just begun, **When** a non-drawing player views the game screen, **Then** they are identified as a guesser and the drawer is identified as the drawer for that same round.

---

### User Story 2 - Secret word is visible only to the drawer (Priority: P1)

Once the round begins, a secret word is chosen for the drawer to illustrate. The drawer can see the full secret word so they know what to draw, while all guessing players see only a concealed representation (not the word itself), preserving the challenge of the game.

**Why this priority**: A drawing-and-guessing game is meaningless if guessers can see the answer, or if the drawer doesn't know what to draw. Correct, role-based visibility of the secret word is the core mechanic that makes the round playable and fair.

**Independent Test**: Can be tested by starting a round and confirming the drawer's view contains the full secret word while every guesser's view contains only a concealed placeholder and never the actual word.

**Acceptance Scenarios**:

1. **Given** a round has begun, **When** the drawer views their screen, **Then** they see the full secret word for the round.
2. **Given** a round has begun, **When** a guessing player views their screen, **Then** they see a concealed representation of the word (e.g., a blank per letter) but never the word itself.
3. **Given** the same room and the same starting conditions, **When** the first round begins, **Then** the secret word selected from the starter list is the same every time (deterministic selection).

---

### User Story 3 - Player names are validated and normalized before play (Priority: P2)

Before a player participates in a game, their display name is trimmed of surrounding whitespace, and a name that is empty or consists only of whitespace is rejected with a clear message. This ensures every player in a round is identifiable by a meaningful name.

**Why this priority**: Clean, identifiable names matter for showing who the drawer is and who is guessing, but the core game-start and word-reveal mechanics (P1) can be demonstrated with already-valid names. This story hardens input quality.

**Independent Test**: Can be tested by attempting to enter names with leading/trailing whitespace (confirming they are trimmed) and names that are empty or whitespace-only (confirming they are rejected with a clear message and the player is not admitted with that name).

**Acceptance Scenarios**:

1. **Given** a player provides a name with leading or trailing whitespace, **When** the name is accepted, **Then** the stored and displayed name has the surrounding whitespace removed.
2. **Given** a player provides an empty name or a name containing only whitespace, **When** they attempt to proceed, **Then** they are rejected with a clear message that a non-empty name is required.
3. **Given** a game is about to start, **When** the round begins, **Then** every participating player has a valid, trimmed, non-empty name.

---

### Edge Cases

- **Drawer leaves immediately after the round begins**: Because the round-1 drawer is the host, the room is closed (consistent with the lobby host-departure rule) and remaining players are ejected to the entry screen; the system never presents an orphaned round with a missing drawer.
- **Internal spaces in names**: Only leading and trailing whitespace is trimmed; spaces inside a name (e.g., "Anna Lee") are preserved.
- **Names that become empty only after trimming**: A name like "   " (spaces only) is treated as empty and rejected.
- **Guesser attempts to read the word through any non-drawing view**: A guesser must never be able to obtain the actual secret word from their game view; only the concealed representation is available to them.
- **Word visibility for the drawer vs. guessers must stay consistent**: All guessers see the same concealed representation; the single drawer sees the full word.
- **Starting a game without enough valid players**: If fewer than the minimum players have valid names, the game does not start (consistent with the lobby's minimum-player rule).
- **Repeated game starts**: Given identical starting conditions, the deterministic selection yields a reproducible word, making the behavior testable and predictable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST transition a room from the lobby state to a "round in progress" state when the game is started, beginning the first round.
- **FR-002**: System MUST designate exactly one player as the drawer for the first round, and that player MUST be the host (the first player in the room).
- **FR-003**: System MUST clearly identify the current drawer to every player in the room, distinguishing the drawer from guessing players.
- **FR-004**: System MUST select a secret word for the round from a predefined starter list of words.
- **FR-005**: System MUST select the secret word deterministically by seeding the selection with the room code and the round number, such that a given room code at round 1 always produces the same word (reproducible and testable).
- **FR-006**: System MUST make the full secret word visible to the drawer.
- **FR-007**: System MUST NOT deliver the actual secret word to any guessing player's data; guessers MUST receive only a concealed representation of the word, so the word cannot be recovered by inspecting the data they receive.
- **FR-008**: System MUST present guessing players with a concealed representation that conveys the word's length (e.g., one blank per letter) without disclosing the letters.
- **FR-009**: System MUST trim leading and trailing whitespace from a player's display name while preserving internal spaces.
- **FR-010**: System MUST reject a player name that is empty or whitespace-only (after trimming) with a clear message indicating a non-empty name is required, and MUST NOT admit the player under that name.
- **FR-011**: System MUST ensure that every player participating when a round begins has a valid, trimmed, non-empty name.
- **FR-012**: System MUST keep drawer identity and word visibility consistent across all players' views for the same round (single drawer, identical concealed representation for all guessers).
- **FR-013**: System MUST close the room if the round-1 drawer (the host) leaves or disconnects after the first round begins, ejecting any remaining players to the entry screen (consistent with the existing lobby host-departure rule).

### Key Entities *(include if data involved)*

- **Game/Round**: Represents an active round within a room. Key attributes: round identity (e.g., round number), the designated drawer, the secret word for the round, and the round state (e.g., "in progress"). Relationship: belongs to one room; references one drawer (a player) and one secret word.
- **Player**: A participant in a room. Key attributes: trimmed display name, role for the current round (drawer or guesser), and host/first-player status. Relationship: one player per round is the drawer; the rest are guessers.
- **Secret Word**: The word the drawer must illustrate for the round. Key attributes: the word value (full, drawer-only) and a concealed representation (guesser-facing, conveying length only). Relationship: drawn deterministically from the starter word list.
- **Starter Word List**: A predefined collection of candidate words from which the round's secret word is deterministically selected.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When the host starts a game with enough valid players, the first round begins and a single drawer is identified within 2 seconds for all players.
- **SC-002**: In 100% of started rounds, exactly one player is shown as the drawer, and the same player is identified as the drawer across every participant's view.
- **SC-003**: In 100% of started rounds, no guessing player's received data contains the actual secret word; guessers obtain only the concealed representation (verifiable by inspecting what a guesser's client receives).
- **SC-004**: The drawer sees the full secret word in 100% of started rounds.
- **SC-005**: Given the same room code, the same round-1 secret word is selected on every game start (100% reproducible), verifiable by starting games in rooms with a fixed code.
- **SC-006**: 100% of player names are stored and displayed without leading or trailing whitespace, and 100% of empty or whitespace-only name submissions are rejected with a clear message.
- **SC-007**: A player can understand their role (drawer or guesser) and, if the drawer, what word to draw, within 5 seconds of the round beginning, without external explanation.

## Assumptions

- The host is the first player to join the room (per the existing Room & Lobby Management feature) and is therefore the drawer for the first round; "host" and "first player" refer to the same participant.
- The minimum number of players required to start a game (and thus a round) is inherited from the existing lobby rule (at least 2 players).
- Deterministic word selection is seeded by the room code and round number (not randomness), so the selected word is predictable and testable; the exact index-derivation function is an implementation detail.
- The concealed representation shown to guessers conveys the number of letters in the word (one blank per letter) and reveals nothing about the specific letters.
- Player-name validation and trimming may be enforced at entry (create/join) and re-affirmed at game start; by the time a round begins, all participants already hold valid names.
- This feature covers only the start of the game and the first round's drawer designation and word reveal. Subsequent rounds, drawer rotation, guessing/scoring, the drawing canvas itself, and round timers are out of scope here.
- Word visibility is enforced by withholding the actual word from guessers' data entirely: only the concealed (blanks) form is delivered to guessers, so the word cannot be obtained by inspecting what a guesser's client receives.
