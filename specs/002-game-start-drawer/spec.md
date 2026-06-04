# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer`

**Created**: 2026-06-04

**Status**: Draft

**Input**: Scenario 2 — Game Start & Drawer Flow: Given a game is starting and player names are
trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the
host (or first player) becomes the clearly-identified drawer, and the secret word
(deterministically selected from the starter list) is visible only to the drawer.

**Depends on**: Scenario 1 — Room Setup & Lobby (room creation, host identity, game start
transition to `"playing"` status)

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Drawer Is Assigned on Game Start (Priority: P1)

When the game begins, one player is designated as the drawer. All players can see who the drawer
is. The drawer role is assigned deterministically — the host is always the drawer for the single
round in this lab scope.

**Why this priority**: Every subsequent gameplay action (drawing, guessing, scoring) depends on
knowing who the drawer is. Without drawer assignment, the game screen cannot function.

**Independent Test**: Two tabs — Tab 1 (host Alice) and Tab 2 (Bob) both in the lobby. Host starts
the game. On the game screen, both tabs show Alice as the identified drawer. Bob's tab shows the
canvas area and guess form (guesser view). Alice's tab shows the canvas for drawing (drawer view).

**Acceptance Scenarios**:

1. **Given** a game has started with host Alice and player Bob, **When** the game screen loads,
   **Then** Alice is identified as the drawer on both tabs, with a visible "Drawer" label next
   to her name.
2. **Given** a game has started, **When** Alice (drawer) views the game screen, **Then** she
   sees the drawing canvas in interactive mode.
3. **Given** a game has started, **When** Bob (guesser) views the game screen, **Then** he sees
   the canvas in read-only / placeholder mode and can see the guess input form.
4. **Given** a game has started, **When** any player views the scoreboard or player list,
   **Then** the drawer is visually distinguished from guessers (e.g., labelled "Drawer").

---

### User Story 2 — Secret Word Is Visible Only to the Drawer (Priority: P1)

When the round begins, a secret word is selected from the starter list and shown exclusively
to the drawer. Guessers see no hint of the word. The selection is deterministic — always the
first word in the starter list for the first round.

**Why this priority**: The word is the central secret of the game. Showing it to guessers
would break gameplay entirely. The deterministic selection rule keeps the behaviour predictable
and testable.

**Independent Test**: Two tabs — Alice (drawer) and Bob (guesser). After game start, Alice's
tab shows "Your word: rocket" (or equivalent). Bob's tab shows no word. Open browser dev tools
on Bob's tab and confirm the network response does not include the secret word in a field that
is surfaced to guessers.

**Acceptance Scenarios**:

1. **Given** a game has started, **When** Alice (drawer) views the game screen, **Then** she
   sees the secret word displayed clearly (e.g., "Your word: rocket").
2. **Given** a game has started, **When** Bob (guesser) views the game screen, **Then** he
   sees no secret word — the word is completely absent from his view.
3. **Given** multiple games started in sequence, **When** the first round begins each time,
   **Then** the secret word is always the first word from the starter list ("rocket"),
   confirming deterministic selection.
4. **Given** a game has started, **When** the room snapshot is fetched by a guesser's client,
   **Then** the secret word is absent from the data returned to that client.

---

### User Story 3 — Game Screen Reflects Correct Role Per Player (Priority: P2)

The game screen layout and interactive elements adapt to whether the current player is the
drawer or a guesser. The drawer sees a drawing-capable canvas; guessers see a passive canvas
and the guess form.

**Why this priority**: UI role differentiation is the user-facing expression of the drawer/guesser
distinction. Without it, the game screen is confusing even if the underlying data is correct.

**Independent Test**: On Alice's (drawer) tab: canvas is interactive, no guess form is visible
(or it is disabled). On Bob's (guesser) tab: canvas is not interactive, guess form is enabled.
Both tabs show the room code and the drawer's name.

**Acceptance Scenarios**:

1. **Given** Alice is the drawer, **When** she views the game screen, **Then** the canvas is
   presented as the drawing area and the guess input is absent or disabled.
2. **Given** Bob is a guesser, **When** he views the game screen, **Then** the guess input is
   enabled and the canvas displays in passive mode.
3. **Given** either player views the game screen, **When** the page loads, **Then** the room
   code badge and the drawer's name are visible to all players.

---

### Edge Cases

- What happens if the game is started with exactly 2 players (minimum)? The host is assigned
  as drawer and the other player is the guesser. The secret word is shown only to the host.
- What happens if a player refreshes the browser mid-game? The frontend session is lost; the
  player is redirected to the Start screen (in-memory only — no persistence).
- What happens if both players are on the game screen and the backend is restarted? The room
  no longer exists; the next game-screen poll (Scenario 3) will redirect to Start.
- What if the drawer's name contains leading/trailing whitespace? Names are always stored
  trimmed (enforced in Scenario 1), so this cannot occur by the time the game starts.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a game starts, the system MUST assign the host as the drawer for the round.
- **FR-002**: The drawer assignment MUST be stored on the room and included in the room snapshot.
- **FR-003**: The system MUST select the secret word deterministically — always the first word
  from the starter list ("rocket") for the first round.
- **FR-004**: The secret word MUST be stored on the room server-side.
- **FR-005**: The room snapshot returned to the drawer MUST include the secret word.
- **FR-006**: The room snapshot returned to a guesser MUST NOT include the secret word.
  The `viewerParticipantId` parameter MUST be used to filter word visibility server-side.
- **FR-007**: The game screen MUST display a visual "Drawer" label identifying the assigned
  drawer to all players.
- **FR-008**: The game screen for the drawer MUST show the secret word prominently (e.g.,
  "Your word: rocket").
- **FR-009**: The game screen for guessers MUST show no secret word.
- **FR-010**: The canvas area MUST be presented as interactive to the drawer and as passive
  (non-interactive placeholder) to guessers.
- **FR-011**: The guess input form MUST be disabled or hidden for the drawer and enabled for
  guessers.

### Key Entities

- **Room** (extended): Gains `drawerId: string` (the drawer's participant ID) and
  `secretWord: string` (the selected word). Both are set at game start.
- **RoomSnapshot** (role-filtered): The `secretWord` field is present only when
  `viewerParticipantId === room.drawerId`. All viewers see `drawerId`.
- **Participant**: Unchanged. The drawer is identified by comparing `participant.id` to
  `room.drawerId`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After game start, the drawer's identity is visible to all players on the game
  screen within the next poll cycle (≤ 3 seconds).
- **SC-002**: The drawer sees their secret word immediately when the game screen loads.
- **SC-003**: A guesser's view of the game screen contains no text that reveals the secret word,
  verifiable by visual inspection and network response review.
- **SC-004**: Starting the game with the same two players always assigns the same drawer and
  the same secret word, confirming deterministic behaviour.
- **SC-005**: The game screen canvas is interactive for the drawer and non-interactive for
  guessers, distinguishable without further instruction.

---

## Assumptions

- The drawer is always the host (`room.hostId === room.drawerId`). Drawer rotation across
  multiple rounds is out of scope.
- The secret word is always `STARTER_WORDS[0]` ("rocket") for this lab. Random or rotating
  word selection is out of scope.
- Word visibility filtering is enforced server-side in `toRoomSnapshot()` using
  `viewerParticipantId`. The frontend always passes its `participantId` when fetching the room.
- The game screen already exists as a placeholder (from the starter). This scenario replaces
  the placeholder canvas and player-info section with role-aware content.
- Drawing interaction (actual canvas painting) is implemented in Scenario 3. This scenario
  makes the canvas visually present and role-differentiated, but not yet interactive for drawing.
- The guess form is rendered in the starter's `GuessForm` component. This scenario disables it
  for the drawer but does not yet wire up guess submission (Scenario 3).
- Player names are guaranteed trimmed and non-empty by Scenario 1 enforcement; no additional
  name validation is needed here.
