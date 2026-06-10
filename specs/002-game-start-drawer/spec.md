# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer`

**Created**: 2026-06-09

**Status**: Draft

**Input**: User description: "Game Start & Drawer Flow — Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Host Starts the Game (Priority: P1)

The host is in the lobby with at least 2 players. They click Start. The round begins: the host
(first player who created the room) is assigned the drawer role, and the first word from the
starter word list is selected as the secret word. All players transition to the game screen.

**Why this priority**: Without a game start and role assignment, no other game behavior is
possible. This is the entry point to gameplay.

**Independent Test**: Host creates a room, a second player joins. Host clicks Start. Both
players land on the game screen. The host/drawer can see the secret word. The guest/guesser
cannot see the secret word.

**Acceptance Scenarios**:

1. **Given** ≥2 players are in the lobby and the host clicks Start, **When** the game begins,
   **Then** the host is assigned the `drawer` role for this round.
2. **Given** the game has started, **When** the drawer's screen loads, **Then** the secret word
   is displayed prominently to the drawer only.
3. **Given** the game has started, **When** a guesser's screen loads, **Then** no secret word
   is visible — only a placeholder such as "You are guessing!" is shown.
4. **Given** the game has started, **When** any player views the game screen, **Then** their
   current role (Drawer or Guesser) is clearly shown.

---

### User Story 2 — Deterministic Word Selection (Priority: P1)

The secret word for the first round is deterministically selected from the starter word list
(rocket, pizza, castle, guitar, sunflower). Deterministic means the same room always picks the
same word given the same conditions, so the outcome is predictable and testable.

**Why this priority**: The spec requires deterministic word selection — this is directly testable
and forms the foundation for scoring in Feature Group 3.

**Independent Test**: Create two rooms and start both. Confirm both receive the same first word
(index 0 from the word list), confirming determinism rather than randomness.

**Acceptance Scenarios**:

1. **Given** a game starts for the first time, **When** the word is selected, **Then** the word
   is always the first word in the starter list ("rocket").
2. **Given** the word is selected, **When** a second game is started in a different room, **Then**
   the same word is selected (deterministic, not random).

---

### User Story 3 — Role Identity on Game Screen (Priority: P2)

Every player on the game screen can clearly see their assigned role (Drawer or Guesser). The
drawer's view differs from the guesser's view in a meaningful way.

**Why this priority**: Players must know their role to participate correctly. A drawer who
doesn't know they are drawing, or a guesser who can see the word, breaks the game.

**Independent Test**: With two players in a started game, verify: (a) the player marked as
drawer sees a "You are drawing" indicator and the secret word; (b) the other player sees a
"You are guessing" indicator and no secret word.

**Acceptance Scenarios**:

1. **Given** a player is the drawer, **When** they view the game screen, **Then** their role
   badge reads "Drawer" and the secret word is visible to them.
2. **Given** a player is a guesser, **When** they view the game screen, **Then** their role
   badge reads "Guesser" and no secret word is shown.
3. **Given** any player views the game screen, **When** they check the participant list or
   scoreboard area, **Then** the drawer is clearly marked (e.g., with a "Drawing" label).

---

### Edge Cases

- What if the host refreshes the page after game start? → Out of scope; no session persistence.
- What if two games start simultaneously? → Each room maintains its own independent game state.
- What if the word list is empty? → Seed data always includes 5 words; empty list is not a
  valid runtime state.
- What if a player joins after the game starts? → Out of scope; late-join is not supported.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When the game starts, the room creator (host) MUST be assigned the `drawer` role.
- **FR-002**: All other players MUST be assigned the `guesser` role.
- **FR-003**: The secret word MUST be selected deterministically as the first word in the
  starter word list.
- **FR-004**: The secret word MUST be visible only to the player with the `drawer` role.
- **FR-005**: Guessers MUST NOT see the secret word at any point during the round.
- **FR-006**: Every player's current role (Drawer / Guesser) MUST be clearly displayed on
  the game screen.
- **FR-007**: The drawer MUST be identifiable in the participant list or game header (e.g.,
  a "Drawing" label next to their name).
- **FR-008**: The game screen MUST display different content to the drawer vs. guessers
  (at minimum: word visibility differs).

### Key Entities

- **Round**: belongs to a Room; has a `drawerId` (participant UUID), `secretWord` (string),
  and `status` (`active` | `completed`).
- **ParticipantRole** (per round): `drawer` or `guesser` — assigned at game start, not stored
  per participant but derivable from `drawerId`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of games start with the host assigned as drawer — verifiable by checking
  `drawerId === hostId` after every game start.
- **SC-002**: The secret word shown to the drawer is always "rocket" (index 0 of starter list)
  for the first round — verifiable by inspection.
- **SC-003**: 0 guessers can see the secret word on their game screen — verifiable by opening
  a guesser's browser tab and confirming no word is displayed.
- **SC-004**: Every player can identify their role within 3 seconds of landing on the game
  screen without any additional action.

## Assumptions

- Only one round is played per game (multi-round is out of scope).
- The host is always the drawer; drawer rotation is out of scope.
- "Deterministic" means always index 0 of the starter word list — no randomisation, no
  per-room selection logic.
- The room's `hostId` (set in Feature Group 1) is the source of truth for drawer identity.
- Players who are not yet in the game when it starts cannot join mid-round.
- The game screen for Feature Group 2 shows role and word; canvas and guess interaction
  belong to Feature Group 3.
