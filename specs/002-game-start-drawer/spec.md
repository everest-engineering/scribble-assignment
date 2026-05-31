# Feature Specification: Game Start and Drawer Flow

**Feature Branch**: `002-game-start-drawer` (continuing on same branch per user instruction)
**Created**: 2026-05-29
**Status**: Draft
**Input**: User description: "Game start and drawer flow. When the host starts the game and the
room becomes active, the host becomes the clearly-identified drawer. A secret word is
deterministically selected from the starter word list — a stable function of the room, never
random. The secret word is visible only to the drawer; guessers receive a snapshot with the word
hidden. The game screen identifies the drawer and shows the word only to them."

**Prerequisite**: Player name trimming and validation are fully specified in
`specs/001-room-setup-lobby/spec.md` (FR-001, FR-014). This spec does not re-specify them.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Host Becomes Drawer and Sees the Secret Word (Priority: P1)

When the host starts the game (triggering the room transition to `active` status), their game
screen immediately identifies them as the drawer and shows them the secret word. The word was
chosen by a reproducible, non-random process tied to the room's identity.

**Why this priority**: Without a drawer and a word, there is nothing to draw or guess. This is
the entry point to every game interaction in subsequent scenarios.

**Independent Test**: Open two browser tabs. Tab A (host/Alice) creates a room; Tab B (Bob)
joins. Alice clicks Start Game. Tab A (Alice) shows: her name or role labeled "Drawer", and the
secret word displayed clearly. Refreshing Tab A shows the same word.

**Acceptance Scenarios**:

1. **Given** a room transitions to `active`, **When** the drawer views the game screen,
   **Then** they see their own name or role labeled as "Drawer" and the secret word is displayed.
2. **Given** the drawer's game screen, **When** the same room is viewed again (e.g., page
   refresh), **Then** the same secret word is shown — it does not change between views.
3. **Given** a word list and a room, **When** the secret word is selected, **Then** the same
   word is always selected for the same room — the selection is reproducible with no randomness.

---

### User Story 2 — Guessers See the Drawer Identified but the Word Hidden (Priority: P1)

Non-drawer participants arrive on the game screen and see who is drawing, but cannot see the
secret word. They receive only a character-count placeholder so they know the word's length.

**Why this priority**: If guessers could see the secret word, the game has no challenge. This
is the core privacy requirement of the drawing game model.

**Independent Test**: Tab B (Bob/guesser) views the game screen after Alice starts. Bob sees
"Alice" identified as the drawer. Bob does NOT see the actual word — only a placeholder showing
the number of characters (e.g., blanks for each letter). Inspecting the network response for
Bob's snapshot confirms the actual word string is absent.

**Acceptance Scenarios**:

1. **Given** a room is `active`, **When** a guesser views the game screen, **Then** the
   drawer's name is clearly displayed and the secret word is replaced by a character-count
   placeholder (one blank per letter, e.g., `_ _ _ _` for a four-letter word).
2. **Given** a guesser's game screen, **When** the page is refreshed or the snapshot is
   re-fetched, **Then** the placeholder is consistent (same length) and the actual word never
   appears in the response delivered to guessers.
3. **Given** a guesser's network response (snapshot), **When** inspected, **Then** the actual
   secret word string is absent — only the character-count placeholder is present.

---

### User Story 3 — Word Selection is Deterministic and Stable (Priority: P2)

The same room always produces the same word. This property must hold across restarts of the
same in-memory session and be verifiable by automated tests with predictable outputs.

**Why this priority**: Determinism is required for test reliability (Principle 6 of the project
constitution) and prevents game-state inconsistencies when multiple participants poll the server.

**Independent Test**: Run an automated test that creates two calls to the word-selection
function with the same room code and asserts the same word is returned both times. Also verify
that two different room codes produce distinct words (non-trivial mapping).

**Acceptance Scenarios**:

1. **Given** the same room code, **When** the word-selection function is called multiple times,
   **Then** the same word is returned every time.
2. **Given** two rooms with different codes, **When** the word-selection function is called for
   each, **Then** it is likely (not required) that different words are returned — the function
   distributes across the word list.
3. **Given** an automated test, **When** the word-selection function is called with a known
   room code, **Then** the output is predictable and can be hard-coded in the test assertion.

---

### Edge Cases

- What if the word list is empty? → This is a data invariant; the starter word list is never
  empty. The system assumes at least one word is available (see Assumptions).
- Can the drawer navigate back to the lobby? → Out of scope for this scenario; no back-navigation
  is defined for the active game state.
- What happens if a participant refreshes their browser tab mid-game? → They are sent to the
  home screen. Participant identity is ephemeral and scoped to the current page session; a
  page reload loses the in-memory session (participantId + room). This is consistent with
  the no-auth model and requires no special handling.
- What does the placeholder look like for a word with spaces (multi-word)? → The starter word
  list contains single words only (see Assumptions); multi-word handling is not required.

## Clarifications

### Session 2026-05-29

- Q: Should the game screen poll the server every ~2 s (same as lobby)? → A: Yes — game screen polls every ~2 s via the same `fetchRoom` mechanism; required for Scenario 3 compatibility.
- Q: If a participant refreshes mid-game, where do they land? → A: Home screen — participant identity is ephemeral; page reload loses in-memory session. No special recovery handling required.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a room transitions to `active` status, the host's participant ID MUST be
  recorded as the drawer ID (`drawerId`) on the room.
- **FR-002**: The system MUST select a secret word from the starter word list using a
  deterministic, non-random function whose output depends only on the room's stable identity
  (e.g., room code). The same room MUST always yield the same word.
- **FR-003**: The room snapshot returned to the drawer MUST include the secret word in plain text.
- **FR-004**: The room snapshot returned to any non-drawer participant MUST replace the secret
  word with a character-count placeholder (one blank segment per character, e.g., `_ _ _ _`).
  The actual word string MUST NOT appear in non-drawer snapshots.
- **FR-005**: The game screen MUST display the drawer's name to all participants (drawer and
  guessers alike) so the current drawer is unambiguous.
- **FR-006**: The game screen MUST display the secret word to the drawer and MUST NOT display
  the actual word to guessers — only the placeholder is shown.
- **FR-007**: Player name validation (trim, non-empty, max 20 characters) is inherited from
  Scenario 1 (`specs/001-room-setup-lobby/spec.md`) and is not re-specified here.
- **FR-008**: The game screen MUST poll the server at approximately 2-second intervals (same
  cadence as the lobby) to keep the snapshot current. The interval MUST be cleared on unmount.

### Key Entities

- **Room** (updated): gains `drawerId: string` — the participant ID of the designated drawer;
  gains `secretWord: string` — the word selected at game start.
- **RoomSnapshot** (viewer-scoped): `drawerId: string` always present for all viewers;
  `secretWord: string` present for the drawer; `wordPlaceholder: string` (e.g., `"_ _ _ _"`)
  present for guessers in place of the actual word.
- **Participant** (unchanged from Scenario 1).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After the host starts the game, the drawer's game screen shows the secret word
  within 3 seconds of the room transitioning to `active`.
- **SC-002**: 100% of guesser snapshots contain a word placeholder, not the actual secret word,
  verified by network inspection in the two-tab acceptance test.
- **SC-003**: The word-selection function, when called with the same room code in an automated
  test, returns the identical word on every invocation — zero variance across 100 calls.
- **SC-004**: All existing automated test suites (`schemas.test.ts`, `roomStore.test.ts`,
  `api.test.ts`) remain green after implementation.

## Assumptions

- The host is always the drawer in this scenario. Drawer rotation (different players drawing
  in subsequent rounds) is explicitly out of scope.
- The starter word list (`STARTER_WORDS`) contains at least one word and all entries are
  single-word strings (no spaces, no punctuation). The data invariant is satisfied by the
  existing seed data.
- The deterministic word-selection function uses the room code as its sole input (e.g., a
  sum/hash of character codes modulo the word list length). The exact algorithm is an
  implementation detail; what matters is reproducibility given the same room code.
- The character-count placeholder shown to guessers uses underscore-space format: one `_` per
  character separated by spaces (e.g., a four-letter word → `_ _ _ _`). This is a standard
  drawing-game convention.
- The game screen already exists as a placeholder (`GamePage.tsx`) in the starter. This
  scenario fills it with drawer/word information without redesigning the page structure.
- The game screen MUST poll the server every ~2 seconds (same cadence and mechanism as the
  lobby from Scenario 1) to detect future state changes. This is required for Scenario 3
  guess interactions and must be in place from the moment the game screen loads.
