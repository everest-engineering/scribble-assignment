# Phase 0 Research: Room Setup & Lobby

The feature spec contains no `[NEEDS CLARIFICATION]` markers. Research consolidates the few design decisions implied by the scenario, all bounded by Constitution Principles I–V.

## R1. Real-time-feeling lobby without WebSockets

- **Decision**: Client-side `setInterval` polling at 2000 ms calling `GET /rooms/:code?participantId=...`, started on `LobbyPage` mount and torn down on unmount. Tab visibility (`document.visibilityState`) is checked: when hidden, polling pauses; when visible again, an immediate fetch runs and the interval resumes.
- **Rationale**: Meets FR-011 / SC-003 (other clients see joiners within ~2s) while complying with Principle II (no real-time push). Visibility pausing avoids needless traffic from background tabs.
- **Alternatives considered**:
  - WebSockets / Socket.io — forbidden by constitution.
  - Server-Sent Events — also a real-time push protocol; same prohibition.
  - Long polling — adds server-side hold complexity for negligible UX gain at 2s cadence.

## R2. Host designation and host-only Start

- **Decision**: Store `hostParticipantId: string` on `Room` and set it to the creator's participant id during `createRoom`. Expose a `viewerIsHost` boolean and a `canStart` boolean on the snapshot, plus per-participant `isHost`. The new `POST /rooms/:code/start` accepts `{ participantId }`, returns 403 if the id does not match `hostParticipantId`, and 409 if `participants.length < 2`.
- **Rationale**: Single source of truth on the server, immune to client tampering (FR-016, FR-018). Snapshot booleans let the UI hide controls without exposing additional identity beyond what is already discoverable.
- **Alternatives considered**:
  - First-element-is-host convention — fragile and breaks on any reordering.
  - Sending `isHost` from the client — trivially forgeable; violates FR-018.

## R3. Validation rules for name and room code

- **Decision**: Tighten Zod schemas:
  - `playerName`: `z.string().trim().min(1).max(24)`.
  - `code` (path param): `z.string().trim().min(1).transform(s => s.toUpperCase())`.
  - Both create and join require `playerName`; the existing optional+default-"Player" behavior is removed.
  - Add `startRoomSchema = z.object({ participantId: z.string().min(1) })`.
- **Rationale**: Centralizes FR-005 (reject empty), FR-007 (case-insensitive, trimmed lookup) and supports SC-004 by funneling failures through the existing 400 envelope. Frontend forms also disable submit on empty inputs so a 400 is the unhappy-path fallback, not the primary defense.
- **Alternatives considered**:
  - Client-only validation — server still accepts blanks; rejected.
  - Server-only validation — works but adds an avoidable round-trip; rejected for UX.

## R4. Error surface for "room not found"

- **Decision**: `POST /rooms/:CODE/join` and `GET /rooms/:CODE` return `404 { "message": "Room not found" }` when no room matches the normalized code. The frontend `JoinRoomPage` displays this verbatim inline; the lobby polling layer treats a 404 mid-session as "Room no longer available", stops polling, and offers a path back to the start screen (FR-013).
- **Rationale**: Satisfies FR-006 and the polling-stops-on-404 acceptance scenario without inventing new status codes.
- **Alternatives considered**:
  - Generic 400 with a flag — loses HTTP semantics and complicates client branching.
  - Silently retrying on 404 — masks dead rooms and prolongs broken UI states.

## R5. Polling lifecycle and identity stability across refresh

- **Decision**: Persist `participantId` and the lobby `code` in `sessionStorage` so a page refresh on `/lobby` rehydrates the store and resumes polling rather than redirecting home. Polling is owned by a `useLobbyPolling(code, participantId)` hook that mounts in `LobbyPage` only.
- **Rationale**: Addresses the existing UX bug (refresh navigates home) without adding auth or persistence — `sessionStorage` is per-tab and matches the two-tabs-equal-two-players demo flow.
- **Alternatives considered**:
  - `localStorage` — would share identity across tabs and break the two-player demo.
  - URL-encoded participantId — leaks identity into history/share links.

## R6. Concurrency in an in-memory store

- **Decision**: Rely on Node's single-threaded event loop. Keep `createRoom`, `joinRoom`, and `startRoom` synchronous: read room → mutate → write back, with no `await` in between.
- **Rationale**: At lab scale, atomicity is guaranteed without locks. Adding a mutex would violate Principle IV (no incidental complexity).
- **Alternatives considered**:
  - Async mutex — unnecessary for a single-process, in-memory store.

## R7. Test strategy

- **Decision**: Vitest on both sides, mirroring the existing convention.
  - Backend: `roomStore.test.ts` covers create/join/start happy + error paths, case-insensitive lookup, and a "two rooms isolated" test (covers SC-006). `schemas.test.ts` covers empty/whitespace name/code rejection and code normalization. A new `rooms.test.ts` covers the start endpoint's 200/403/404/409 outcomes via Express handlers.
  - Frontend: `services/api.test.ts` adds a 404-message-propagation case. `hooks/useLobbyPolling.test.ts` uses fake timers to assert cadence, visibility pause, and unmount cleanup. Page-level form validation is moved into pure helper functions exported from each page module and unit-tested directly (no DOM render needed) so we avoid pulling in `@testing-library/react` (Principle IV).
- **Rationale**: Covers every spec-mandated behavior (validation, host gating, isolation, polling cadence) without adding dependencies.
- **Alternatives considered**:
  - `@testing-library/react` for component tests — adds a dev dependency for marginal value over pure-function tests of the same logic; rejected.
  - Playwright e2e — out of scope; the manual quickstart serves the same purpose for this slice.
