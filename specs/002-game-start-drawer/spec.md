# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `scribble-assignment` (single-branch lab; feature dir `specs/002-game-start-drawer`)

**Created**: 2026-06-17

**Status**: Draft

**Feature Group**: 2 of 4 — Scenario 2 (Game Start & Drawer Flow)

**Builds on**: Feature Group 1 (`specs/001-room-setup-lobby`) — the started/`active` room state, host identity, and the host-only start action delivered there are the entry point for this group.

**Input**: User description: "Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Player names are validated (Priority: P1)

A player entering a name to create or join a game must provide a non-blank name. Leading/trailing
whitespace is trimmed, and an empty or whitespace-only name is rejected with a clear message instead of
silently becoming a placeholder.

**Why this priority**: Names identify the drawer and (later) guessers and scores. Garbage or empty names
undermine every downstream role and result. This is the gating prerequisite for the round.

**Independent Test**: On the create and join screens, submit a blank/whitespace name and confirm it is
rejected with a message and no room is created/joined; submit a name with surrounding spaces and confirm it
is stored trimmed.

**Acceptance Scenarios**:

1. **Given** the create-room screen, **When** a player submits an empty or whitespace-only name, **Then** the action is rejected with a clear message and no room is created.
2. **Given** the join-room screen, **When** a player submits an empty or whitespace-only name, **Then** the action is rejected with a clear message and they do not join.
3. **Given** a name with leading/trailing spaces (e.g. "  Alice  "), **When** it is accepted, **Then** it is stored and displayed trimmed ("Alice").
4. **Given** a valid trimmed name, **When** submitted, **Then** the flow proceeds exactly as before (no regression to Group 1 create/join).

---

### User Story 2 - A drawer is assigned and clearly identified when the round begins (Priority: P1)

When the host starts the game, the first round begins with exactly one participant designated as the
**drawer** (the host / first player). All participants can see who the drawer is.

**Why this priority**: The drawer is the central role of the round; without a clearly assigned drawer there
is no game. It is the core of Scenario 2.

**Independent Test**: Start a game with 2+ players; confirm exactly one participant is marked as the drawer
(the host), and that both the drawer and the guessers can see who the drawer is.

**Acceptance Scenarios**:

1. **Given** a started game (2+ players), **When** the first round begins, **Then** exactly one participant is designated the drawer, and it is the host / first player.
2. **Given** a started game, **When** any participant views the game screen, **Then** the identity of the drawer is clearly shown to everyone.
3. **Given** a started game, **When** a participant who is not the drawer views the game screen, **Then** they are identified as a guesser (not the drawer).

---

### User Story 3 - A secret word is selected deterministically (Priority: P2)

When the round begins, a secret word is chosen from the fixed starter word list using a deterministic rule,
so the same room yields the same word rather than a value that changes on every refresh.

**Why this priority**: The word is what the drawer draws and guessers guess; it must exist and be stable for
the round. Determinism makes the round reproducible and testable.

**Independent Test**: Start a game and observe the selected word; refresh/poll repeatedly and confirm the
word does not change for that round.

**Acceptance Scenarios**:

1. **Given** a round begins, **When** the secret word is selected, **Then** it is one of the fixed starter words (rocket, pizza, castle, guitar, sunflower).
2. **Given** a round in progress, **When** the room is polled or refreshed repeatedly, **Then** the secret word remains the same (it is not re-randomized per request).
3. **Given** the selection rule, **When** applied to the same room, **Then** it always yields the same word (deterministic, not random).

---

### User Story 4 - The secret word is visible only to the drawer (Priority: P2)

The drawer can see the secret word they must draw. Guessers cannot see the word during the round.

**Why this priority**: Word secrecy is the entire point of a guessing game; if guessers can see it the game
is meaningless. This depends on US2 (drawer identity) and US3 (a word exists).

**Independent Test**: With two browsers in a started game, confirm the drawer's screen shows the word and the
guesser's screen does not reveal it.

**Acceptance Scenarios**:

1. **Given** a started round, **When** the drawer views their screen, **Then** the secret word is shown to them.
2. **Given** a started round, **When** a guesser views their screen, **Then** the secret word is not shown or otherwise discoverable to them.
3. **Given** the same room snapshot requested by different participants, **When** compared, **Then** only the drawer's view contains the word.

### Edge Cases

- **Blank / whitespace-only name on create or join** → rejected with a clear message; no placeholder name is substituted; no room created/joined.
- **Name with surrounding whitespace** → trimmed before storage and display.
- **Game started with the minimum 2 players** → a drawer is still assigned (the host) and a word selected.
- **Word stability across polling** → the word and drawer assignment do not change when the room is re-fetched within the same round.
- **Guesser attempts to read the word via the room view** → the word is absent from non-drawer views, not merely hidden in the UI.
- **A second start is not expected** within this group (single round; no rotation) — re-starting / new rounds are out of scope here.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST trim leading/trailing whitespace from a player name on room creation and on joining.
- **FR-002**: The system MUST reject an empty or whitespace-only player name on both create and join, returning a clear user-facing message, and MUST NOT create/join with a placeholder name.
- **FR-003**: The system MUST store and display accepted names in their trimmed form.
- **FR-004**: On game start, the system MUST designate exactly one participant as the drawer for the round, selected as the host / first player.
- **FR-005**: The system MUST expose the drawer's identity so that every participant's game view can clearly indicate who the drawer is.
- **FR-006**: The system MUST allow a non-drawer participant's view to identify them as a guesser.
- **FR-007**: On game start, the system MUST select exactly one secret word from the fixed starter word list.
- **FR-008**: The system MUST select the secret word deterministically (stable for a given room/round), never re-randomized per request.
- **FR-009**: The system MUST include the secret word only in the drawer's view of the room.
- **FR-010**: The system MUST exclude the secret word from every non-drawer (guesser) view of the room, such that it is not discoverable from the data the guesser receives.
- **FR-011**: The system MUST preserve the Group 1 behaviors (host identity, polling, host-only gated start, auto-advance) without regression.

### Key Entities *(include if feature involves data)*

- **Round**: The active play state of a started room. Has exactly one drawer and one secret word for its duration. Exists in memory for the room's `active` state.
- **Participant (role)**: Within a started round, each participant has a role — exactly one **drawer** (the host/first player), all others **guessers**.
- **Secret word**: A single value drawn from the fixed starter list, associated with the round, included only in the drawer's view.
- **Viewer-aware room view**: The room snapshot tailored to the requesting participant — the drawer's view includes the word and role; a guesser's view includes their role but omits the word.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of empty/whitespace-only name submissions (create and join) are rejected with a clear message and produce no room/participant; names with surrounding spaces are stored trimmed.
- **SC-002**: On every game start with 2+ players, exactly one drawer is assigned and is visible to all participants.
- **SC-003**: The selected secret word is always one of the five starter words and remains unchanged across repeated polling within the round (0 changes per round).
- **SC-004**: In a started round, the word appears in the drawer's view and in 0% of guesser views.
- **SC-005**: All Group 1 acceptance criteria still pass after this group (no regression).

## Assumptions

- "Host or first player" is the same participant in this lab (the creator), so the drawer is the host. Documented for confirmation in clarification.
- Deterministic selection is interpreted as a stable function of the room (e.g., derived from the room code), so different rooms may differ but a given room's word never changes mid-round. The exact rule is a clarification candidate; "always the first word" is an acceptable simpler alternative.
- Player-name validation is limited to trim + non-empty; no maximum length, character-set, or uniqueness rules are imposed (out of scope).
- Guessers see that a word exists and who is drawing, but never the word text, until results (Group 4).
- This group covers a single round only: no drawing interaction, guess handling, scoring, results, restart, multiple rounds, or drawer rotation (later groups / explicitly out of scope).
- The work extends the Group 1 in-memory room model and the existing viewer-aware snapshot seam; it does not introduce persistence, auth, or new libraries (brownfield, polling-only).
