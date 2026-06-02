# Research: Room Setup and Lobby

## Decision: Extend Existing In-Memory Room Store

**Rationale**: The current backend already stores rooms in memory and exposes create, join, and fetch behavior. Adding host ownership, start eligibility, and room status to this model satisfies FR-001 through FR-015 while preserving the assignment constraints.

**Alternatives considered**: Adding persistence or a separate room registry was rejected because the constitution requires in-memory state and the feature does not need historical room data.

## Decision: Host Ownership Stored on Room

**Rationale**: The creator must remain identifiable as host across polling refreshes and start attempts. Storing `hostParticipantId` on the room makes host checks deterministic and keeps authorization local to the room service.

**Alternatives considered**: Deriving host from the first participant was rejected because host transfer and participant ordering changes would make behavior implicit and harder to validate.

## Decision: Start Game Through Backend Validation

**Rationale**: Host-only and minimum-player start rules must be enforced before room state changes. A dedicated start mutation keeps these rules testable and prevents frontend-only checks from being bypassed.

**Alternatives considered**: Navigating directly to the game page from the frontend was rejected because it cannot enforce FR-010 through FR-014 for all players.

## Decision: Room Code Normalization and Validation

**Rationale**: Players should receive clear feedback for empty or malformed room codes while valid-looking codes with extra spaces or casing differences should be handled gracefully. Trim and uppercase before lookup, then validate the expected four-character code format.

**Alternatives considered**: Accepting arbitrary strings was rejected because it delays feedback and weakens room isolation tests. Requiring exact casing was rejected because it creates avoidable user friction.

## Decision: 2-Second HTTP Polling in Lobby

**Rationale**: The specification requires lobby refresh every 2 seconds and the constitution forbids push protocols. A single interval scoped to the mounted lobby view gives all players visible updates without introducing WebSockets, server-sent events, or long polling.

**Alternatives considered**: Manual refresh was rejected as the primary strategy because it fails US4. WebSockets and push-style protocols were rejected by project rules.

## Decision: Viewer-Aware Room Snapshot

**Rationale**: The lobby needs to show host labels and start eligibility from the current player's perspective. Including `isHost`, `hostParticipantId`, and `canStart` in room snapshots keeps frontend rendering simple while leaving final enforcement on the backend.

**Alternatives considered**: Recomputing host/start permissions entirely in the frontend was rejected because it risks divergence from backend rules.
