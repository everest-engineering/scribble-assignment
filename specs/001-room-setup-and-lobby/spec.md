# Feature Group 1 — Room Setup & Lobby

Covers Business Scenario 1. Establishes host identity at room creation, clear
validation for joining, verified room isolation, automatic lobby polling, and a
host-only start gate.

## User scenario

> **Given** a player wants to host or join a drawing game, **When** they create
> or join a room via a unique code, **Then** the creator is automatically the
> host; invalid/empty codes are rejected with clear feedback; rooms are fully
> isolated; the lobby refreshes via polling (~2s); and only the host can start
> the game once at least 2 players are present.

## In scope

- Mark the room creator as the host and expose host identity to clients.
- Validate room codes on join with specific, user-facing error messages.
- Automatic lobby polling roughly every 2 seconds, replacing manual-only refresh.
- A "Start Game" control that is enabled only for the host and only when at least
  2 participants are present.
- Confirm multiple rooms are fully isolated (participants and state never leak
  between codes).

## Out of scope

Drawer assignment, word selection, and any gameplay (Groups 2–4). No persistence,
auth, WebSockets, or new libraries. Player-name trimming is specified in Group 2.

## Functional requirements

1. **Host tracking.** Creating a room records the creator's participant id as the
   room's host. Every room snapshot includes `hostId`. Joining a room does not
   change the host.
2. **Join validation.** Room codes are normalized to uppercase. A code that is
   empty, malformed (not the 4-character code shape), or not an existing room is
   rejected with a clear message:
   - empty/whitespace code → "Enter a room code."
   - well-formed but unknown code → "Room not found."
   - The client shows the message and does not navigate to the lobby.
3. **Room isolation.** Operations on one room code never read or mutate another
   room. Two rooms created in the same backend instance have independent
   participant lists and host ids.
4. **Automatic lobby polling.** While on the lobby, the client fetches the room
   snapshot about every 2 seconds and re-renders the participant list. Polling
   starts on entering the lobby and stops on leaving. A manual refresh may remain
   but is not required for new joins to appear.
5. **Host-only start with minimum players.** The "Start Game" control is enabled
   only when the viewer is the host and the room has ≥2 participants. Non-hosts
   see a disabled control with context (e.g. "Waiting for the host"). The host
   sees a disabled control until a second player joins.

## Acceptance criteria

- AC1: `POST /rooms` returns a snapshot whose `hostId` equals the creator's
  `participantId`.
- AC2: A second player joining via `POST /rooms/:code/join` appears in the
  snapshot; `hostId` is unchanged.
- AC3: Joining with an empty code shows "Enter a room code." and stays on the
  Join page; joining a well-formed unknown code shows "Room not found."
- AC4: Two rooms (codes A and B) created in one backend instance have disjoint
  participant lists; fetching A never returns B's participants.
- AC5: With the lobby open in tab 1, a join from tab 2 appears in tab 1 within
  ~2 seconds without a manual refresh.
- AC6: With one participant, "Start Game" is disabled for the host. With ≥2
  participants, it is enabled for the host only; non-hosts never see it enabled.

## Edge cases

- Lowercase or mixed-case codes resolve to the same room (uppercase normalize).
- Leaving the lobby (navigation/unmount) stops polling — no requests after exit.
- A failed poll surfaces an error but does not crash the lobby or stop subsequent
  polls.
