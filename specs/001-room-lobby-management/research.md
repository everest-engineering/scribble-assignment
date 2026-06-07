# Phase 0 Research: Room & Lobby Management

All decisions respect the constitution: in-memory only, REST polling (no real-time), no new dependencies, extend-don't-rewrite. Each unknown below was resolved against the existing starter code and the clarified spec.

## R1. Host representation

- **Decision**: Add `hostId: string` to `Room`, set to the creator's `participantId` at creation. Expose `hostId` in `RoomSnapshot` so the frontend can both render a "Host" badge and decide whether to show the Start control.
- **Rationale**: A single `hostId` on the room is the unambiguous source of truth and survives participant-list mutations (joins, prunes). The frontend already receives `participantId` on create/join, so `viewer.isHost = participantId === room.hostId` is a trivial comparison — no extra round-trip. (FR-002, FR-011)
- **Alternatives considered**:
  - `isHost` boolean per participant — risks drift if two participants are ever flagged; harder to reassign. Rejected.
  - Implicit "first in array is host" — breaks when the host is pruned and the array shifts. Rejected.

## R2. Presence tracking & departure detection (heartbeat)

- **Decision**: Add `lastSeenAt: string` (ISO) to `Participant`. Refresh it (a) on create/join and (b) every time that participant polls `GET /rooms/:code?participantId=...`. On every **read** of a room, lazily prune participants whose `lastSeenAt` is older than `PRESENCE_TIMEOUT_MS` (10 000 ms). No server-side timers/intervals.
- **Rationale**: Polling already happens ~every 2s (Constitution III), so the poll *is* the heartbeat — no new mechanism. 10s ≈ 5 missed polls, tolerant of transient hiccups while still detecting closed tabs/crashes (clarified answer). Lazy pruning on read keeps the design timer-free and aligned with "polling, not real-time"; the player who polls triggers cleanup of the stale player, and sees the updated list on that same response. (FR-010, FR-010a)
- **Alternatives considered**:
  - `setInterval` background sweep — introduces a server-side timer/“push-like” loop, against the polling principle, and adds lifecycle complexity. Rejected.
  - Explicit `POST /leave` only — the clarification chose heartbeat timeout, and an explicit-only model leaves ghost players on crashes. Not added (keeps surface minimal).
- **Known limitation (accepted)**: If *every* participant stops polling at once, the room is never read again and lingers in memory until process restart. Acceptable for an in-memory dev store; documented rather than solved with a timer.

## R3. Host-leave room closure & signalling

- **Decision**: When pruning (or any read) removes the participant equal to `hostId`, **delete the room** from the store. The next poll from any remaining player therefore returns `404`. The frontend, while actively polling a room it had joined, treats a `404` as "room closed" and ejects the player to the entry screen with a message that the host left / the room closed. Also delete any room that becomes empty (FR-015a).
- **Rationale**: Honors "close the room immediately" (clarified) with the simplest possible state: deletion. From a *remaining* player's perspective, the only reason a room they are in disappears is closure (host left, or they were the last one) — so inferring "host left / room closed" from a 404 during active polling is accurate and testable, without adding tombstone records or a new `closed` status. (FR-015, FR-015a)
- **Alternatives considered**:
  - Tombstone map + `410 Gone` with `reason: "host_left"` for an exact message — more precise wording but adds persistent-ish state and TTL bookkeeping the scope doesn't warrant. Rejected for v1; noted as a possible refinement.
  - Host migration to next player — explicitly reversed by the clarification (Q2). Not built.

## R4. Capacity enforcement

- **Decision**: Define `MAX_PLAYERS = 8`. In `joinRoom`, after pruning stale participants, reject when `participants.length >= MAX_PLAYERS` with a distinct "room is full" error (HTTP 409). Pruning happens *before* the capacity check so departed players free their slot.
- **Rationale**: Fixed capacity per clarification (Q4). Pruning-before-check avoids falsely-full rooms held by ghosts. (FR-016)
- **Alternatives considered**: Configurable capacity — unnecessary; constant is clearer and matches the locked decision.

## R5. Display-name handling & disambiguation

- **Decision**: Trim the submitted name; if empty, default to `"Player"`. Then disambiguate against names already in the room by appending ` (2)`, ` (3)`, … on collision. Names are compared case-insensitively for collision detection.
- **Rationale**: FR-017 requires each player to be distinct in the lobby. The starter already defaults blanks to "Player"; without disambiguation multiple "Player"s are indistinguishable. Suffixing is the least-surprising, locale-free approach. (FR-017)
- **Alternatives considered**: Reject duplicate names — worse UX for friends with the same name; the spec asks to *disambiguate*, not reject. Rejected.

## R6. Code validation (empty vs not-found vs full vs started)

- **Decision**: Distinct, user-facing outcomes:
  - Empty/whitespace code → blocked **client-side** in `JoinRoomPage` with "Please enter a room code" (never hits the API). (FR-005)
  - Unknown code → backend `404` "Room not found". (FR-006)
  - Full room → backend `409` "This room is full". (FR-016)
  - Already-started room → backend `409` "This game has already started". (FR-014)
  - Codes matched case-insensitively, surrounding whitespace ignored — `code.trim().toUpperCase()` on both client and server (server already upper-cases). (FR-007)
- **Rationale**: The frontend `request()` helper currently throws a generic `Error(message)` from the response body. To show specific messages and to let the lobby detect closure, surface the HTTP **status** alongside the message (see R7). Client-side empty-check avoids a malformed `/rooms//join` request. (FR-005, FR-006, FR-007, FR-014, FR-016)
- **Alternatives considered**: Server-side empty-code 400 — still fine, but the path param can't be empty in a clean route, so guarding on the client is simpler and gives instant feedback.

## R7. Frontend error surface (status-aware)

- **Decision**: Extend the `api.ts` `request()` helper to throw an error that carries the HTTP `status` (e.g., an `ApiError` with `status` and `message`). The room store / lobby can then branch: `404` during polling → room closed; `409` on join → show the specific message.
- **Rationale**: The lobby must distinguish "transient fetch failure" from "room no longer exists" to implement ejection (R3). Carrying the status is the minimal change; the generic `message` still drives display text. (FR-015)
- **Alternatives considered**: Parse message strings to infer cause — brittle. Rejected.

## R8. Start-game gating & transition

- **Decision**: New `POST /rooms/:code/start` with body `{ participantId }`. Server validates, in order: room exists (`404`), requester is host (`403` if `participantId !== hostId`), at least 2 present after pruning (`409` if `< 2`). On success, set `room.status = "playing"` and return the snapshot. Add `"playing"` to `RoomStatus`. The frontend Start button is rendered **only** for the host and disabled until `participants.length >= 2`; all players' polling sees `status === "playing"` and navigates to `/game`. (FR-011, FR-012, FR-013, FR-014)
- **Rationale**: Server is the authority for both host-only and min-player rules (client hiding the button is UX, not security). Driving the transition through the polled `status` means non-host players move into the game on their normal poll cycle — no extra signalling, consistent with Constitution III. The existing `/game` route + `GamePage` placeholder is the navigation target; gameplay itself is out of scope.
- **Alternatives considered**: Client-only start (just navigate) — current starter behavior; fails FR-011/FR-012 and doesn't move other players. Rejected.

## R9. Frontend polling lifecycle

- **Decision**: In `LobbyPage`, use a `useEffect` that sets a `setInterval(fetchRoom, 2000)` and clears it on unmount or when leaving the lobby. Guard against overlapping requests; stop polling when the room is closed (404 → eject) or when `status === "playing"` (→ navigate to `/game`). Keep the existing manual "Refresh" affordance as an optional fallback.
- **Rationale**: Implements FR-010 with the smallest change to the existing `LobbyPage`, which already calls `roomStore.fetchRoom()`. Interval cleanup prevents leaked timers/state updates after navigation. (FR-010)
- **Alternatives considered**: Polling in the global store regardless of route — wastes requests off the lobby and complicates teardown. Rejected; scope polling to the lobby view.

## Resolved constants

| Constant | Value | Source |
|----------|-------|--------|
| `MAX_PLAYERS` | 8 | Clarification Q4 / FR-016 |
| `PRESENCE_TIMEOUT_MS` | 10 000 | Clarification Q1 / FR-010a |
| `POLL_INTERVAL_MS` | 2 000 | Spec "~2s" / FR-010 / Constitution III |
| Code format | 4-char uppercase alphanumeric | Clarification Q3 / FR-001 (already in starter) |

**No remaining NEEDS CLARIFICATION.**
