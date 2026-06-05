# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer`

**Created**: 2026-06-05

**Status**: Draft

**Input**: Business Scenario 2 — "Given a game is starting and player names are
trimmed (empty/whitespace-only rejected with a message), When the first round
begins, Then the host (or first player) becomes the clearly-identified drawer, and
the secret word (deterministically selected from the starter list) is visible only
to the drawer."

## Clarifications

### Session 2026-06-05

- Q: Where is player-name validation enforced? → A: Both layers. The client
  trims and blocks empty/whitespace before submit ("Name is required"); the
  backend also trims and rejects empty names via Zod (defense in depth), returning
  a 400 with a clear message.
- Q: How is the secret word chosen deterministically? → A: An internal
  monotonically increasing room-creation counter; the word index is
  `(counter - 1) % STARTER_WORDS.length` captured at room creation, so the first
  room created gets `rocket`, the second `pizza`, etc. No `Math.random()`.
- Q: When is the word index decided — at create or at start? → A: At create time
  the index is fixed and stored on the room; it is only revealed (as `word`) once
  the game is `playing` and only to the drawer.
- Q: What does a guesser see for the word while playing? → A: The snapshot omits
  `word` entirely for non-drawers (field is `undefined`), so the secret cannot
  leak over the wire.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Validated player names (Priority: P1)

A player must provide a non-empty, trimmed name when creating or joining; blank or
whitespace-only names are rejected with a clear message.

**Why this priority**: Names identify drawer vs. guessers and appear in the
roster/scoreboard; blank names break identity throughout the game.

**Independent Test**: Try to create/join with "   " and with "Alice "; confirm the
first is rejected with "Name is required" and the second is accepted as "Alice".

**Acceptance Scenarios**:

1. **Given** the Create or Join form, **When** the player submits an empty or
   whitespace-only name, **Then** submission is blocked with "Name is required"
   and no room is created/joined.
2. **Given** a name with surrounding whitespace, **When** the player submits,
   **Then** the stored name is trimmed.
3. **Given** the backend receives an empty/whitespace name directly, **When** it
   validates, **Then** it responds 400 with a clear message (defense in depth).

---

### User Story 2 - Host starts the game and becomes drawer (Priority: P1)

The host starts the game; the room transitions to `playing`, and the host is the
clearly-identified drawer for the round.

**Why this priority**: Starting the round and assigning the drawer is the gateway
from lobby to gameplay.

**Independent Test**: With 2 players, host starts; confirm room status becomes
`playing`, the host is marked drawer, and both clients (via polling) see the
playing state.

**Acceptance Scenarios**:

1. **Given** a lobby with ≥2 players, **When** the host starts the game, **Then**
   the room status becomes `playing` and `drawerId` equals the host's id.
2. **Given** the game has started, **When** a non-host client polls, **Then** it
   sees `status: "playing"` and is auto-navigated from the lobby to the game.
3. **Given** fewer than 2 players, **When** a start is attempted, **Then** the
   backend rejects it (start requires ≥2 players).

---

### User Story 3 - Deterministic, drawer-only secret word (Priority: P1)

The secret word is chosen deterministically and shown only to the drawer; guessers
never receive it.

**Why this priority**: Drawer-only visibility is the core fairness rule of the
game; a leaked word ruins the round.

**Independent Test**: Start a game; confirm the drawer's snapshot includes a
`word` from the starter list (deterministic by creation order) and the guesser's
snapshot has no `word`.

**Acceptance Scenarios**:

1. **Given** a started game, **When** the drawer views the game screen, **Then**
   the secret word is displayed to them.
2. **Given** a started game, **When** a guesser views the game screen, **Then**
   no word is shown and the snapshot omits `word`.
3. **Given** rooms created in order, **When** each starts, **Then** the chosen
   word follows `STARTER_WORDS[(creationCount-1) % length]` (rocket, pizza,
   castle, guitar, sunflower, rocket, …).

---

### Edge Cases

- A non-host attempting `POST /rooms/:code/start` is rejected (host-only).
- Starting an already-`playing` room is idempotent or rejected (does not
  re-pick the word or change the drawer).
- A whitespace-only name reaching the backend is rejected even if the client
  guard is bypassed.
- The deterministic counter is process-local (in-memory); a backend restart
  resets it to start at `rocket` again — acceptable per in-memory constraint.
- The guesser snapshot must omit `word` (not send empty string) so it cannot be
  inspected in network traffic.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Player names MUST be trimmed; empty or whitespace-only names MUST be
  rejected on the client with "Name is required" before any request.
- **FR-002**: The backend create/join schemas MUST trim and reject empty names,
  returning a 400 with a clear message.
- **FR-003**: `RoomStatus` MUST be extended to `"lobby" | "playing"`.
- **FR-004**: A `POST /rooms/:code/start` endpoint MUST exist; it MUST be
  host-only and MUST require ≥2 participants.
- **FR-005**: On start, the room status MUST become `"playing"` and `drawerId`
  MUST be set to the host's id.
- **FR-006**: The secret word MUST be selected deterministically from
  `STARTER_WORDS` using a room-derived index (creation order), never
  `Math.random()`.
- **FR-007**: The room snapshot MUST include `word` ONLY for the drawer (matched
  by `viewerParticipantId === drawerId`); for everyone else `word` MUST be
  omitted.
- **FR-008**: The snapshot MUST expose `drawerId` so clients can identify the
  drawer and show role labels.
- **FR-009**: The lobby MUST detect `status === "playing"` via polling and
  navigate all participants to the game screen.
- **FR-010**: The game screen MUST display the drawer's role + secret word to the
  drawer, and a guesser role (no word) to others.

### Key Entities

- **Room** (extended): adds `status` value `"playing"`, `drawerId: string`, a
  fixed `wordIndex: number` chosen at creation, and `word` derivable from
  `STARTER_WORDS[wordIndex]` when playing.
- **RoomSnapshot** (extended): adds `drawerId?: string` and `word?: string`
  (present only for the drawer while playing).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Whitespace-only names are rejected 100% of the time on both client
  and backend; trimmed names are stored without surrounding spaces.
- **SC-002**: After a host start with ≥2 players, both tabs reach the game screen
  within ~2s, with the host identified as drawer.
- **SC-003**: The drawer sees the secret word; the guesser's snapshot never
  contains `word` (verifiable in network response).
- **SC-004**: Word selection is reproducible by creation order across a fresh
  backend (rocket, pizza, castle, guitar, sunflower, repeat).
- **SC-005**: A non-host or <2-player start request is rejected by the backend.

## Assumptions

- "Host or first player" resolves to the host (`hostId`), which for room creation
  is the first player — so drawer = host. No drawer rotation (out of scope).
- Single round: the word is chosen once at creation and revealed at start; there
  is no re-pick.
- The deterministic counter lives in the in-memory store and resets on restart;
  this satisfies determinism within a process run.
- Name validation augments, and does not replace, Scenario 1's room/code rules.
- Polling cadence and resilience follow Scenario 1 (2s, non-fatal failures).
