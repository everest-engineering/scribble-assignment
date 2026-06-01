# Research: Host and Join Game Rooms

**Feature**: `001-host-join-rooms` | **Date**: 2026-06-01

## R1: Lobby sync mechanism

- **Decision**: HTTP polling every **2 seconds** on `LobbyPage` via `GET /rooms/:code?participantId=...`.
- **Rationale**: Matches spec FR-008 and README; constitution forbids WebSockets. Starter already has manual refresh—extend to interval polling with cleanup on unmount.
- **Alternatives considered**: Manual-only refresh (rejected—fails SC-004); Server-Sent Events (rejected—out of scope / not in stack).

## R2: Client session persistence (resume)

- **Decision**: Persist `{ roomCode, participantId }` in **sessionStorage** on create/join; hydrate on lobby load and pass `participantId` on poll.
- **Rationale**: Supports FR-018 resume after refresh without re-entering code; sessionStorage clears per tab close (aligns with disconnect semantics when combined with server-side presence).
- **Alternatives considered**: localStorage (persists across tabs—undesired for “new session”); cookies (rejected—no auth stack).

## R3: Disconnect and empty-room cleanup

- **Decision**: Track `lastSeenAt` per participant; each successful poll **or** mutating request refreshes it. Background job on each room access: remove participants where `now - lastSeenAt > 30s`; delete room when participant list empty.
- **Rationale**: Implements FR-016/FR-017 without WebSockets; 30s grace covers brief refresh/network blips before spec’s “prolonged unreachable.”
- **Alternatives considered**: Immediate remove on tab close (impossible without WS); explicit leave button only (rejected—clarification requires disconnect).

## R4: Host identity and start-game gate

- **Decision**: Store `hostParticipantId` on `Room` at creation; expose `isHost` on snapshot via viewer `participantId`. Add `POST /rooms/:code/start` (host-only, ≥2 participants, status `lobby` only).
- **Rationale**: FR-002, FR-009–FR-011, FR-015; replaces client-only `navigate("/game")` in starter.
- **Alternatives considered**: First participant is host (rejected—spec assigns creator as host).

## R5: Validation and error messaging

- **Decision**: Trim names server-side; Zod `.trim().min(1)` for create/join; distinct HTTP statuses: `400` validation, `404` unknown room, `409` room full / game started.
- **Rationale**: Constitution name rules + FR-005/006/015/019; clear client messages per spec.
- **Alternatives considered**: Client-only validation (rejected—constitution and FR require server enforcement).

## R6: Room capacity and code rules

- **Decision**: `MAX_PARTICIPANTS = 10`; 4-char codes from existing alphabet; normalize codes to uppercase in store and API.
- **Rationale**: Clarified cap FR-019; existing `generateCode()` in starter; FR-014 case insensitivity.
