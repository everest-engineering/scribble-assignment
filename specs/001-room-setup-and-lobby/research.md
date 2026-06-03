# Research: Room Setup and Lobby

**Feature**: Scenario 1 — Room setup and lobby  
**Date**: 2026-06-03

## R1 — Host identity storage

**Decision**: Store `hostParticipantId` on `Room` at creation; expose in every `RoomSnapshot`.

**Rationale**: Constitution defines host as creator with start/restart permissions. Frontend needs host id to gate Start without extra endpoints.

**Alternatives considered**:
- Infer host as `participants[0]` — rejected because join order could be confused with host in future scenarios.
- Separate host flag on Participant — rejected as redundant with a single host per room.

## R2 — Player name validation location

**Decision**: Shared `normalizePlayerName` in `roomStore.ts`; Zod `playerNameSchema` transforms trim then validates length; frontend mirrors messages before submit.

**Rationale**: Constitution requires identical client/server input hygiene. Central helper keeps tests focused on one unit.

**Alternatives considered**:
- Validation only in Zod at route layer — rejected; join/create logic also needs the helper for consistent throws.

## R3 — Participant cap enforcement

**Decision**: Reject join at 8 participants with HTTP 409 and message "Room is full".

**Rationale**: Discovery Q4 default and constitution payload bounds.

**Alternatives considered**:
- Hard cap at room creation — not applicable; cap applies on join.

## R4 — Lobby polling implementation

**Decision**: New `useRoomPolling(callback, enabled)` hook at 2000 ms using `setInterval`, cleared on unmount; skip ticks when `document.visibilityState !== "visible"`.

**Rationale**: Constitution A5 and single-hook rule. Reusable for Scenario 2 game page later.

**Alternatives considered**:
- Inline `useEffect` in LobbyPage only — rejected; violates single polling hook principle.

## R5 — Start button behavior in Scenario 1

**Decision**: UI-only gating; enabled Start navigates to `/game` placeholder without backend call.

**Rationale**: User scope boundary — `POST /rooms/:code/start` is Scenario 2. G7 fix is host check + 2-player minimum on the button, not round transition.

**Alternatives considered**:
- Hide Start entirely until Scenario 2 — rejected; README Scenario 1 explicitly requires host-only start with 2-player minimum visible in lobby.

## R6 — Default API URL

**Decision**: Ensure `API_BASE_URL` defaults to `http://localhost:3001` (no `/bug` suffix).

**Rationale**: Discovery G4 planted bug blocks all E2E validation.

**Alternatives considered**:
- Global unreachable banner (Q5) — rejected per discovery default; form errors sufficient.
