# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `assignment`

**Created**: 2026-05-28

**Status**: Draft

**Feature Directory**: `specs/002-game-start-drawer-flow`

---

## Overview

When the host starts the game, the first round begins. The host is automatically
assigned as the drawer. A secret word is deterministically selected from the
starter word list. The drawer sees the secret word; all other participants
(guessers) do not.

This group builds on Feature Group 1 (room setup and lobby) — the game can only
start after `POST /rooms/:code/start` transitions the room to `"playing"` status.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Drawer Assignment (Priority: P1)

When a game starts, the room creator (host) becomes the drawer for the round.
The drawer's identity is clearly communicated to all participants.

**Why this priority**: Drawer assignment is the foundation of every round —
nothing else in the game works without knowing who is drawing.

**Independent Test**: Host starts the game. On the host's game screen, confirm
they are identified as the drawer. On a second player's screen, confirm they are
identified as a guesser.

**Acceptance Scenarios**:

1. **Given** a room is in `"playing"` status, **When** any player views the game
   screen, **Then** the room snapshot identifies the host (`hostId`) as the
   drawer for this round.

2. **Given** the game screen loads for the host (drawer), **When** the player
   info area is rendered, **Then** the drawer's role is shown as "Drawer".

3. **Given** the game screen loads for a non-host (guesser), **When** the player
   info area is rendered, **Then** the guesser's role is shown as "Guesser".

---

### User Story 2 — Deterministic Secret Word Selection (Priority: P1)

The secret word for the round is selected deterministically from the starter word
list. For round 1 (the only round in this lab), the word is always the first word
in the list: `"rocket"`.

**Why this priority**: The word must be consistent across all clients — everyone
must agree on what the correct answer is for scoring to work correctly.

**Independent Test**: Start a game. Verify the drawer sees "rocket" as the secret
word. Verify that restarting a fresh game also produces "rocket" (deterministic).

**Acceptance Scenarios**:

1. **Given** the game starts for the first (and only) round, **When** the secret
   word is selected, **Then** it is always `"rocket"` — the first word in
   `STARTER_WORDS`.

2. **Given** the room snapshot is returned to any player, **When** the selection
   formula is applied (`STARTER_WORDS[0]`), **Then** the result is always
   `"rocket"` regardless of which player requests it or when.

---

### User Story 3 — Drawer-Only Word Visibility (Priority: P1)

The secret word is visible only to the drawer. Guessers see a placeholder (e.g.
`"_ _ _ _ _ _"`) or no word at all — they must not be able to see the word in
the API response or the UI.

**Why this priority**: If guessers can see the secret word, the game is broken.
This is the primary privacy requirement for the game.

**Independent Test**: Start a game. On the drawer's screen, the word "rocket"
is visible. On a guesser's screen, the word is not shown. Inspect the network
response for each player — the guesser's response must not contain the secret
word.

**Acceptance Scenarios**:

1. **Given** the game is in `"playing"` status, **When** `GET /rooms/:code` is
   called with the drawer's `participantId`, **Then** the response includes
   `secretWord: "rocket"`.

2. **Given** the game is in `"playing"` status, **When** `GET /rooms/:code` is
   called with a guesser's `participantId` (or no `participantId`), **Then** the
   response does NOT include `secretWord` (field is absent or `null`).

3. **Given** the drawer is on the game screen, **When** the UI renders, **Then**
   the secret word `"rocket"` is displayed prominently to the drawer.

4. **Given** a guesser is on the game screen, **When** the UI renders, **Then**
   no secret word is displayed to the guesser.

---

### Edge Cases

- Game screen loaded without a room in state (e.g. page refresh): redirect to `/`.
- Drawer role derived from `hostId === participantId` — consistent with Group 1.
- `secretWord` absent from guesser's snapshot must not cause a UI crash.
- Word selection formula is `STARTER_WORDS[0]` — hardcoded for the single round;
  no index arithmetic needed beyond the first element.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The room model MUST store `drawerId` when status transitions to
  `"playing"`; `drawerId` MUST equal `hostId`.
- **FR-002**: The room model MUST store `secretWord` when status transitions to
  `"playing"`; `secretWord` MUST be `STARTER_WORDS[0]` (`"rocket"`).
- **FR-003**: `GET /rooms/:code` MUST return `secretWord` in the snapshot when
  the requesting `participantId` equals `drawerId`.
- **FR-004**: `GET /rooms/:code` MUST NOT return `secretWord` (or return `null`)
  when the requesting `participantId` does not equal `drawerId`.
- **FR-005**: The game screen MUST display the player's role ("Drawer" or
  "Guesser") based on whether `participantId === room.drawerId`.
- **FR-006**: The game screen MUST display `secretWord` to the drawer and MUST
  NOT display it to guessers.
- **FR-007**: `POST /rooms/:code/start` MUST set `drawerId = hostId` and
  `secretWord = STARTER_WORDS[0]` when transitioning to `"playing"`.

### Key Entities

- **Room** (extended): adds `drawerId: string` and `secretWord: string` fields,
  set on transition to `"playing"`.
- **RoomSnapshot** (role-aware): `drawerId` always present; `secretWord` present
  only when viewer is the drawer, absent (or `null`) otherwise.
- **ViewerRole**: derived client-side as `"drawer"` if `participantId === drawerId`,
  else `"guesser"`.

---

## Success Criteria *(mandatory)*

- **SC-001**: On the drawer's game screen, the secret word `"rocket"` is visible
  and the role label reads "Drawer".
- **SC-002**: On a guesser's game screen, no secret word is visible and the role
  label reads "Guesser".
- **SC-003**: Inspecting the network response for a guesser's `GET /rooms/:code`
  call confirms `secretWord` is absent or `null` — the word is not leaked.
- **SC-004**: Starting two separate games always produces `"rocket"` as the secret
  word (deterministic, not random).

---

## Assumptions

- There is exactly one round per game session in this lab; word index is always 0.
- The drawer is always the host (`drawerId === hostId`); no rotation occurs.
- `secretWord` visibility is enforced server-side by conditionally including it
  in `toRoomSnapshot()` based on `viewerParticipantId`.
- The existing `viewerParticipantId` parameter in `toRoomSnapshot()` (currently
  unused in the starter) is the hook for this role-aware response.
- Guessers seeing `secretWord: null` vs. field absent are equivalent — the UI
  treats both as "no word to display".
- `STARTER_WORDS[0]` is `"rocket"` — this is a constant, not a lookup.
