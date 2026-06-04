# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer-flow`

**Created**: 2026-06-04

**Status**: Clarified

**Input**: User description: "Game Start & Drawer Flow — Brownfield enhancement of the Scribble starter. Scenario: Given a game is starting, When the first round begins, Then the host is assigned the drawer role; the secret word is deterministically selected from the starter seed list using the room code (sum of char codes modulo 5) so it varies by room but is reproducible; the secret word is stored on the backend and exposed ONLY to the drawer in the room snapshot via the existing viewerParticipantId mechanism; all other participants see a masked/absent word field; the game screen clearly identifies the drawer to all players."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Drawer Assignment on Game Start (Priority: P1)

When the host starts the game (room transitions to `playing`), the system atomically assigns
the host as the drawer and selects the secret word. No separate API call is needed — drawer
assignment and word selection happen as part of the existing `POST /rooms/:code/start` handler.

**Why this priority**: Drawer identity and the secret word are the foundational data for the
entire game flow. Without them, the game screen has nothing meaningful to display.

**Independent Test**: Start a 2-player game via `POST /rooms/:code/start` and inspect the
returned `RoomSnapshot`; confirm `drawerId` equals `hostId` and `currentWord` is a word from
the starter list derived from the room code.

**Acceptance Scenarios**:

1. **Given** a room with ≥2 players in `lobby` status, **When** the host calls Start Game,
   **Then** `room.drawerId` is set to `room.hostId`, `room.currentWord` is set to
   `STARTER_WORDS[sumOfRoomCodeCharCodes % 5]`, and `room.status` becomes `"playing"`.
2. **Given** the start-game response, **When** the caller is the drawer (host), **Then**
   the returned `RoomSnapshot` includes `currentWord` with the actual secret word.
3. **Given** the start-game response, **When** inspected by a non-drawer (any other participant
   fetching the room snapshot), **Then** `currentWord` in their snapshot is `null`.

---

### User Story 2 — Drawer Sees the Secret Word (Priority: P1)

On the game screen, only the drawer sees the secret word they must draw. All other players
see a generic "Guess the word!" prompt in place of the word. The word is never transmitted
to non-drawer clients.

**Why this priority**: Secret word visibility is a core game rule. Leaking the word to
guessers would break the game entirely.

**Independent Test**: Open the game screen in two tabs (host/drawer tab and a joiner tab).
Confirm the host tab displays the secret word; the joiner tab displays "Guess the word!".
Inspect network responses in the joiner tab and confirm `currentWord` is `null` in the
fetched snapshot.

**Acceptance Scenarios**:

1. **Given** the game is `playing` and the viewer is the drawer, **When** `GET /rooms/:code`
   is called with `?participantId=<drawerId>`, **Then** `RoomSnapshot.currentWord` contains
   the actual secret word string.
2. **Given** the game is `playing` and the viewer is NOT the drawer, **When**
   `GET /rooms/:code` is called with any other `participantId`, **Then**
   `RoomSnapshot.currentWord` is `null`.
3. **Given** the game is `playing` and no `participantId` query param is supplied, **When**
   `GET /rooms/:code` is called, **Then** `RoomSnapshot.currentWord` is `null`.
4. **Given** the frontend game screen, **When** the current participant is the drawer,
   **Then** the word panel displays the actual secret word.
5. **Given** the frontend game screen, **When** the current participant is NOT the drawer,
   **Then** the word panel displays "Guess the word!" and the secret word is never shown.

---

### User Story 3 — Drawer Identity Visible to All Players (Priority: P2)

All players on the game screen can see who the current drawer is by name. This tells guessers
whose turn it is and confirms the drawer's own role.

**Why this priority**: Knowing who is drawing is essential context for every player, but it
is purely display logic layered on top of the P1 core.

**Independent Test**: Open the game screen in two tabs. Confirm both tabs display the same
drawer name without any manual action.

**Acceptance Scenarios**:

1. **Given** the game is `playing`, **When** any player views the game screen, **Then** the
   screen displays the drawer's name (resolved from `room.drawerId` against `room.participants`).
2. **Given** the current player is the drawer, **When** they view the game screen, **Then**
   their own name is highlighted or labelled "You are the drawer".
3. **Given** the current player is not the drawer, **When** they view the game screen, **Then**
   the drawer's name is shown with a label such as "Drawing: [name]".

---

### User Story 4 — Game Screen Polls for Consistent State (Priority: P2)

The game screen polls the room endpoint every ~2 seconds, using the same pattern as the lobby.
This ensures that if the game is started in one tab, all tabs transition to a consistent game
state without any manual action.

**Why this priority**: Without polling, a non-host tab that was already on the game screen
(navigated by poll detection in Scenario 1) would show stale or empty drawer/word state.

**Independent Test**: Navigate to the game screen in two tabs after starting a game. Confirm
both tabs show the correct drawer name and word visibility state without manual refresh.

**Acceptance Scenarios**:

1. **Given** a player is on the game screen, **When** the component mounts, **Then** polling
   starts at ~2s intervals calling `GET /rooms/:code`.
2. **Given** a player navigates away from the game screen, **When** the component unmounts,
   **Then** polling stops and no further network requests are made.
3. **Given** a poll fails (network or server error), **When** the error is received, **Then**
   an inline error message is shown and polling continues on the next interval.

---

### Edge Cases

- What happens when `drawerId` is looked up against `participants` and the participant has
  left (tab closed)? The drawer name lookup returns `undefined`; the UI MUST fall back to
  "Unknown drawer" rather than crashing.
- What if `GET /rooms/:code` is called without `participantId` after the game starts? The
  snapshot MUST return `currentWord: null` (treat as non-drawer viewer).
- What if two tabs for the same participant both call `GET /rooms/:code` simultaneously? Both
  receive identical snapshots; no race condition exists because the word is read-only after
  assignment.
- What if the room code produces the same word index for different rooms? This is expected
  behaviour — different room codes may coincidentally map to the same word; this is not a bug.
- What if `room.status` is not `"playing"` when the game screen loads (e.g., user navigates
  directly to `/game`)? The frontend MUST redirect to `/` (home screen) if no active room
  session exists in frontend state — consistent with the lobby redirect pattern.
- What if `drawerId` is non-null but the game screen renders before the first poll completes?
  The component MUST render a "Loading game..." state until `drawerId` is confirmed non-null
  from the snapshot; it MUST NOT attempt to resolve a drawer name from a null `drawerId`.
- What label is shown when the drawer participant cannot be resolved from `room.participants`?
  The UI MUST display "Unknown drawer" as the fallback label; it MUST NOT crash or render
  an empty element.
- Where are game screen poll errors displayed? Inline below the drawer/word panel, using the
  same `pollError` state pattern established in Scenario 1 (lobby Status card).
- Is `currentWord` ever omitted from `RoomSnapshot`? No — `currentWord` is always present
  in the snapshot shape; it carries `null` when the room is in lobby state or the viewer is
  not the drawer. The field is never absent.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When the host starts the game, the system MUST atomically set `room.drawerId =
  room.hostId` and `room.currentWord = STARTER_WORDS[wordIndex]` where
  `wordIndex = (sum of room.code char codes) % STARTER_WORDS.length`.
- **FR-002**: Word selection MUST be deterministic and derived solely from the room code;
  `Math.random()` or any non-deterministic source MUST NOT be used.
- **FR-003**: The `GET /rooms/:code` endpoint MUST return `currentWord` as the actual word
  string when `viewerParticipantId === room.drawerId`, and `null` in all other cases.
- **FR-004**: `RoomSnapshot` MUST include a `drawerId: string | null` field visible to all
  viewers and a `currentWord: string | null` field that is viewer-gated.
- **FR-005**: The frontend game screen MUST display the secret word to the drawer and display
  "Guess the word!" to all non-drawer participants.
- **FR-006**: The frontend game screen MUST display the current drawer's name to all players.
- **FR-007**: The drawer MUST be labelled "You are the drawer" when viewing their own game
  screen.
- **FR-008**: The game screen MUST poll `GET /rooms/:code` at approximately 2-second intervals
  on mount and stop polling on unmount.
- **FR-009**: Poll errors on the game screen MUST be shown inline and MUST NOT stop the
  polling interval.
- **FR-010**: If a player lands on the game screen with no active room session in frontend
  state, the frontend MUST redirect them to `/` (home screen) — same pattern as the lobby
  redirect guard.
- **FR-011**: The game screen MUST render a "Loading game..." state when `room.drawerId` is
  `null` at render time; it MUST NOT attempt drawer name resolution until `drawerId` is
  non-null.
- **FR-012**: When `room.drawerId` cannot be matched to any participant in
  `room.participants`, the drawer name MUST fall back to "Unknown drawer".
- **FR-013**: Game screen poll errors MUST be displayed inline below the drawer/word panel
  using the same `pollError` state pattern as the lobby; the interval MUST continue.
- **FR-014**: `RoomSnapshot.currentWord` and `RoomSnapshot.drawerId` MUST always be present
  in the response shape; they carry `null` when unset (lobby state or non-drawer viewer)
  and are never omitted.

### Key Entities

- **Room** (extended): adds `drawerId: string | null` (set at game start; `null` in lobby)
  and `currentWord: string | null` (set at game start; `null` in lobby and for non-drawers
  in snapshot).
- **RoomSnapshot** (extended): adds `drawerId: string | null` (always forwarded) and
  `currentWord: string | null` (viewer-gated: actual word for drawer, `null` for all others).
- **Participant** (unchanged): identity, display name, join timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After the host starts the game, the drawer tab shows the correct secret word
  within one poll cycle (~2 seconds) without any manual action.
- **SC-002**: The non-drawer tab never displays the secret word under any condition; network
  inspection confirms `currentWord: null` in all non-drawer responses.
- **SC-003**: Both tabs display the same drawer name consistently without manual refresh.
- **SC-004**: The secret word is always one of the five starter words and is the same every
  time the same room code is used to start a game.
- **SC-005**: Navigating away from the game screen stops all polling; no further requests
  are made for that tab after unmount.

## Assumptions

- The drawer is always the host (`room.hostId`) for the first and only round; no drawer
  rotation logic is introduced (out of scope per constitution Principle IV).
- Word index derivation: `Array.from(room.code).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % STARTER_WORDS.length`.
- `drawerId` and `currentWord` are set once at game start and are immutable for the duration
  of the `playing` state; they are reset only when the room returns to `lobby` (Scenario 4,
  out of scope here).
- The `viewerParticipantId` parameter already exists in the starter's `GET /rooms/:code`
  query and in `toRoomSnapshot`'s signature but is currently ignored (`void viewerParticipantId`);
  this scenario activates it.
- Both `currentWord` and `drawerId` fields are always present in `RoomSnapshot` (never
  omitted); they carry `null` when unset. This avoids optional-chaining on the field itself
  and allows simple `room.currentWord ?? "Guess the word!"` patterns on the frontend.
- The game screen (`GamePage.tsx`) is currently a placeholder; this scenario wires up the
  drawer identity display and word reveal panel only — canvas, guess input, and scoring are
  Scenario 3.
- In-memory session loss on page refresh is expected and out of scope; no recovery mechanism
  is required.
- The game screen redirect guard (FR-010) uses `replace: true` navigation to prevent the
  browser back button from returning to an invalid game screen.
- The "Loading game..." guard (FR-011) is a transient state only; once the first successful
  poll returns with a non-null `drawerId`, the full game screen renders.
- Poll errors on the game screen are non-fatal; the existing `pollError` pattern from
  Scenario 1's `RoomStore` is reused.
- No new top-level npm dependencies are introduced.
