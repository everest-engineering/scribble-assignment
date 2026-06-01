# Feature 001 — Room Setup & Lobby

## User story

As a player, I want to create or join an isolated room with a clear host and an auto-updating lobby so that I can start a game when enough friends have joined.

## Acceptance criteria

### Host on create

- **Given** a player creates a room with a valid trimmed name, **When** `POST /rooms` succeeds, **Then** that participant is recorded as `hostId` and marked as host in lobby snapshots for all viewers.

### Name validation

- **Given** a player submits a name that is empty or whitespace-only on create or join, **When** the form is submitted, **Then** the API returns `400` with a clear message and the UI shows the error without navigating away.

### Join validation

- **Given** a player joins with a missing, malformed (not 4 valid characters), or unknown room code, **When** join is attempted, **Then** the client and/or API reject with clear feedback (e.g. “Room not found” for unknown codes).

### Room isolation

- **Given** two rooms A and B exist, **When** players fetch or join by code, **Then** each room’s participant list only reflects members of that room.

### Lobby polling

- **Given** a player is on the lobby screen, **When** the room exists, **Then** the client polls `GET /rooms/:code` approximately every 2 seconds and updates participants without manual refresh.

### Host-only start

- **Given** at least two participants and the viewer is the host, **When** the host clicks Start, **Then** `POST /rooms/:code/start` succeeds and navigates to the game route.
- **Given** the viewer is not the host or fewer than two participants, **Then** the Start control is disabled with explanatory copy.
- **Given** a non-host, **When** they call start directly, **Then** the API returns `403`.

## Edge cases

- Duplicate names in one room are allowed (not in scope to forbid).
- Backend restart clears all rooms (in-memory store).
- Room codes are normalized to uppercase on join and fetch.

## Out of scope

WebSockets, persistence, passwords, kick/mute, spectator mode.
