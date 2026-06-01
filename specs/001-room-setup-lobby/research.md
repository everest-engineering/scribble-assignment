# Research: Room Setup & Lobby

**Phase**: 0 — Research
**Date**: 2026-06-01

## Overview

This document consolidates findings and decisions for the Room Setup & Lobby
feature. No NEEDS CLARIFICATION markers existed in the spec — all technical
decisions flow from the existing project stack and constitution constraints.

---

## 1. Room Code Generation

**Decision**: 6-character uppercase alphanumeric codes (e.g., "A3X9K2").

**Rationale**: Short enough for verbal communication, large enough space
(36^6 ≈ 2.2B combinations) to avoid collisions in a lab setting.

**Alternatives considered**: 4-char (too few combinations), UUID (too long
for verbal sharing), sequential numbers (predictable/guessable).

---

## 2. Host Tracking

**Decision**: Store `hostId` on the Room entity. The creating participant's
ID is assigned as `hostId` on creation. Transferred only if host leaves.

**Rationale**: Simple, single-source-of-truth approach. No need for role
enum — host is a boolean property of the room, not the participant.

**Alternatives considered**: Host as a participant flag (harder to transfer),
host as a separate concept (unnecessary complexity).

---

## 3. Polling Mechanism

**Decision**: Frontend uses `setInterval` to call `GET /rooms/:code` every
2 seconds. Response includes participant list. Errors are swallowed with a
retry (no crash on transient failure).

**Rationale**: Aligns with constitution constraint (HTTP polling only, no
WebSockets). 2s interval matches spec requirement. Simple `setInterval`
pattern avoids external dependencies.

**Alternatives considered**: `setTimeout` recursive (more control but same
behavior), service worker (over-engineered for lab).

---

## 4. Lobby Polling Cleanup

**Decision**: Clear the polling interval when the component unmounts
(navigates away from lobby). Store interval ID in a ref.

**Rationale**: Prevents stale requests after navigation. Standard React
pattern.

---

## 5. Room Isolation

**Decision**: Rooms stored in a `Map<string, Room>` in memory. All operations
keyed by room code. No shared mutable state between rooms.

**Rationale**: Built-in isolation via `Map` keying. In-memory only per
constitution. Simple, testable.

---

## 6. Start Game — Authorization

**Decision**: The `POST /rooms/:code/start` endpoint checks `participantId`
against `room.hostId`. Returns 403 if not the host. Returns 400 if <2
players.

**Rationale**: Stateless check on each request. No session/auth needed.

---

## 7. Name Validation

**Decision**: Trim whitespace from both ends. Reject if resulting string is
empty. Use Zod string schema with `.trim().min(1)`.

**Rationale**: Consistent with constitution edge case requirements.
Zod validation already established pattern in the backend.

---

## 8. Existing Backend Routes

**Decision**: Extend existing router at `backend/src/api/rooms.ts`. Add
`POST /rooms/:code/start` endpoint. Modify `POST /rooms` to assign host.

**Rationale**: Brownfield enhancement per project constraints. Extend
existing files, don't rewrite.

---

## 9. Existing Frontend Pages

**Decision**: Modify existing `CreateRoomPage.tsx`, `JoinRoomPage.tsx`,
`LobbyPage.tsx`. Add polling to LobbyPage. No new pages needed.

**Rationale**: Starter already has these page shells. Enhance in place.

---

## 10. Test Strategy

**Decision**: Backend integration tests via Vitest (room creation, join,
validation, start, isolation). Frontend component tests for polling UI
states and host/non-host visibility.

**Rationale**: Constitution Principle IV (Test-First). Backend tests don't
need HTTP — test the service layer. Frontend tests use Vitest + jsdom.
