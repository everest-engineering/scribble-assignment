# Spec 001 — Room Setup & Lobby

**Scenario 1.** Given a player wants to host or join a drawing game, when they
create or join a room via a unique code, then the creator is automatically the
host; invalid/empty codes are rejected with clear feedback; rooms are fully
isolated; the lobby refreshes via polling (~2s); and only the host can start the
game once at least 2 players are present.

## In scope for this group

- Host tracking at room creation.
- Join validation with clear, human-readable error messages.
- Verified multi-room isolation.
- Automatic lobby polling at ~2s.
- Host-only "start game", gated on a 2-player minimum.

> Player-name trimming/validation is specified in [002](../002-game-start-drawer-flow/spec.md);
> the actual round start (drawer + word) is also in 002. This group only adds the
> *host-only, 2-player* gate and the lobby plumbing.

## Behavior

### Host tracking
- On `POST /rooms`, the creator becomes the host. The room records `hostId` equal
  to the creator's participant id.
- The host is reported in every snapshot via `hostId`, and each participant view
  carries `isHost`.

### Join + code validation
- A room code is exactly 4 characters from the unambiguous alphabet
  `A–Z` + `2–9` (no `0/O/1/I`), matching the generator. Codes are compared
  case-insensitively (input is upper-cased before lookup).
- Empty or malformed codes (wrong length / illegal characters) are rejected with
  **400** and the message `Enter a valid 4-character room code`.
- A well-formed code that does not exist is rejected with **404** and the message
  `Room not found`.
- The frontend Join form trims/upper-cases the code, blocks submission of an empty
  code, and shows the server message verbatim on failure.

### Room isolation
- Each room is an independent entry in the in-memory store. Joining, polling, or
  (later) playing in one room must never read or mutate another. Participant ids
  are unique per person across rooms.

### Lobby polling (~2s)
- While on the lobby, the client polls `GET /rooms/:code` every **2000 ms** and
  re-renders the participant list, host marker, and player count.
- Polling stops when the lobby unmounts. A failed poll surfaces a non-fatal
  message and polling continues (transient errors do not crash the lobby).
- The manual "Refresh" affordance may remain but is no longer required for a
  second player to appear.

### Host-only start, 2-player minimum
- Only the host sees an **enabled** "Start Game" control. Non-hosts see a waiting
  message ("Waiting for the host to start…").
- The control is disabled until `participants.length >= 2`.
- `POST /rooms/:code/start` enforces both rules server-side:
  - not host → **403** `Only the host can start the game`
  - fewer than 2 players → **400** `Need at least 2 players to start`
  - not in `lobby` status → **409** `Game already started`

## Data / API changes

- `Room` gains `hostId`. `RoomStatus` grows to `"lobby" | "playing" | "results"`.
- `Participant` gains `score` (initialised to 0; used from group 3).
- Snapshot gains `hostId`, per-participant `isHost`/`isDrawer`, and a `viewer`
  block (`{ participantId, isHost, isDrawer, role }`).
- New endpoint `POST /rooms/:code/start` (full round behavior lands in group 2).

## Acceptance criteria

1. Creating a room returns a snapshot where `hostId` equals the creator's id and
   that participant's `isHost` is true.
2. `POST /rooms/ABCD/join` (or `GET`) with a 4-char code that does not exist
   returns 404 `Room not found`; a 3-char or symbol-laden code returns 400
   `Enter a valid 4-character room code`.
3. Two rooms created back-to-back have different codes and disjoint participant
   lists; adding a player to room A leaves room B unchanged.
4. With two tabs in the same room, the second player appears in tab 1 within ~2s
   **without** clicking refresh.
5. A non-host cannot start: the UI control is disabled/hidden and a direct
   `POST …/start` from a non-host returns 403.
6. The host cannot start with only 1 player: control disabled and the API returns
   400.
7. With 2+ players the host can start and the room transitions out of `lobby`.

## Edge cases

- Lower-case code input is accepted (upper-cased before lookup).
- Whitespace-only code is treated as empty → 400.
- A poll that errors once does not stop subsequent polls.
- Starting twice: the second start returns 409 rather than re-initialising state.
