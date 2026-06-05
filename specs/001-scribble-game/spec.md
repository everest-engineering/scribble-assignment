# Feature Specification: Scribble Guessing Game

**Feature Branch**: `001-scribble-game`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "go through readme and create"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Room Setup & Lobby (Priority: P1)

A player wants to host or join a drawing game. They create a room and receive a unique code, or
join an existing room by entering its code. The room creator becomes the host. Other players join
the same room with the code and gather in a lobby that keeps everyone's participant list current.
Only the host can start the game, and only once enough players are present.

**Why this priority**: Without rooms and a lobby there is no shared space to play in. This is the
foundational journey every other story depends on, and on its own it already delivers a working
"create/join a room and see who's here" experience.

**Independent Test**: In two browser tabs, create a room in one tab, join it by code in the other,
and confirm both tabs converge on the same participant list and that only the host sees an enabled
start control once a second player joins.

**Acceptance Scenarios**:

1. **Given** a player on the start screen, **When** they create a room, **Then** they receive a
   unique room code, land in the lobby, and are marked as the host.
2. **Given** a valid room code, **When** another player joins with it, **Then** they enter the
   same room's lobby and appear in the participant list for all members.
3. **Given** an empty or invalid room code, **When** a player attempts to join, **Then** the join
   is rejected with clear, human-readable feedback and no room is entered.
4. **Given** two separate rooms exist, **When** players act in one room, **Then** the other room's
   state is completely unaffected (full isolation).
5. **Given** a player is in a lobby, **When** another participant joins or the roster changes,
   **Then** the lobby reflects the change automatically within about 2 seconds without a manual
   refresh.
6. **Given** a lobby with fewer than 2 players, **When** the host views the start control, **Then**
   starting the game is not permitted; **When** at least 2 players are present, **Then** only the
   host can start the game.

---

### User Story 2 - Game Start & Drawer Flow (Priority: P2)

When the host starts the game, the first round begins. One player is clearly identified as the
drawer, and a secret word is chosen for the round. Only the drawer can see the secret word;
everyone else knows a word has been chosen but cannot see it.

**Why this priority**: This turns a populated lobby into an actual round. It builds directly on
Story 1 and is the precondition for any gameplay, so it comes before drawing and guessing.

**Independent Test**: Start a game from a 2-player lobby and confirm exactly one player is shown as
the drawer, the drawer's screen displays the secret word, and the guesser's screen does not reveal
it.

**Acceptance Scenarios**:

1. **Given** a player joins with a name, **When** the name is empty or only whitespace, **Then** it
   is rejected with a clear message and the player is not admitted under that name.
2. **Given** a lobby of at least 2 players, **When** the host starts the game, **Then** the first
   round begins and exactly one player is identified as the drawer.
3. **Given** a round has started, **When** the secret word is chosen, **Then** it is selected
   deterministically from the predefined word list (not random).
4. **Given** a round is active, **When** players view their screens, **Then** the drawer sees the
   secret word and guessers do not.

---

### User Story 3 - Gameplay Interaction (Priority: P3)

During an active round the drawer draws on a canvas and can clear it, while guessers submit text
guesses. All players see a shared, synchronized guess history. Correct guesses score points.

**Why this priority**: This is the core play loop. It depends on a started round (Story 2) and a
populated room (Story 1), so it follows them.

**Independent Test**: With a drawer and a guesser in a round, draw and clear strokes as the drawer,
submit a correct and an incorrect guess as the guesser, and confirm both tabs show the same guess
history and that the correct guess is scored 100.

**Acceptance Scenarios**:

1. **Given** the drawer is on the canvas, **When** they draw, **Then** their strokes appear on the
   drawing surface; **When** they clear the canvas, **Then** the surface is emptied.
2. **Given** a guesser submits a guess, **When** the guess is empty or only whitespace, **Then** it
   is rejected with clear feedback and not recorded.
3. **Given** a guesser submits a guess, **When** it is compared to the secret word, **Then** the
   comparison ignores case and surrounding whitespace.
4. **Given** any player submits a guess, **When** it is recorded, **Then** the guess history
   updates for all players within about 2 seconds.
5. **Given** all scores start at 0, **When** a guess is correct, **Then** the guesser is awarded
   100 points; **When** a guess is incorrect, **Then** 0 points are added.

---

### User Story 4 - Result, Restart & Final Validation (Priority: P4)

When the round ends, every player sees a shared result: the correct word, the final scores, and the
full guess history. The host can restart, which returns all players to the lobby with the roster
preserved and all round state cleared.

**Why this priority**: This closes the loop and proves the full session works end to end. It
depends on a completed round, so it is last.

**Independent Test**: End a round, confirm both tabs show the same correct word, final scores, and
guess history, then have the host restart and confirm both tabs return to the lobby with the same
players and a cleared round.

**Acceptance Scenarios**:

1. **Given** a round has ended, **When** the result state is shown, **Then** all players see the
   same correct word, final scores, and complete guess history.
2. **Given** the result state is displayed, **When** the host restarts, **Then** all players return
   to the lobby.
3. **Given** a restart occurs, **When** players return to the lobby, **Then** the participant
   roster is preserved and all round state (drawer, word, drawing, guesses, scores) is cleared.

---

### Edge Cases

- Joining with an empty, malformed, or non-existent room code is rejected with clear feedback.
- A player name that is empty or whitespace-only is rejected before admission.
- A guess that is empty or whitespace-only is rejected and not added to history.
- Guesses that differ only by case or surrounding whitespace from the secret word are treated as
  correct.
- A non-host player has no ability to start or restart the game.
- The host attempts to start with fewer than 2 players: starting is not permitted.
- Actions in one room never alter another room's participants, drawer, word, guesses, or scores.
- Backend state is in-memory only: a backend restart clears all rooms (acceptable for this lab).

## Requirements *(mandatory)*

### Functional Requirements

**Room & Lobby**

- **FR-001**: System MUST let a player create a room and MUST assign that room a unique join code.
- **FR-002**: System MUST designate the room creator as the host.
- **FR-003**: Users MUST be able to join an existing room by entering its code.
- **FR-004**: System MUST reject empty, malformed, or non-existent room codes with clear feedback.
- **FR-005**: System MUST keep each room's state fully isolated from every other room.
- **FR-006**: System MUST keep the lobby participant list synchronized across all members,
  reflecting roster changes automatically within approximately 2 seconds.
- **FR-007**: System MUST allow only the host to start the game, and only when at least 2 players
  are present.

**Player & Round Setup**

- **FR-008**: System MUST trim player names and reject empty or whitespace-only names with clear
  feedback.
- **FR-009**: System MUST, on game start, identify exactly one player as the drawer for the round.
- **FR-010**: System MUST select the round's secret word deterministically from the predefined
  word list (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`), never randomly.
- **FR-011**: System MUST show the secret word only to the drawer and MUST hide it from guessers.

**Gameplay**

- **FR-012**: System MUST allow the drawer to draw on a canvas and to clear the canvas.
- **FR-013**: Users MUST be able to submit text guesses during an active round.
- **FR-014**: System MUST trim guesses and reject empty or whitespace-only guesses with clear
  feedback.
- **FR-015**: System MUST compare guesses to the secret word case-insensitively and ignoring
  surrounding whitespace.
- **FR-016**: System MUST maintain a guess history that is synchronized to all players within
  approximately 2 seconds.
- **FR-017**: System MUST start all player scores at 0, award 100 points for a correct guess, and
  add 0 for an incorrect guess.

**Result & Restart**

- **FR-018**: System MUST present a shared result state showing the correct word, final scores, and
  the full guess history to all players.
- **FR-019**: System MUST allow only the host to restart from the result state.
- **FR-020**: System MUST, on restart, return all players to the lobby with the roster preserved and
  all round state (drawer, word, drawing, guesses, scores) cleared.

### Key Entities *(include if feature involves data)*

- **Room**: A play space identified by a unique code. Holds its participants, host designation, and
  current round state. Fully isolated from other rooms.
- **Player**: A participant in a room, identified by a trimmed non-empty name. May be the host
  and/or the drawer; carries a score that starts at 0.
- **Round**: The active game state within a room. Has one drawer, one deterministically chosen
  secret word, the current drawing, the guess history, and the lifecycle status (lobby → active →
  result).
- **Guess**: A trimmed, non-empty text submission by a player, recorded in history with its author
  and whether it was correct.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Two players in separate browser tabs can create/join the same room and both see the
  same participant list, with roster changes appearing within about 2 seconds without a manual
  refresh.
- **SC-002**: Two players can complete one full round end to end — start, drawer assignment,
  drawing, guessing, result, and restart — without errors.
- **SC-003**: 100% of empty/invalid room codes, empty/whitespace player names, and empty/whitespace
  guesses are rejected with clear feedback and never enter game state.
- **SC-004**: A guess that matches the secret word ignoring case and surrounding whitespace is
  scored as correct (100 points) in 100% of attempts; non-matching guesses add 0.
- **SC-005**: The same secret word is chosen for the same starting conditions on every run
  (deterministic selection), verifiable by repeating a start.
- **SC-006**: Actions performed in one room produce no observable change in any other room across
  100% of tested interactions.
- **SC-007**: After a host restart, all original players remain in the lobby and no drawer, word,
  drawing, guess, or non-zero score from the prior round persists.

## Assumptions

- The four business scenarios in the README are delivered as the four prioritized user stories
  above (P1 → P4), in that order.
- Cross-player synchronization is achieved by periodic refresh (polling) at an approximately
  2-second cadence; real-time push (WebSockets) is explicitly out of scope.
- Room and game state are held in memory only; persistence across backend restarts is not required.
- The word list is fixed to the five seeded starter words; custom or random word packs are out of
  scope.
- A single round per session is in scope; multiple rounds, drawer rotation, and timers are out of
  scope.
- The host is the player who created the room and, by default, the first drawer of the round.
- Out-of-scope items listed in the README (auth, databases, deployment, spectator mode, moderation,
  room passwords, etc.) are excluded from this specification.
