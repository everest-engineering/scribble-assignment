# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "Create a specification for Scenario 2: Game Start & Drawer Flow. Requirements: player names trimmed and empty/whitespace-only rejected with a clear message; when the first round begins the host becomes the clearly-identified drawer; secret word is deterministically selected from the starter word list; secret word is visible only to the drawer."

**Depends on**: Group 1 (Room Setup & Lobby) — rooms, host, lobby polling, host-only start with 2-player minimum, and transition to `started` status with navigation to the game screen.

## Clarifications

### Session 2026-06-05

- Q: When does round initialization (roles + secret word) run relative to Group 1's start action? → A: Extend the existing start action: when status flips to `started`, assign drawer/guesser roles and select the secret word once in the same operation; room GET remains a pure read/projection.
- Q: How is the secret word represented in the room view for non-drawer (guesser) viewers? → A: Omit the `secretWord` field entirely from non-drawer snapshots; include it only on the drawer's snapshot (the word never appears in guesser JSON).
- Q: What deterministic rule selects the secret word from the room code? → A: Sum the character codes of the room code, take modulo the starter word-list length, and use that index to pick the word (pure function, no randomness).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Player names are validated at create and join (Priority: P1)

A player must provide a non-empty display name when creating or joining a room. Names with only
whitespace are rejected before any room change occurs, with a clear message.

**Why this priority**: Invalid names break identification in the lobby and game; the starter silently
defaults empty names to "Player", which violates Scenario 2 and the constitution.

**Independent Test**: Attempt create and join with blank or whitespace-only names and confirm rejection;
attempt with a trimmed valid name and confirm success.

**Acceptance Scenarios**:

1. **Given** a player on the create screen, **When** they submit an empty or whitespace-only name,
   **Then** the room is not created and they see a clear validation message.
2. **Given** a player on the join screen, **When** they submit an empty or whitespace-only name,
   **Then** they are not added to any room and they see a clear validation message.
3. **Given** a name with leading or trailing spaces, **When** they create or join successfully,
   **Then** the stored display name is the trimmed value (internal spaces preserved).
4. **Given** a valid name on create or join, **When** the request is accepted,
   **Then** the participant appears in the room with that trimmed name (never a silent default like
   "Player" for empty input).

---

### User Story 2 - Host becomes the drawer when the round begins (Priority: P1)

When the game has started, exactly one participant is the drawer for the round. The drawer is the
room host (the creator). All players can see who the drawer is; only the drawer receives the secret
word (see User Story 4).

**Why this priority**: Drawer identity drives every later gameplay interaction; without a single,
clear drawer the game cannot proceed.

**Independent Test**: Start a game with host + one joiner; confirm the host is labeled as drawer on
all clients and non-host participants are guessers.

**Acceptance Scenarios**:

1. **Given** a room in `started` status with at least two participants, **When** any client fetches the
   room view, **Then** exactly one participant is identified as the drawer and that participant is
   the host.
2. **Given** a started room, **When** a non-host views the game screen, **Then** they see who the
   drawer is and that they are not the drawer.
3. **Given** a started room, **When** the host (drawer) views the game screen, **Then** they see
   themselves identified as the drawer.
4. **Given** a room still in `lobby` status, **When** clients view the room, **Then** no drawer role
   is assigned yet.
5. **Given** a host with at least two participants in the lobby, **When** the host successfully starts
   the game, **Then** the start response already reflects assigned roles and the drawer can see the
   secret word on the next fetch without any separate initialization step.

---

### User Story 3 - Secret word is chosen deterministically (Priority: P1)

When the round begins, the system selects one secret word from the fixed starter word list using a
deterministic rule based on stable room state (the room code). The same room always receives the same
word; selection is not random.

**Why this priority**: A reproducible word is required for testing, grading, and constitution
Principle III (deterministic game rules).

**Independent Test**: Create two rooms with known codes (or observe code + word pairs) and verify the
mapping is stable and repeatable; restart fetches for the same room return the same word.

**Acceptance Scenarios**:

1. **Given** a room that has just entered `started` status, **When** the round is initialized,
   **Then** exactly one word from the starter list is selected as the secret word for that room.
2. **Given** the same room code and started state, **When** the word is resolved again,
   **Then** the same secret word is returned (idempotent).
3. **Given** two different active rooms, **When** each enters `started` status,
   **Then** each room's secret word is determined independently (no cross-room leakage).
4. **Given** the starter word list, **When** a word is selected,
   **Then** the selected word is always one of the entries in that list.
5. **Given** a known room code, **When** the word is selected twice for that room,
   **Then** both selections use `sum(code char codes) % list length` and return the same word.

---

### User Story 4 - Secret word visible only to the drawer (Priority: P1)

The secret word MUST NOT appear in the room view delivered to guessers. Only the drawer receives the
word in their personalized room view. Enforcement is at the source of truth (server-side projection),
not by hiding elements only in the browser.

**Why this priority**: Leaking the word to guessers breaks the game immediately; this is a security-style
game rule enforced in the snapshot.

**Independent Test**: Open the game in two tabs (host/drawer and joiner/guesser); confirm only the
drawer's tab shows the secret word.

**Acceptance Scenarios**:

1. **Given** a started room and the drawer's client identity, **When** the drawer fetches the room
   view, **Then** the response includes the secret word.
2. **Given** a started room and a guesser's client identity, **When** the guesser fetches the room
   view, **Then** the `secretWord` field is absent from the response entirely (never sent, not even
   as null).
3. **Given** a guesser who inspects network responses or UI, **When** they obtain the room view from
   the system, **Then** they cannot learn the secret word without being the drawer.
4. **Given** a drawer and guesser in the same room, **When** both refresh their views,
   **Then** the drawer still sees the word and the guesser still does not.

---

### Edge Cases

- **Whitespace-only name on create/join** → rejected client- and server-side; no room mutation.
- **Name trim only** → `"  Ada  "` stored as `"Ada"`; `"A B"` unchanged except outer trim.
- **Successful start (host + ≥2 players)** → in one start operation: status becomes `started`, roles
  and secret word are assigned; idempotent if start is called again while already started.
- **Repeated fetches after started** → drawer, roles, and word remain stable (idempotent init).
- **Unknown or missing participant id on GET** → no secret word exposed; appropriate error or
  anonymous-safe snapshot per existing API conventions.
- **Backend restart** → in-memory state lost (out of scope); no persistence added.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-020**: The system MUST reject create-room and join-room requests whose player name is empty or
  whitespace-only, with a clear validation message and HTTP 400 (or equivalent client-side block before
  request).
- **FR-021**: The system MUST trim leading and trailing whitespace from accepted player names before
  storing them; it MUST NOT substitute a default name when validation fails.
- **FR-022**: The create and join UI MUST block submit on empty or whitespace-only player names with a
  visible message before calling the server.
- **FR-023**: When a room is in `started` status and the round is initialized, the system MUST assign
  the host participant the `drawer` role and every other participant the `guesser` role.
- **FR-024**: The room view MUST make the drawer identifiable to all participants (e.g., per-participant
  role or a dedicated drawer indicator).
- **FR-025**: Round initialization MUST run inside the existing start action when status first becomes
  `started` (assign roles + select word in the same operation as the status flip). It MUST be
  idempotent if start is invoked again while already `started`. Room GET MUST NOT mutate state.
- **FR-026**: The system MUST select the secret word deterministically from the fixed starter word list
  by computing `sum(character codes of room code) % wordList.length` and indexing into the list at
  that position; selection MUST NOT use randomness.
- **FR-027**: The same room code MUST always resolve to the same secret word while the round state
  remains active in memory.
- **FR-028**: The room view returned to the drawer MUST include the secret word for that room.
- **FR-029**: The room view returned to any non-drawer (guesser) MUST omit the `secretWord` field
  entirely (the field is absent, not present-and-null).
- **FR-030**: Viewer-specific word hiding MUST be enforced in the server-side room projection (using the
  requesting participant id), not only by conditional UI rendering.
- **FR-031**: The game screen MUST reflect drawer identity and show the secret word only when the
  current participant is the drawer.
- **FR-032**: This group MUST NOT implement drawing, guess submission, scoring, results, restart, or
  game-screen polling beyond what is needed to display drawer identity and word visibility (those belong
  to Groups 3 and 4).

### Key Entities

- **Participant (extended)**: Gains a round role (`drawer` | `guesser`) once the room is started and
  initialized; display name is trimmed on create/join.
- **Room (extended)**: Gains round state: assigned roles, deterministic secret word, and initialization
  flag or equivalent invariant so init runs once.
- **Room View (extended)**: Viewer-specific projection; includes role information for all participants;
  includes the `secretWord` field only on the drawer's request and omits it entirely for everyone else.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of create/join attempts with empty or whitespace-only names are rejected with a
  user-visible message and cause no participant to be added or room created.
- **SC-002**: After a successful start with two players, 100% of room views identify the host as the
  sole drawer and all others as guessers.
- **SC-003**: For any given room code, repeated round initialization yields the same secret word 100%
  of the time within the same backend process lifetime.
- **SC-004**: In a two-tab test (drawer + guesser), 100% of guesser fetches omit the secret word while
  100% of drawer fetches include it.
- **SC-005**: Zero cross-room contamination: word and role assignment in room A never appear in room B.

## Assumptions

- Group 1 is complete: host tracking, lobby polling, host-only start, and navigation to `/game` on
  `started` status.
- The room creator remains the host and is the drawer for the single round (no rotation).
- The starter word list is the five words shipped with the project; no custom packs.
- Round initialization runs inside the start action when status first becomes `started`; GET is
  read-only projection only.
- Deterministic word selection uses `sum(room code char codes) % starterWordList.length` (constitution
  Principle III); the exact function is specified in FR-026.
- Gameplay polling (~2s) on the game screen for strokes and guesses is Group 3; this group only requires
  that the game screen can load and display correct drawer/word state from the current snapshot.
