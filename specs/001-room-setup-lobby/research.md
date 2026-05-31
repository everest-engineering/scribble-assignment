# Research: Room Setup & Lobby

**Feature**: `001-room-setup-lobby`  
**Date**: 2026-05-31

## R1 — Lobby sync mechanism

**Decision**: Fixed-interval HTTP polling every 2000 ms on `LobbyPage` via `useEffect` + `setInterval`, calling existing `roomStore.fetchRoom()`.

**Rationale**: Constitution forbids WebSockets. Starter already exposes `GET /rooms/:code`; manual refresh proves the fetch path works. A 2 s interval matches spec SC-002 and clarification assumptions.

**Alternatives considered**:
- Long polling — rejected; adds backend complexity with no lab benefit.
- Manual refresh only — rejected; fails FR-008.
- WebSockets — forbidden by constitution.

## R2 — Host authority model

**Decision**: Persist `hostId` on `Room` at creation time (first participant's id). Expose `hostId` on every `RoomSnapshot`. All host-only actions verify `participantId === hostId` on the server.

**Rationale**: Server-authoritative permissions prevent client-only start (current starter bug). Snapshot field lets all clients render `(Host)` label and hide/disable start for non-hosts.

**Alternatives considered**:
- Infer host as first participant in array — rejected; implicit and brittle if order changes.
- Client-only role flag — rejected; fails FR-009/FR-011.

## R3 — Game start transition (Scenario 1 scope)

**Decision**: Add `POST /rooms/:code/start` with body `{ participantId }`. On success, set `room.status` from `"lobby"` to `"playing"`. No drawer/word assignment in this feature (Scenario 2).

**Rationale**: Spec clarifications require server-recorded start and auto-navigation when status leaves lobby. Minimal status flip satisfies FR-011 without implementing Scenario 2 gameplay.

**Alternatives considered**:
- Reuse GET with action query param — rejected; non-RESTful and harder to test.
- Client-only navigation — rejected; fails FR-011 and clarification Q1.

## R4 — Join error differentiation

**Decision**: Use distinct HTTP status codes and messages:
- Client-side: empty code, format error (before API).
- `404` + `"Room not found"` — unknown code.
- `409` + `"Game already in progress"` — room exists but `status !== "lobby"`.
- `400` — invalid params (Zod).

**Rationale**: Matches FR-004–FR-006, FR-014 and clarification Q2/Q5. Frontend maps messages to user-facing copy.

**Alternatives considered**:
- Single generic 404 for all join failures — rejected; fails SC-003.

## R5 — Room code validation

**Decision**: Shared rule — exactly 4 characters from alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, case-insensitive input normalized to uppercase. Regex: `^[A-HJ-NP-Z2-9]{4}$` (after uppercasing).

**Rationale**: Matches starter `generateCode()` in `roomStore.ts` and spec clarification Q5.

**Alternatives considered**:
- Server-only validation — rejected for format errors; spec requires pre-API format error (US2 scenario 4).

## R6 — Auto-navigation to game

**Decision**: In lobby polling callback, when `room.status === "playing"`, `navigate("/game", { replace: true })` for all clients.

**Rationale**: Clarification Q1. Game page remains placeholder until Scenario 2–3; route guard on GamePage can redirect if no room session.

**Alternatives considered**:
- Host-only immediate navigate — rejected by clarification.

## R7 — Manual refresh retention

**Decision**: Keep existing **Refresh Room** button; it calls the same `fetchRoom()` as polling without resetting the interval.

**Rationale**: Clarification Q3 (optional supplement). Zero conflict with auto polling.
