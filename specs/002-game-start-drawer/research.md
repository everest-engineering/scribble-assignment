# Phase 0 Research: Game Start & Drawer Flow

The spec carried no open `[NEEDS CLARIFICATION]` markers. This records the design decisions that
turn the spec's observable requirements into concrete, deterministic choices.

## D1 — Active-round status

- **Decision**: Extend `RoomStatus` to `"lobby" | "playing"`. The room enters `"playing"` when
  the host starts; it stays `"lobby"` otherwise.
- **Rationale**: A single status field is the minimal signal every polling client already reads,
  so detecting "the round began" needs no new mechanism. Matches the existing snapshot shape.
- **Alternatives considered**: A separate `round` object with its own lifecycle flags — rejected
  as over-modeling for one round; a boolean `started` — rejected because a named status reads
  clearly and extends cleanly for Scenario 4 (e.g., a future `"result"`).

## D2 — Start action & host authorization

- **Decision**: Add `POST /rooms/:code/start` with body `{ participantId }`. The handler verifies
  the room exists, the requester `participantId === room.hostId`, and `participants.length >= 2`,
  then assigns the drawer, selects the word, and sets `status = "playing"`. Errors:
  `404` (no room), `403` (not host), `409` (fewer than 2 players).
- **Rationale**: Re-checking preconditions server-side keeps the rule authoritative regardless of
  UI state (constitution III/II). Passing `participantId` is consistent with the project's
  no-auth model where identity is the participant id already issued on create/join.
- **Alternatives considered**: Trusting the client's "I am host" flag — rejected; the server must
  enforce. A generic `PATCH /rooms/:code` status update — rejected as less explicit than a named
  `start` action.

## D3 — Deterministic word selection

- **Decision**: Select the secret word once at start via a pure function of the room code:
  `index = sum(charCodeAt of each code char) % STARTER_WORDS.length`, then store `secretWord` on
  the room so it is fixed for the round. Snapshots read the stored value; they never re-select.
- **Rationale**: A function of the stable room code is deterministic and reproducible (same room →
  same word), satisfying constitution III and making the behavior unit-testable. Storing it at
  start guarantees stability across refreshes (FR-010) and avoids per-request drift.
- **Alternatives considered**: `Math.random()` — forbidden by the determinism principle.
  Always index 0 — deterministic but trivially uniform across rooms; the code-derived index gives
  variety while staying deterministic. Time-based selection — rejected (non-reproducible).

## D4 — Drawer assignment

- **Decision**: `drawerId = room.hostId` at start (the host is always the first participant).
  All other participants are guessers by exclusion. `isDrawer` is derived per viewer in the
  snapshot.
- **Rationale**: The spec defines the drawer as the host/first player; reusing `hostId` keeps a
  single source of truth and guarantees exactly one drawer (FR-005, single-drawer invariant).
- **Alternatives considered**: A separate stored role per participant — rejected as redundant with
  `drawerId`; roles are cleanly derived (`id === drawerId ? drawer : guesser`).

## D5 — Drawer-only secret-word visibility

- **Decision**: `toRoomSnapshot(room, viewerParticipantId)` returns `secretWord` **only** when the
  viewer is the drawer; for everyone else `secretWord` is `null`. The word is stripped on the
  server, never sent to guessers.
- **Rationale**: Hiding the word only in the UI would still ship it to the client (FR-011 says the
  guesser's *data* must not contain it). Server-side stripping is the only way to make this true.
- **Alternatives considered**: Sending the word to all and hiding in CSS/JS — rejected (leaks via
  network/devtools). A separate "word" endpoint guarded by drawer check — viable but redundant
  with the snapshot the client already polls.

## D6 — Synced lobby→game transition

- **Decision**: Reuse the Scenario 1 polling. LobbyPage's poll observes `status === "playing"` and
  navigates to `/game`; GamePage also runs the poller (start on mount / stop on unmount) so the
  game view stays current and ready for Scenario 3.
- **Rationale**: No new real-time mechanism (constitution II); the poller already exists and is
  the intended carrier of cross-client state. Running it on both views keeps continuity across the
  route change.
- **Alternatives considered**: A global always-on poller in the store provider — rejected as
  broader than needed; view-scoped polling matches the existing pattern and stops when idle.

## D7 — Player-name validation

- **Decision**: Change `playerName` in `createRoomSchema`/`joinRoomSchema` to
  `z.string().trim().min(1)` (required, trimmed). The store stops defaulting blanks to "Player".
  Client forms block empty/whitespace submissions with a clear message before calling the API.
- **Rationale**: Server-side trim+min(1) is the authoritative rule (FR-012/013); the client guard
  gives immediate feedback. Trimming at the schema means the stored/displayed name is already
  clean (FR-014).
- **Alternatives considered**: Keeping the "Player" default — rejected; the spec requires explicit
  rejection. Length/charset limits — out of scope per spec assumptions.
