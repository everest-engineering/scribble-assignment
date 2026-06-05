# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "Scenario 2 — Game Start & Drawer Flow (README business scenarios, second one)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start the round and bring everyone into the game (Priority: P1)

The host, with at least two players in the lobby, starts the game. The round begins and **all**
players — host and guessers — move from the lobby into the active game view together, without
anyone clicking anything else. A guesser who was waiting in the lobby is carried into the game
automatically.

**Why this priority**: This is the core of Scenario 2 and closes the gap left by Scenario 1,
where only the host's screen advanced. Without a synced transition there is no round for anyone
else, so nothing downstream (drawing, guessing, scoring) is reachable. It is the MVP slice.

**Independent Test**: With two players in a lobby, the host starts the game; confirm both the
host's and the guesser's screens show the active game view within ~2 seconds, with no manual
navigation by the guesser.

**Acceptance Scenarios**:

1. **Given** a host and at least one other player in a lobby, **When** the host starts the game,
   **Then** the room enters an active-round state and the host sees the game view.
2. **Given** a guesser waiting in the same lobby, **When** the host starts the game, **Then**
   the guesser is moved into the game view automatically within ~2 seconds.
3. **Given** a room that has not been started, **When** any player views it, **Then** they
   remain in the lobby and no active-round state exists.

---

### User Story 2 - Drawer assignment and clear identification (Priority: P1)

When the round begins, exactly one player is the drawer — the host (the first player) — and
everyone else is a guesser. Every player can clearly see who the drawer is, and each player can
tell whether they themselves are the drawer or a guesser.

**Why this priority**: A drawing game needs a single, unambiguous drawer before any drawing or
guessing can happen. Role identity is a precondition for Scenario 3.

**Independent Test**: Start a round with a host and a guesser; confirm the host is shown as the
drawer to both players, the guesser is shown as a guesser, and each player's own role is clear.

**Acceptance Scenarios**:

1. **Given** a round that has just begun, **When** roles are assigned, **Then** the host (first
   player) is the drawer and all other participants are guessers.
2. **Given** an active round, **When** any player looks at the game view, **Then** the drawer is
   clearly identified to everyone.
3. **Given** an active round, **When** a player looks at their own status, **Then** they can tell
   whether they are the drawer or a guesser.
4. **Given** an active round, **When** roles are inspected, **Then** there is exactly one drawer.

---

### User Story 3 - Deterministic secret word, visible only to the drawer (Priority: P1)

When the round begins, a secret word is chosen from the starter word list by a deterministic
rule (not random). The drawer can see the secret word; guessers never see it. The word stays the
same for the whole round and does not change as the screen refreshes.

**Why this priority**: The secret word is what the drawer draws and what guessers try to guess.
Deterministic selection makes the round testable; drawer-only visibility is the rule that makes
the game fair.

**Independent Test**: Start a round; confirm the drawer sees a word drawn from the starter list,
the guesser's view never contains that word, and the word is unchanged across repeated refreshes.

**Acceptance Scenarios**:

1. **Given** a round begins, **When** the secret word is selected, **Then** it is one of the
   starter words and is chosen by a deterministic, reproducible rule rather than at random.
2. **Given** an active round, **When** the drawer views the game, **Then** the secret word is
   shown to the drawer.
3. **Given** an active round, **When** a guesser views the game, **Then** the secret word is not
   present anywhere in what the guesser receives or sees.
4. **Given** an active round, **When** the view refreshes repeatedly, **Then** the same secret
   word is shown to the drawer every time for the duration of the round.

---

### User Story 4 - Player name validation (Priority: P2)

When creating or joining a room, a player's name is trimmed of surrounding whitespace. An empty
or whitespace-only name is rejected with a clear message, and the room is not created or joined
until a valid name is provided. The trimmed name is what other players see.

**Why this priority**: This is the named precondition of Scenario 2 ("player names are trimmed,
empty/whitespace-only rejected with a message") and a graded validation edge case. It refines the
existing create/join flows rather than introducing new screens, so it is supporting (P2) relative
to the round mechanics.

**Independent Test**: Try to create and to join with (a) a blank name, (b) a whitespace-only
name, and (c) a name with surrounding spaces; confirm (a)/(b) are rejected with a clear message
and no room action occurs, and (c) succeeds with the trimmed name displayed.

**Acceptance Scenarios**:

1. **Given** the create-room form, **When** a player submits an empty or whitespace-only name,
   **Then** they see a clear message that a name is required and no room is created.
2. **Given** the join-room form, **When** a player submits an empty or whitespace-only name,
   **Then** they see a clear message that a name is required and they do not join.
3. **Given** a name with surrounding whitespace, **When** the player creates or joins, **Then**
   the name is trimmed and the trimmed value is shown to other players.

---

### Edge Cases

- **Start preconditions carry over**: starting still requires the host and at least two players
  (from Scenario 1); a non-host or a one-player room cannot start.
- **Whitespace-only name**: treated as empty and rejected at both create and join.
- **Name with internal spaces**: preserved (only leading/trailing whitespace is trimmed).
- **Guesser never sees the word**: the secret word must be absent from everything a guesser
  receives, not merely hidden visually.
- **Word stability across polling**: repeated lobby/game refreshes during the round return the
  same secret word and the same drawer; neither is re-rolled per refresh.
- **Late-arriving view**: a guesser whose screen refreshes after the round has started lands in
  the game view in the guesser role, without the word.
- **Single drawer invariant**: exactly one drawer exists per round, even with many guessers.
- **Already-started room**: viewing or refreshing a room that is already in an active round shows
  the active round, not the lobby.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow the host to start the game only when the Scenario 1 preconditions
  hold (host initiating, at least two participants present).
- **FR-002**: System MUST transition the room from the lobby state into an active-round state when
  the host starts the game.
- **FR-003**: System MUST move every participant (host and guessers) from the lobby into the
  active game view once the round has begun, using the existing periodic refresh, within ~2
  seconds and without requiring guessers to navigate manually.
- **FR-004**: System MUST expose the room's active-round state so that any refreshing client can
  detect that the round has started.
- **FR-005**: System MUST assign exactly one drawer when the round begins, and that drawer MUST be
  the host (the first player).
- **FR-006**: System MUST designate all non-drawer participants as guessers.
- **FR-007**: System MUST clearly identify the drawer to all participants.
- **FR-008**: System MUST let each participant determine whether they are the drawer or a guesser.
- **FR-009**: System MUST select a secret word from the starter word list when the round begins,
  using a deterministic, reproducible rule (never random selection).
- **FR-010**: System MUST keep the selected secret word fixed for the entire round; it MUST NOT
  change across refreshes.
- **FR-011**: System MUST reveal the secret word only to the drawer; a guesser's data and view
  MUST NOT contain the secret word.
- **FR-012**: System MUST trim leading and trailing whitespace from a player's name when creating
  or joining a room.
- **FR-013**: System MUST reject an empty or whitespace-only player name on create and on join
  with a clear, human-readable message, and MUST NOT create or join the room in that case.
- **FR-014**: System MUST display the trimmed player name to other participants.
- **FR-015**: System MUST keep all round state (status, drawer, secret word) in memory only,
  consistent with the project constitution.

### Key Entities *(include if data involved)*

- **Round (active game)**: The in-progress game for a room. Holds which participant is the drawer
  and the secret word for the round. Exists only while the room is in the active-round state.
- **Room (extended)**: Gains an active-round state distinct from "lobby", plus a reference to the
  current drawer and the secret word. Still in memory only.
- **Drawer**: The single participant responsible for drawing this round — the host/first player.
  Exactly one per round.
- **Guesser**: Any participant who is not the drawer for the round.
- **Secret word**: One word from the starter list, chosen deterministically, fixed for the round,
  visible only to the drawer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After the host starts, 100% of players in the room reach the active game view within
  ~2 seconds, with guessers requiring no manual navigation.
- **SC-002**: Exactly one drawer is assigned per round, and it is the host, 100% of the time.
- **SC-003**: Every participant can correctly identify the drawer and their own role 100% of the
  time during an active round.
- **SC-004**: The secret word is one of the starter words and is identical across repeated
  selections for the same room state (deterministic) in 100% of trials.
- **SC-005**: The secret word is visible to the drawer and absent from the guesser's view/data in
  100% of trials.
- **SC-006**: The secret word and drawer remain unchanged across repeated refreshes for the entire
  round (0% drift).
- **SC-007**: 100% of empty or whitespace-only name submissions are rejected with a clear message
  and produce no room creation or join.
- **SC-008**: Names with surrounding whitespace are stored and displayed trimmed 100% of the time.

## Assumptions

- **Single round, no rotation**: Scenario 2 covers starting one round and assigning its drawer and
  word. Multiple rounds, drawer rotation, timers, and countdowns are explicitly out of scope.
- **Drawer identity**: "host (or first player)" is interpreted as the host, which in this project
  is always the first participant — so the drawer is unambiguous.
- **Deterministic selection rule**: The exact formula for choosing the word (e.g., derived from a
  stable room property) is an implementation detail for the plan; the spec only requires that it be
  deterministic, reproducible, fixed for the round, and drawn from the starter list.
- **Transition mechanism**: The lobby-to-game transition relies on the periodic refresh introduced
  in Scenario 1 (no new real-time mechanism), consistent with the no-WebSockets constraint.
- **Gameplay deferred**: Drawing, clearing the canvas, guess submission, guess history, and scoring
  are owned by Scenario 3; results and restart by Scenario 4. This spec stops at "the round has
  begun with a drawer and a hidden word".
- **Name validation scope**: Validation covers emptiness/whitespace and trimming only; no limits on
  length, character set, or uniqueness are imposed.
- **Roles source**: The starter already seeds the roles `drawer` and `guesser`; this scenario gives
  them meaning by assigning them per participant for the active round.
