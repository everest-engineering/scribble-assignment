# Phase 0 Research: Room Setup & Lobby

All open questions from the spec were resolved during `/speckit.clarify` (Session 2026-06-17). This file
records the resulting technical decisions, each with rationale and the alternatives rejected.

## D1 — How to represent the host

**Decision**: Add a `hostId: string` field to `Room`, set to the creator participant's `id` at creation.
Expose `hostId` in `RoomSnapshot`; the client derives `isHost = participantId === hostId`.

**Rationale**: Minimal, brownfield-friendly change. Participants already have stable `id`s (UUIDs). A single
field avoids a separate role table and works with the existing snapshot/clone logic. Satisfies FR-001.

**Alternatives considered**:
- Per-participant `isHost` boolean — redundant data that can drift out of sync with a single source of truth.
- Inferring host as `participants[0]` — fragile if participant ordering ever changes (e.g., future leave flow).

## D2 — Representing the "started" state

**Decision**: Widen `RoomStatus` from `"lobby"` to `"lobby" | "active"`. `startGame()` sets `status = "active"`.

**Rationale**: One additional enum value is the smallest change that makes the transition observable via the
existing `GET /rooms/:code` snapshot (FR-013). Later groups can add further states (e.g., round/result) on
the same seam without rework.

**Alternatives considered**:
- A separate `started: boolean` — duplicates what an enum already expresses and complicates later states.
- Introducing full round state now (drawer/word) — out of scope for Group 1; belongs to Group 2.

## D3 — Start authorization & gating

**Decision**: New `POST /rooms/:code/start` accepting `{ participantId }`. Server rejects with 403 if
`participantId !== room.hostId`, and 409 if `participants.length < 2`. Only on passing both does it flip to
`"active"`.

**Rationale**: Server-side enforcement (FR-012) means correctness does not depend on the client hiding the
button. Distinct 403 vs 409 lets the UI explain *why* a start failed. The client additionally disables the
control (FR-010/FR-011) for good UX, but the server is the source of truth.

**Alternatives considered**:
- Client-only gating — violates FR-012 (a crafted request could start a 1-player or non-host game).
- Passing the host id in a header/auth token — no auth system exists; out of scope.

## D4 — Lobby synchronization mechanism

**Decision**: Client-side `setInterval` at 2000ms in `LobbyPage`, calling the existing
`roomStore.fetchRoom()`, cleared on unmount. Manual "Refresh Room" button retained as a fallback.

**Rationale**: Polling is the constitution-approved mechanism (no WebSockets). `fetchRoom()` and the
snapshot endpoint already exist, so polling is purely additive (FR-008/FR-009). 2s matches SC-003.

**Alternatives considered**:
- WebSockets / SSE — explicitly out of scope.
- Polling inside the store (global timer) — harder to scope to the lobby's lifetime; component-level interval
  with cleanup is simpler and avoids polling when no one is viewing the lobby.

## D5 — Auto-advance on start

**Decision**: `LobbyPage` watches `room.status`; when it becomes `"active"` it calls `navigate("/game")`.
Because every client polls, hosts and non-hosts all transition within one poll interval.

**Rationale**: Implements the clarified behavior "all players auto-advance together" (FR-013) using the same
poll already added in D4 — no extra transport.

**Alternatives considered**:
- Only the host navigates — leaves guessers stranded; contradicts the clarification.
- A separate "game started" banner requiring a click — adds an interaction Scenario 1 does not require.

## D6 — Join error surfacing (two distinct messages)

**Decision**: Empty/whitespace code is caught on the **client** (trim → if empty, show "Enter a room code."
and do not call the API). Unknown code is caught on the **server**: the join 404 message becomes
"No room with that code.", surfaced verbatim by the existing error pathway.

**Rationale**: An empty code cannot form a meaningful request path, so guarding it client-side is both
correct and gives instant feedback (FR-004). The unknown-code case must be server-authoritative since only
the store knows which codes exist (FR-005). The existing `api.ts` already throws `Error(message)` from the
response body, so the server message flows to the UI unchanged.

**Alternatives considered**:
- Returning 400 from the server for empty codes — the route `/rooms//join` wouldn't match cleanly; client
  guard is simpler and faster.
- A single generic "Invalid code" message — fails FR-005's requirement for *distinct* feedback.

## D7 — Room isolation

**Decision**: Rely on the existing `Map<code, Room>` keying; ensure no shared/module-level mutable state
leaks across rooms. `toRoomSnapshot` continues to project a single room.

**Rationale**: The store already isolates by code (FR-007). The plan adds no cross-room structures, so
isolation is preserved by construction; the quickstart includes an explicit two-room check (SC-005).

**Alternatives considered**: None needed — current keying is sufficient.

## Summary of resulting changes

| Decision | Backend | Frontend | FRs |
|----------|---------|----------|-----|
| D1 host | `models/game.ts`, `roomStore.ts` | `api.ts` type, `LobbyPage` badge | FR-001 |
| D2 state | `models/game.ts`, `roomStore.ts` | `api.ts` type | FR-013 |
| D3 start | `schemas.ts`, `rooms.ts`, `roomStore.ts` | `api.ts`, `roomStore.ts`, `LobbyPage` | FR-010/011/012/013 |
| D4 polling | — | `LobbyPage` | FR-008/009 |
| D5 auto-advance | — | `LobbyPage` | FR-013 |
| D6 join errors | `rooms.ts` (404 message) | `JoinRoomPage` (empty guard) | FR-004/005/014 |
| D7 isolation | (no change) | — | FR-007 |
