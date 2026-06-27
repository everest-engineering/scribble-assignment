# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer-flow`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Scenario 2 — Game Start & Drawer Flow — Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## Clarifications

### Session 2026-06-26

- Q: How should the participant ID survive a browser page refresh so that the correct drawer/guesser view is restored? → A: Store roomCode and participantId in sessionStorage. On page refresh, restore from storage and re-fetch room state. Drawer sees their word, guessers don't.
- Q: Should the GamePage poll the server for updates while the game is running? → A: No. Single fetch on GamePage mount is sufficient for this scenario (nothing changes during gameplay). Game-state polling will be added in a later scenario when dynamic events (guesses, scoring) require it.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First Round Starts with Drawer Assignment (Priority: P1)

When the host starts the game, the room transitions to "playing" status and the
first round begins. The host (who is also the first player) is assigned as the
drawer for the first round. All participants can see who the drawer is.

**Why this priority**: Drawer assignment is the gateway to gameplay — without
knowing who draws, no player can participate meaningfully.

**Independent Test**: Create a room, join with a second player in another tab,
and start the game from the host tab. Verify both tabs display the host as the
drawer.

**Acceptance Scenarios**:

1. **Given** a room with 2+ players and the host has started the game,
   **When** the room status transitions to "playing", **Then** the host is
   assigned as the drawer and all participants see the host's name labeled
   as "Drawer".
2. **Given** a room with 3 players, **When** the game starts, **Then**
   exactly one player (the host) is the drawer and the other two are
   guessers.
3. **Given** a player refreshes their browser during a game, **When** the
   page reloads and re-fetches room state, **Then** the player sees the
   correct drawer identity.

---

### User Story 2 - Secret Word Visible Only to Drawer (Priority: P2)

The secret word for the round is selected deterministically from the starter
word list and is displayed only to the drawer. Non-drawer players never see the
word.

**Why this priority**: The core mechanic of the game requires the drawer to
know the word while guessers do not. This is the fundamental rule of Pictionary.

**Independent Test**: Create a room, join with a second player, start the
game. In the drawer's tab, verify the secret word is displayed. In the
guesser's tab, verify the word is not visible anywhere in the UI or page
source.

**Acceptance Scenarios**:

1. **Given** a game has started with 2+ players, **When** the drawer looks
   at their game screen, **Then** they see a message like "Your word: [word]"
   with the secret word clearly displayed.
2. **Given** a game has started with 2+ players, **When** a guesser looks
   at their game screen, **Then** they do not see the secret word anywhere
   and instead see a message like "Waiting for [drawer name] to draw...".
3. **Given** a guesser inspects the API response or page source, **When**
   they examine the room data, **Then** the secret word is not present in
   the snapshot returned to them.

### Edge Cases

- What happens when there are more than 2 players? — One player is the drawer
  (the host); all other participants are guessers. No special handling needed
  beyond labeling.
- What happens when a player refreshes the page during a game? — The room
  code and participant ID are persisted in sessionStorage. On reload, the
  client restores them, re-fetches room state, and re-renders the correct
  view (drawer sees word, guesser does not). The `viewerParticipantId`
  parameter ensures word visibility is correct.
- What happens when the backend is restarted while a game is in progress?
  — The polling request returns a 404; the frontend shows a "Room no longer
  available" message and navigates back to the home screen.
- What if the same word should not repeat across rounds? — This scenario
  covers only the first round. Deterministic selection by round number
  (`STARTER_WORDS[round - 1]`) naturally prevents repeats within the word
  list as long as the round number stays within bounds.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-014**: System MUST assign the host as the drawer when the room status
  transitions to "playing".
- **FR-015**: System MUST select the secret word deterministically from the
  starter word list using the round number as the index
  (`STARTER_WORDS[currentRound - 1]`).
- **FR-016**: System MUST store the drawer's participant ID and the secret
  word on the Room model when the game starts.
- **FR-017**: System MUST include the current round number and drawer identity
  in the room snapshot returned to all participants.
- **FR-018**: System MUST include the secret word in the room snapshot only
  when the requesting participant is the drawer. Non-drawer participants must
  not receive the secret word in their snapshot.
- **FR-019**: Game page MUST display "You are the drawer!" with the secret
  word for the drawer participant. For guessers, it MUST display "Waiting for
  [drawer name] to draw..." without the word.
- **FR-020**: System MUST persist the room code and participant ID in
  sessionStorage so that a page refresh during a game restores the correct
  drawer/guesser view. On reload, the client reads sessionStorage, re-fetches
  room state, and renders the appropriate view (drawer sees word, guesser
  does not).

### Key Entities *(include if feature involves data)*

- **Round**: A single play cycle within a game. Has a round number (starting
  at 1), a drawer participant, and a secret word. This scenario covers only
  the first round.
- **Drawer Role**: The participant responsible for illustrating the secret
  word. In the first round, always the host. Determined at game start time.
- **Secret Word**: The word the drawer must illustrate. Selected
  deterministically from the fixed starter list. Only visible to the drawer
  participant in API responses and UI.
- **Game State**: The set of round-specific data (drawer, secret word,
  current round) that is added to the room snapshot when status is "playing".

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-006**: All players see who the drawer is within 2 seconds of the game
  starting (drawer sees identity immediately via startGame response; guessers
  see it on the next lobby poll).
- **SC-007**: The drawer sees the secret word on their screen immediately
  upon game start, with no additional action required.
- **SC-008**: Non-drawer players never see the secret word — verified by both
  UI inspection and API response inspection from a guesser's session.
- **SC-009**: Deterministic word selection produces the same word for the
  same room and round number across all clients.
- **SC-010**: A player who refreshes their browser during a game is returned
  to the correct view (drawer sees word, guesser does not) within 2 seconds
  of the page reloading.

## Assumptions

- The host is always the drawer in the first round. Drawer rotation across
  multiple rounds is out of scope (this scenario is single-round only).
- The word is selected as `STARTER_WORDS[currentRound - 1]`, so round 1 uses
  the first word in the list (the exact word depends on the seed data).
- Word visibility is controlled server-side via the `viewerParticipantId`
  query parameter on the `GET /rooms/:code` endpoint. The server filters the
  secret word from the snapshot when the viewer is not the drawer.
- The canvas (drawing surface) remains a non-interactive placeholder in this
  scenario. Interactive drawing tools are a separate, later scenario.
- No guess submission logic is included in this scenario — guessers see the
  "Waiting for drawer" state but cannot yet submit guesses.
- The GamePage fetches room state once on mount (for refresh recovery).
  Game-state polling is deferred to a later scenario that introduces dynamic
  game events (guesses, scoring).
