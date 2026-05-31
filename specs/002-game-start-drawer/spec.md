# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `assignment`

**Created**: 2026-05-31

**Status**: Draft

## Clarifications

### Session 2026-05-31

- Q: How is the drawer assigned? → A: The host (first participant, `hostId`) is assigned as the drawer for the first round. No rotation needed — single round only.
- Q: How is the secret word selected? → A: Always `STARTER_WORDS[0]` (`"rocket"`). Every room gets the same word. Simplest valid deterministic selection; no hash or rotation needed.
- Q: How does word visibility work? → A: The backend includes `secretWord` in the room snapshot only when the requesting `participantId` matches the `drawerId`. All other participants receive the snapshot without `secretWord`.
- Q: Does the Game screen poll in Scenario 2? → A: No. Drawer assignment and secret word are set once at game start. All clients already have the updated snapshot in React state when they navigate from the Lobby (triggered by detecting `status: "game"` via lobby polling). Game screen polling is deferred to Scenario 3.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Drawer Assignment on Game Start (Priority: P1)

When the game starts, one player is clearly designated as the drawer. All other
players are guessers. The drawer identity is visible to all participants (e.g.,
"Alice is drawing").

**Why this priority**: Drawer assignment is the entry point for the entire game
flow. Nothing else in Scenario 2 works without it.

**Independent Test**: Start a game with two players. Confirm the Game screen
identifies one player as the drawer and the other as the guesser. Confirm the
drawer label is visible to both tabs.

**Acceptance Scenarios**:

1. **Given** the host starts the game, **When** all players land on the Game
   screen, **Then** the host is designated as the drawer and all other players
   are designated as guessers.
2. **Given** the game is active, **When** any player views the Game screen,
   **Then** the drawer's name is clearly displayed to all participants.
3. **Given** the game has started, **When** a player checks their own role,
   **Then** the Game screen clearly shows whether they are the drawer or a
   guesser.

---

### User Story 2 — Secret Word Visibility (Priority: P1)

The secret word is visible only to the drawer. Guessers cannot see it. The word
is deterministically selected from the starter list.

**Why this priority**: Word secrecy is the core mechanic of the game. Without
it, the game has no challenge.

**Independent Test**: Start a game. Confirm the drawer's tab shows the secret
word prominently. Confirm every other tab shows no secret word (not even a
masked version).

**Acceptance Scenarios**:

1. **Given** the game is active, **When** the drawer views the Game screen,
   **Then** the secret word is prominently displayed to them.
2. **Given** the game is active, **When** a guesser views the Game screen,
   **Then** no secret word is shown — not even masked or hinted.
3. **Given** any game state, **When** the backend returns the room snapshot,
   **Then** `secretWord` is only present in the response when the requesting
   `participantId` matches the `drawerId`; all other requests omit it entirely.

---

### User Story 3 — Player Name Validation (Priority: P1)

Empty or whitespace-only player names are rejected with a clear error message on
both client and server before any game state is created.

**Why this priority**: The constitution marks this as non-negotiable. Player
names must be valid before reaching the game.

**Independent Test**: On the Create Room or Join Room screen, submit an empty
name or a name made of spaces only. Confirm the error message appears and no
room is created or joined.

**Acceptance Scenarios**:

1. **Given** a player submits a whitespace-only name on Create Room, **When**
   the form is submitted, **Then** an error "Player name is required" is shown
   and no API call is made.
2. **Given** a player submits a whitespace-only name on Join Room, **When** the
   form is submitted, **Then** an error "Player name is required" is shown and
   no API call is made.
3. **Given** a request reaches the backend with an empty or whitespace-only
   name, **When** the backend processes it, **Then** it returns a `400` error
   with a clear message.

*Note*: This validation was already implemented in Scenario 1. This story
confirms it is working and documents it as a Scenario 2 requirement per the
README.

---

### Edge Cases

- Deterministic word selection: the same room always resolves to the same word
  for the lifetime of the room; it MUST NOT change between polls.
- `secretWord` must never appear in a response to a guesser, even if the
  guesser sends a crafted request with a different `participantId`.
- The drawer role is set once at game start and does not change mid-round.
- If somehow `GET /rooms/:code` is called without a `participantId`, `secretWord`
  MUST be omitted from the response.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When the game starts, the backend MUST assign the room's `hostId`
  participant as the `drawerId` for the round.
- **FR-002**: The backend MUST set the secret word to `STARTER_WORDS[0]`
  (`"rocket"`) when the game starts. The word is fixed for the lifetime of the
  room and MUST NOT change between polls.
- **FR-003**: The backend MUST include `secretWord` in the room snapshot only
  when the requesting `participantId` matches the room's `drawerId`. All other
  requests MUST omit `secretWord` entirely (not null, not masked — absent).
- **FR-004**: The backend MUST include `drawerId` in the room snapshot so all
  clients can display the drawer's identity.
- **FR-005**: The Game screen MUST display the drawer's name to all participants.
- **FR-006**: The Game screen MUST display the secret word prominently when the
  viewer is the drawer.
- **FR-007**: The Game screen MUST NOT display the secret word (or any hint of
  it) when the viewer is a guesser.
- **FR-008**: Player names MUST be trimmed; empty or whitespace-only names MUST
  be rejected on the client and on the server with a `400` response. *(Confirmed
  implemented in Scenario 1; documented here for completeness.)*

### Key Entities

- **Room**: Now includes `drawerId: string | null` (set on game start) and
  `secretWord: string | null` (set on game start, never exposed to guessers).
- **RoomSnapshot**: Includes `drawerId: string | null` always; includes
  `secretWord: string` only when viewer is the drawer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All players see the drawer's name on the Game screen immediately
  upon navigation — the snapshot carrying `drawerId` is already in React state
  when clients arrive from the Lobby.
- **SC-002**: The drawer's tab shows the secret word immediately on navigation
  to the Game screen.
- **SC-003**: No guesser tab ever shows the secret word, confirmed by inspecting
  the network response as well as the UI.
- **SC-004**: The same room always shows the same secret word across all polls
  and page loads for that room's lifetime.
- **SC-005**: Submitting an empty or whitespace-only name on any entry form
  produces an inline error before any network request is made.

## Assumptions

- The drawer is always the host (`hostId` participant) for this single-round
  game. No rotation logic is required.
- Deterministic word selection always uses `STARTER_WORDS[0]` (`"rocket"`).
  Every room gets the same word for its lifetime. No hash or index derivation needed.
- `drawerId` and `secretWord` are set on the room when `POST /rooms/:code/start`
  is called, extending the same endpoint implemented in Scenario 1.
- The frontend identifies the viewer's role by comparing `participantId` from
  React state against `room.drawerId` from the snapshot.
- No UI changes are needed on the Create Room or Join Room pages for name
  validation — that work is complete from Scenario 1.
- `secretWord` is never stored in frontend state in a way accessible to guessers;
  it is simply absent from the API response for non-drawers.
- No new polling is added to the Game screen for Scenario 2. The snapshot with
  `drawerId` and `secretWord` (for the drawer) arrives via the lobby poll that
  detects `status: "game"`. Game screen polling is a Scenario 3 concern.
