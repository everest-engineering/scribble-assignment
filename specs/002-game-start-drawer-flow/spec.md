# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer-flow`

**Created**: 2026-06-03

**Status**: Draft

## Clarifications

### Session 2026-06-03

- Q: Where does round state (drawer identity, secret word) live in the data model — on `Room`, as a separate `Round` entity, or in a private server-side Map? → A: Add `currentDrawerId: string` and `currentWord: string` directly to the `Room` model and `RoomSnapshot`.
- Q: What is the deterministic word selection algorithm for FR-006? → A: `words[(roundNumber - 1) % words.length]` — round 1 always uses `words[0]`; the list wraps when exhausted.
- Q: What does the game screen (`/game`) show beyond roles and the secret word? → A: Roles + word only — participant list with Drawer/Guesser labels, secret word displayed to the drawer, and placeholder text to guessers. No canvas, no hints, no word-length indicator.
- Q: Which server mechanism gates `currentWord` delivery to the drawer vs. guessers? → A: Use the existing `participantId` query parameter on `GET /rooms/:code?participantId=…`. `toRoomSnapshot` includes `currentWord` only when the viewer's `participantId` matches `room.currentDrawerId`; it is omitted (or `null`) for all other callers.
- Q: Is multi-round progression (rotating drawer, incrementing `roundNumber`) in scope? → A: Explicitly out of scope. `roundNumber` is set to `1` on game start and MUST NOT be incremented anywhere in this feature.

**Input**: User description: "#### Scenario 2 — Game Start & Drawer Flow — Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer"

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Drawer Is Assigned When a Round Begins (Priority: P1)

When the host starts the game, exactly one participant is designated as the drawer for the first round. All other participants in the room are designated as guessers. The role assignments are visible to all participants, so everyone knows who is drawing and who is guessing.

**Why this priority**: Without a clearly identified drawer the game cannot begin; this is the minimum viable round state.

**Independent Test**: Start a game with two players. Without navigating away, verify that exactly one participant is labelled as "Drawer" and all others are labelled as "Guesser" on the game screen.

**Acceptance Scenarios**:

1. **Given** a room in `"playing"` status with at least two participants, **When** a participant loads the game screen, **Then** exactly one participant is marked as the drawer and every other participant is marked as a guesser.
2. **Given** a room in `"playing"` status, **When** the host loads the game screen, **Then** the host is identified as the drawer for the first round.
3. **Given** a room in `"playing"` status, **When** a non-host participant loads the game screen, **Then** that participant sees themselves labelled as a guesser and the host labelled as the drawer.
4. **Given** a room that has not yet transitioned to `"playing"`, **When** a participant views the lobby, **Then** no drawer or guesser assignments are shown.

---

### User Story 2 — Secret Word Is Visible Only to the Drawer (Priority: P1)

The secret word for the current round is shown in full to the drawer on their game screen. Guessers' game screens do not reveal the word — they see only that a word has been chosen. This ensures the drawing challenge is fair and the word remains secret until guessed.

**Why this priority**: Word secrecy is the core mechanic of the game; leaking it to guessers removes all challenge.

**Independent Test**: Open two browser tabs — one as the host (drawer), one as a guest (guesser). Start the game. Confirm the host's screen shows the actual word. Confirm the guest's screen does not show the word.

**Acceptance Scenarios**:

1. **Given** an active round with an assigned drawer and secret word, **When** the drawer loads the game screen, **Then** the secret word is clearly displayed to the drawer.
2. **Given** an active round with a secret word, **When** a guesser loads the game screen, **Then** the secret word is not displayed anywhere on the screen.
3. **Given** an active round, **When** the server responds to the drawer's request for room state, **Then** the response includes the secret word.
4. **Given** an active round, **When** the server responds to a guesser's request for room state, **Then** the response does not include the secret word.

---

### User Story 3 — Word Is Drawn From the Pre-Defined Starter List (Priority: P2)

The secret word for the first round comes from the game's built-in starter word list. The selection is deterministic: given the same room state, the same word is always selected. This avoids dependence on external word sources and keeps the game self-contained.

**Why this priority**: Without a word source the game cannot function, but the precise selection algorithm is secondary to role assignment and word secrecy.

**Independent Test**: Start two separate games. Verify that the secret word assigned in each case is a member of the known starter word list (not a word invented outside the list).

**Acceptance Scenarios**:

1. **Given** a room transitioning to `"playing"`, **When** the first round begins, **Then** the secret word is a member of the pre-defined starter word list.
2. **Given** the same room state inputs, **When** the word selection runs, **Then** the same word is always produced (no non-deterministic selection).
3. **Given** the starter word list has at least one word, **When** a round begins, **Then** a word is always assigned (no null or empty word).

---

### Edge Cases

- What happens when a room transitions to `"playing"` with exactly the minimum number of participants (2)?
- What happens if the drawer disconnects or navigates away mid-round — do guessers still see the correct role assignments?
- What happens when the starter word list is exhausted (all words have been used across rounds)? The selection wraps around using `% words.length`, so words repeat from the beginning — exhaustion is not an error condition.
- What happens if a participant joins a room that is already `"playing"` — do they receive a role assignment?
- What happens if the drawer's identity cannot be resolved (e.g., `hostId` does not match any participant)?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: When a game room transitions to `"playing"` status and the first round begins, the system MUST designate exactly one participant as the drawer for that round.
- **FR-002**: The participant designated as the drawer for the first round MUST be the room host (the participant whose identity matches `hostId`).
- **FR-003**: Every participant in the room who is not the drawer MUST be designated as a guesser for the current round.
- **FR-004**: Role assignments (drawer / guesser) MUST be visible to all participants on the game screen as a participant list with each player labelled either "Drawer" or "Guesser".
- **FR-004a**: The game screen for a guesser MUST display placeholder text (e.g. "Waiting for the drawer…") in place of the secret word. No word-length hint, blank tiles, or partial word MUST be shown.
- **FR-005**: The system MUST select a secret word for each round from the pre-defined starter word list.
- **FR-006**: The secret word selection MUST be deterministic using the formula `words[(roundNumber - 1) % words.length]`, where `roundNumber` is 1-based. Round 1 always selects `words[0]`. When all words have been used the list wraps (modulo), so exhaustion never causes an error.
- **FR-007**: `toRoomSnapshot` MUST accept the viewer's `participantId` and include `currentWord` in the returned `RoomSnapshot` only when `participantId === room.currentDrawerId`. The mechanism is the existing `participantId` query parameter on `GET /rooms/:code?participantId=…`.
- **FR-008**: When `participantId` is absent or does not match `room.currentDrawerId`, `toRoomSnapshot` MUST omit `currentWord` (set to `undefined` or `null`) in the returned snapshot.
- **FR-009**: The game screen MUST display the secret word clearly to the drawer.
- **FR-010**: The game screen MUST NOT display the secret word to any guesser, even partially.
- **FR-011**: Player names that are empty or whitespace-only MUST be rejected with an error message before any API call is made (precondition established in the preceding feature).

### Key Entities

- **Round**: A single drawing/guessing cycle within a game room. Round state is stored directly on the `Room` model — not as a separate entity. The relevant fields are `currentDrawerId: string` (the participant who is drawing) and `currentWord: string` (the secret word for this round). A `roundNumber: number` field (1-based, always `1` in this feature) is stored to support the word-selection formula; it is never incremented within this feature's scope.
- **DrawerAssignment**: The rule that maps a round to the participant who draws. For round 1, the drawer is the room host (`hostId`). `currentDrawerId` on `Room` holds this value.
- **SecretWord**: The word chosen for the current round, stored as `currentWord` on `Room`. Delivered in full in `RoomSnapshot.currentWord` only when the requesting `participantId` equals `room.currentDrawerId`; omitted (`null` or `undefined`) in all other snapshot calls.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: After a game starts, all participants on the game screen see exactly one participant labelled "Drawer" and all others labelled "Guesser" — verified in 100% of test runs.
- **SC-002**: The drawer's game screen displays the secret word within one screen refresh of the round beginning.
- **SC-003**: The guesser's game screen shows no trace of the secret word — verified by inspecting the rendered page and the raw API response.
- **SC-004**: The secret word is always a member of the pre-defined starter word list — verified across all test runs.
- **SC-005**: Given identical room state, the word selection produces the same word on every invocation (zero variance in deterministic selection).

## Assumptions

- Player-name validation (empty / whitespace rejection) is already implemented from the preceding feature and is a precondition, not a new requirement here.
- Round progression (rotating drawers across multiple rounds) is **explicitly out of scope**. `roundNumber` is always `1` in this feature and MUST NOT be incremented. The word-selection formula is stored for future extensibility only.
- The starter word list is pre-loaded at server start and does not change at runtime.
- Participants already in the room when the game starts are the only ones eligible for role assignment; late joiners (post-`"playing"`) receive no role.
- The game screen (`/game` route) is the correct destination after `"playing"` status is detected — confirmed by the navigation logic established in the preceding feature.
- If `hostId` cannot be resolved to a current participant, the system's behaviour is undefined and out of scope for this feature.
