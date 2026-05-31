# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Game Start and Drawer Flow — player name trim validation, drawer assignment, deterministic secret word selection, drawer-only word visibility (Scribble lab Scenario 2)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Valid Player Names (Priority: P1)

When creating or joining a room, players must provide a display name that is non-empty after trimming whitespace. Invalid names are rejected with a clear message before the player enters the lobby.

**Why this priority**: Names identify players in the lobby and game; empty or whitespace-only names break the social and scoring experience.

**Independent Test**: Attempt create/join with `"   "` or empty name → error shown; valid trimmed name → succeeds.

**Acceptance Scenarios**:

1. **Given** a player on the create-room form, **When** they submit an empty or whitespace-only name, **Then** they see a clear validation message and remain on the form.
2. **Given** a player on the join-room form, **When** they submit an empty or whitespace-only name, **Then** they see a clear validation message and remain on the form.
3. **Given** a player enters `"  Alex  "` as their name, **When** they create or join successfully, **Then** their displayed name in the lobby is `Alex` (trimmed).
4. **Given** valid names, **When** two players are in the lobby, **Then** each participant list entry shows the trimmed display name.

---

### User Story 2 - Drawer Assignment (Priority: P2)

When the host starts the game and the round begins, one player is designated as the drawer. The host (room creator) is the drawer for the single round. All players can see who is drawing.

**Why this priority**: The drawer role is the core mechanic distinguishing guessers from the artist; everyone must know who is drawing.

**Independent Test**: Two tabs — host starts game → both see the same drawer identity on the game screen.

**Acceptance Scenarios**:

1. **Given** a room with at least two players and the host starts the game, **When** all clients reach the game screen, **Then** the host is identified as the drawer.
2. **Given** a non-host player views the game screen, **When** the round is active, **Then** they see which participant is the drawer (not themselves unless they are the drawer).
3. **Given** the host is the drawer, **When** guessers view the game screen, **Then** the drawer label clearly distinguishes the drawing player from guessers.

---

### User Story 3 - Secret Word Visibility (Priority: P3)

When the round begins, a secret word is chosen deterministically from the starter word list. Only the drawer sees the secret word; guessers do not see it in the UI or in shared room state visible to them.

**Why this priority**: Hiding the word from guessers is essential for fair gameplay; deterministic selection keeps testing reproducible.

**Independent Test**: Two tabs — drawer tab shows the word; guesser tab does not.

**Acceptance Scenarios**:

1. **Given** a started round, **When** the drawer views the game screen, **Then** they see the secret word for this round.
2. **Given** a started round, **When** a guesser views the game screen, **Then** they do not see the secret word (placeholder or hidden state is acceptable).
3. **Given** the same room code started twice in separate test sessions with the same starter word list, **When** the round begins each time, **Then** the same secret word is selected (deterministic from room identity).
4. **Given** a guesser polls for room updates, **When** they receive the room snapshot, **Then** the secret word is not included in their view of the data.

---

### Edge Cases

- What happens when a player name is only special characters after trim? Treat as valid if non-empty after trim (e.g., `"---"`).
- What happens if create/join sends a name with leading/trailing spaces? Server stores and returns trimmed name.
- What happens when the drawer refreshes mid-round? They remain the drawer and still see the word when session is restored.
- What happens when a guesser navigates directly to `/game` before start? Redirect or block until room status is `playing` (align with server state).
- What happens on the game screen before Scenario 3 gameplay? Canvas and guess input may remain placeholders; this feature only requires drawer identity and word visibility.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST reject empty or whitespace-only player names on room creation with a clear user-facing message.
- **FR-002**: System MUST reject empty or whitespace-only player names on room join with a clear user-facing message.
- **FR-003**: System MUST trim leading and trailing whitespace from accepted player names before storing and displaying them.
- **FR-004**: System MUST assign the room host as the drawer when the game transitions from lobby to active round.
- **FR-005**: System MUST expose the drawer identity to all participants in the active round.
- **FR-006**: System MUST select the secret word deterministically from the starter word list (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) for a given room.
- **FR-007**: System MUST show the secret word only to the drawer in the game UI.
- **FR-008**: System MUST omit the secret word from room snapshots returned to non-drawer participants.
- **FR-009**: System MUST initialize all participant scores to 0 when the round begins (visible on game screen or scoreboard).
- **FR-010**: System MUST prevent guessers from seeing the secret word via client-side state derived from polling.

### Key Entities

- **Drawer**: The participant assigned to draw for the round; equals the room host for this lab (single round, no rotation).
- **Guesser**: Any participant who is not the drawer for the current round.
- **Secret word**: One word from the starter list, selected deterministically at round start; server-only for guessers.
- **Participant role**: `drawer` or `guesser` for the active round, derived from drawer assignment.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of empty or whitespace-only create/join attempts show a validation error without entering the lobby.
- **SC-002**: After game start, both drawer and guesser tabs identify the same drawer within 3 seconds.
- **SC-003**: In two-browser testing, the guesser never sees the secret word in the UI across 10 poll cycles.
- **SC-004**: The drawer always sees the secret word within 3 seconds of reaching the game screen.
- **SC-005**: Repeating round start for the same room code in a fresh session yields the same secret word every time.
- **SC-006**: All participants show a score of 0 at round start.

## Assumptions

- Scenario 1 (lobby, host start, polling, auto-navigation) is implemented and working.
- The host is always the drawer; no drawer rotation or random drawer selection.
- Word selection algorithm: derive index from room code (e.g., hash of code modulo word list length) — exact formula fixed in plan for testability.
- Single round per room session; no multi-round word changes.
- Game screen may still use placeholders for canvas and guessing (Scenario 3); this feature validates drawer label and word panel only.
- `participantId` query parameter (or equivalent session identity) determines viewer-specific snapshot filtering on the server.

## Scope Boundaries

**In scope**: Name trim/validation on create and join, drawer assignment at round start, deterministic word pick, drawer-only word in UI and API snapshots, drawer/guesser role indication, scores initialized to 0.

**Out of scope**: Interactive drawing, guess submission, scoring updates, result/restart (Scenarios 3–4), drawer rotation, timers, custom word packs, WebSockets, persistence.

**Depends on**: `001-room-setup-lobby` — host start transitions room to `playing` and navigates clients to game screen.
