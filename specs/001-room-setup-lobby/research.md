# Phase 0 Research: Room Setup & Lobby

The spec carried no open `[NEEDS CLARIFICATION]` markers; this document records the design
decisions that resolve the spec's assumptions and the starter-code gaps into concrete choices.

## D1 — Host representation

- **Decision**: Add `hostId: string` to the backend `Room`, set to the creator's participant
  id at creation. Expose `hostId` plus a per-viewer `isHost` boolean in `RoomSnapshot`.
- **Rationale**: The creator is always the first participant, so the creator's id is a stable,
  deterministic host reference. A per-viewer `isHost` keeps the host-only UI logic trivial and
  avoids leaking participant ids into UI conditionals.
- **Alternatives considered**: (a) Treating `participants[0]` as host implicitly — rejected as
  fragile if ordering ever changes. (b) A separate `Host` entity — rejected as over-modeling
  for an in-memory lobby.

## D2 — Room-code validation & lookup

- **Decision**: Validate the join code with Zod `z.string().trim().min(1)`. Look rooms up by
  upper-cased code. Return `400 { message }` for empty/whitespace, `404 { message: "Room not
  found" }` for an unknown code. Client also blocks empty submits before any request.
- **Rationale**: Trimming + min(1) gives a single source of truth for "code required".
  Upper-casing matches the starter's display/generation alphabet and satisfies the
  case-insensitive requirement (FR-005). Distinct status codes/messages give clear feedback
  (FR-006/FR-007) and keep the centralized error handler simple.
- **Alternatives considered**: Regex-enforcing the exact 4-char alphabet — rejected as
  over-constraining; the not-found path already covers malformed-but-nonexistent codes, and we
  avoid re-specifying the code format (spec assumption).

## D3 — Start-game gating

- **Decision**: Compute `canStart = isHost && participants.length >= 2` inside
  `toRoomSnapshot`. The frontend renders the Start control only for the host and disables it
  with an explanatory message until `canStart` is true.
- **Rationale**: Centralizing the rule server-side keeps it deterministic and prevents a
  non-host client from enabling start locally. Sending a derived boolean keeps the client
  dumb and consistent with polling.
- **Alternatives considered**: Enforcing only on a future "start" endpoint — deferred;
  Scenario 1 only requires the precondition and control availability, but computing it now
  gives the UI what it needs without a round-trip.

## D4 — Automatic lobby polling cadence

- **Decision**: Poll `GET /rooms/:code?participantId=...` every 2000 ms via `setInterval`,
  started in a `LobbyPage` `useEffect` on mount and cleared on unmount. Guard against
  overlapping in-flight requests; on a failed poll, keep the last snapshot and set a soft,
  non-fatal error.
- **Rationale**: Satisfies "polling (~2s)" (FR-010) with the simplest mechanism allowed by the
  constitution (no WebSockets). Cleanup on unmount satisfies FR-011 and prevents leaks.
  Preserving the last snapshot satisfies FR-015 (no crash on transient failure).
- **Alternatives considered**: (a) `setTimeout` re-scheduling after each response — viable and
  avoids overlap, but `setInterval` + an in-flight guard is simpler and adequate at this
  cadence. (b) Polling in the store globally — rejected; polling is view-scoped to the lobby.

## D5 — Where polling lives

- **Decision**: Add `startPolling(intervalMs)` / `stopPolling()` to the frontend `RoomStore`
  class; the lobby view drives lifecycle via `useEffect`. The store owns the interval handle
  and the in-flight guard.
- **Rationale**: Follows the established `roomStore.ts` external-store pattern (mandated by
  `AGENTS.md`), keeps React components thin, and centralizes soft-error handling.
- **Alternatives considered**: A bespoke `useEffect` + `setInterval` directly in `LobbyPage`
  calling `fetchRoom` — rejected to keep refresh/error semantics in one place and reusable.

## D6 — Backend-restart / not-found parity

- **Decision**: Since rooms are in-memory, a code valid before a restart returns the same
  `404 "Room not found"` path afterward. No special handling.
- **Rationale**: Matches the constitution's in-memory-only rule and the spec edge case; the
  join flow already treats not-found as normal, user-facing feedback rather than a crash.
- **Alternatives considered**: Persisting rooms to survive restart — explicitly forbidden
  (no databases / no persistence).
