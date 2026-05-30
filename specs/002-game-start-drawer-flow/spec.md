# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer-flow`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Scenario 2 (Game Start & Drawer Flow)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Player Names Are Validated at Entry (Priority: P1)

When creating or joining a room, a player must provide a display name that is non-empty after
trimming surrounding whitespace. Invalid names are rejected with a clear message before the
player enters the lobby.

**Why this priority**: Name validation prevents anonymous or blank participants from entering
the game and ensures every player is identifiable when roles are assigned at game start.

**Independent Test**: Attempt to create or join a room with names such as `"   "`, `""`, or
`"  Alex  "` and verify rejection for empty/whitespace-only names and successful entry with
trimmed names (e.g., `"Alex"` stored and displayed).

**Acceptance Scenarios**:

1. **Given** a player on the create-room form, **When** they submit a name that is empty or
   contains only whitespace, **Then** room creation is blocked and a clear error message
   explains that a name is required.
2. **Given** a player on the join-room form, **When** they submit a valid room code but a
   name that is empty or whitespace-only, **Then** the join is blocked and a clear error
   message explains that a name is required.
3. **Given** a player submits a name with leading or trailing spaces (e.g., `"  Sam  "`),
   **When** the create or join succeeds, **Then** the stored and displayed name is trimmed
   (e.g., `"Sam"`).
4. **Given** a player submits a valid non-empty name after trimming, **When** they create or
   join a room, **Then** they proceed to the lobby with that trimmed name visible in the
   participant list.

---

### User Story 2 - Game Starts and All Players Enter the Round (Priority: P2)

When the host starts the game from a lobby with at least two players, the session leaves the
lobby and all participants enter the active game screen together.

**Why this priority**: Completing the start transition is the bridge from Scenario 1 to
gameplay. Without synchronized navigation, players would remain in the lobby after start.

**Independent Test**: With two browser tabs in the same room, the host starts the game and
verify both tabs leave the lobby and land on the game screen within a few seconds without
manual refresh.

**Acceptance Scenarios**:

1. **Given** a lobby with at least two participants and the host activates start game,
   **When** the start succeeds, **Then** the room session is in an active playing state and
   all participants are directed to the game experience.
2. **Given** a participant is on the lobby screen, **When** another participant's host starts
   the game, **Then** the participant's screen updates automatically to the game experience
   within approximately 2 seconds without manual refresh.
3. **Given** a room still in lobby status, **When** a participant tries to open the game
   screen directly, **Then** they are redirected back to the lobby until the game has
   started.
4. **Given** the game has started, **When** a participant views the game screen, **Then** they
   see an indication that a round is active (e.g., round label or playing status).

---

### User Story 3 - Host Becomes the Identified Drawer (Priority: P3)

When the first (and only) round begins, the room host is assigned as the drawer. All players
can clearly see who is drawing; non-drawers know they are guessers.

**Why this priority**: Fair play requires a single, visible drawer before any drawing or
guessing interaction. The host-as-drawer rule matches the lab's deterministic game design.

**Independent Test**: After starting a two-player game, confirm the host tab shows drawer
status and the guest tab shows guesser status, with the host's name visibly marked as the
drawer on both screens.

**Acceptance Scenarios**:

1. **Given** a game has just started with the host and at least one other participant,
   **When** participants view the game screen, **Then** the host is assigned the drawer role
   and all other participants are assigned guesser roles.
2. **Given** an active game, **When** any participant views the game screen, **Then** the
   drawer is clearly identified by name or role label (e.g., "Drawer" badge or equivalent).
3. **Given** a participant viewing the game as a guesser, **When** they inspect their own
   status, **Then** they see that they are a guesser and who the current drawer is.
4. **Given** a participant viewing the game as the drawer, **When** they inspect their own
   status, **Then** they see that they are the drawer.

---

### User Story 4 - Secret Word Is Drawer-Only (Priority: P4)

When the round begins, one secret word is chosen deterministically from the fixed starter
word list. Only the drawer sees the secret word; guessers see no secret word or a neutral
prompt to guess.

**Why this priority**: Concealing the word from guessers is core to the game. Deterministic
selection keeps acceptance testing reproducible without randomness.

**Independent Test**: Start a game with two tabs. Confirm the drawer tab displays the secret
word and the guesser tab does not display the word (or any equivalent spelling/hint of it).

**Acceptance Scenarios**:

1. **Given** a game has started, **When** the drawer views the game screen, **Then** the
   secret word for the round is visible to them in plain text.
2. **Given** a game has started, **When** a guesser views the game screen, **Then** the
   secret word is not visible anywhere on their screen.
3. **Given** the same room session starting a game under identical conditions, **When** the
   secret word is assigned, **Then** the same word is selected every time (deterministic, not
   random).
4. **Given** a game has started, **When** any participant views available word metadata
   exposed to clients, **Then** guessers never receive the active secret word through shared
   room state.

---

### Edge Cases

- What happens when a player submits a name that is only whitespace on create vs join? Both
  flows reject with the same class of clear error message before entering the lobby.
- What happens when trimming reduces a name to empty? Treat as invalid and reject.
- What happens when two players use the same trimmed display name? Both remain separate
  participants; duplicate names are still allowed.
- What happens when polling fails on the game screen after start? Show a non-blocking error or
  status; retry on the next interval without clearing the last known roles or drawer identity.
- What happens when the backend restarts mid-game? Room is lost; refresh or navigation fails
  with a clear not-found message (inherent to in-memory scope).
- What happens when a player bookmarks the game URL before start? Redirect to lobby until the
  host starts.
- What happens if a participant tries to infer the word from UI copy meant for guessers?
  Guess-facing prompts MUST NOT embed or leak the secret word.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trim leading and trailing whitespace from player display names on
  room creation and room join.
- **FR-002**: System MUST reject room creation when the trimmed display name is empty and
  show a clear, user-facing error message.
- **FR-003**: System MUST reject room join when the trimmed display name is empty and show a
  clear, user-facing error message.
- **FR-004**: System MUST persist and display participant names in trimmed form after
  successful create or join.
- **FR-005**: System MUST transition a room from lobby to active playing status when the
  host successfully starts the game (building on Scenario 1 start preconditions).
- **FR-006**: System MUST direct all participants to the game experience when the room enters
  active playing status.
- **FR-007**: System MUST automatically refresh game session state at approximately 2-second
  intervals while a participant remains on the game screen, so non-host clients detect start
  without manual refresh.
- **FR-008**: System MUST stop automatic refresh when a participant navigates away from the
  game screen.
- **FR-009**: System MUST assign the room host as the drawer when the game starts.
- **FR-010**: System MUST assign every non-host participant as a guesser when the game starts.
- **FR-011**: System MUST clearly identify the drawer to all participants on the game screen.
- **FR-012**: System MUST select exactly one secret word deterministically from the fixed
  starter word list when the game starts.
- **FR-013**: System MUST NOT use random selection for the secret word.
- **FR-014**: System MUST expose the secret word to the drawer only.
- **FR-015**: System MUST NOT expose the active secret word to guessers through the game
  screen or shared session state visible to guessers.
- **FR-016**: System MUST redirect participants from the game screen to the lobby when the
  room is still in lobby status.

### Key Entities

- **Round**: The single active drawing-and-guessing period for a room session after game
  start; has one assigned secret word and one drawer for the lifetime of that round.
- **Drawer**: The participant responsible for drawing the secret word; exactly one per active
  round; in this scenario always the room host.
- **Guesser**: Any participant who is not the drawer; cannot see the secret word during the
  active round.
- **Secret Word**: One word chosen deterministically from the fixed starter list (rocket,
  pizza, castle, guitar, sunflower) when the round begins; visible only to the drawer.
- **Participant Role**: The role assigned at game start (`drawer` or `guesser`) distinguishing
  what each player sees and will do in later scenarios.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of create/join attempts with empty or whitespace-only names are rejected
  with a clear error before the lobby is shown.
- **SC-002**: Names with surrounding whitespace are stored and displayed in trimmed form in
  100% of successful create/join tests.
- **SC-003**: When the host starts a two-player game, both participants reach the game screen
  within 3 seconds without manual refresh.
- **SC-004**: In two-browser testing, the host is identified as the drawer on both clients
  in 100% of game starts.
- **SC-005**: In two-browser testing, the guesser never sees the secret word on their screen
  in 100% of game starts.
- **SC-006**: In repeated starts of the same room session under identical conditions, the same
  secret word is assigned every time (deterministic verification).
- **SC-007**: The drawer sees the assigned secret word on first load of the game screen in
  100% of successful game starts.

## Assumptions

- Scenario 1 (room setup, lobby polling, host-only start with two-player minimum) is complete
  or in progress; this scenario extends that handoff rather than redefining lobby rules.
- The room host is the participant who created the room; "first player" in the README maps to
  the host for drawer assignment.
- Only one round exists per game session in this lab; drawer rotation and multiple rounds are
  out of scope.
- The fixed starter word list is rocket, pizza, castle, guitar, sunflower; no custom or random
  word packs.
- Deterministic word selection uses the first word in the starter list order for the single
  round of a session (reproducible default; not random).
- Drawing on the canvas, guess submission, scoring, result display, and restart are deferred
  to Scenarios 3 and 4; game screen placeholders for those areas may remain until then.
- Synchronization uses periodic refresh (polling), not push notifications.
- No authentication; participant identity remains session-local via the identifier from
  create/join.
- Room state is in-memory only; sessions do not survive a server restart.
