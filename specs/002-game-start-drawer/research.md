# Research: Game Start & Drawer Flow

**Feature**: 002-game-start-drawer — Scenario 2
**Date**: 2026-06-05
**Prerequisite**: Scenario 1 (001-scribble-game) fully implemented.

---

## Decision 1 — Drawer Identity Storage

**Decision**: Store `drawerId: string` on the `Room` model. Set it to
`room.participants[0].id` (= `room.hostId`) when `startRoom()` transitions the room
to `"active"`.

**Rationale**: The host is always participants[0] per existing spec and implementation.
Storing the id explicitly (rather than deriving it at query time) keeps the snapshot
shape consistent and avoids repeated iteration. Adding it in `startRoom()` keeps the
mutation in one place alongside the status change already there.

**Alternatives considered**:
- Derive drawer from `hostId` at read time — works but couples drawer logic to host
  logic permanently; breaks if drawer assignment ever changes.
- Separate drawer rotation model — out of scope per README.

---

## Decision 2 — Secret Word Storage

**Decision**: Store `currentWord: string` on the `Room` model. Set it to
`STARTER_WORDS[0]` ("rocket") inside `startRoom()` alongside `drawerId`.

**Rationale**: Storing the word on the Room (not computing it per-request) ensures a
single source of truth. `STARTER_WORDS[0]` is always "rocket" — deterministic and
spec-compliant. The store is already imported in `roomStore.ts`.

**Alternatives considered**:
- Derive the word on every snapshot call — creates risk of divergence if the word list
  changes mid-request; also harder to test.
- Per-round rotation — explicitly out of scope.

---

## Decision 3 — Server-Side Word Filtering

**Decision**: In `toRoomSnapshot(room, viewerParticipantId)`, include `currentWord`
only when `viewerParticipantId === room.drawerId`. All other callers receive a snapshot
where `currentWord` is `undefined` (field omitted, not nulled).

**Rationale**: The `viewerParticipantId` parameter already exists but is currently
`void`-cast (unused). Activating it costs zero new infrastructure. Filtering on the
server ensures the word never reaches the guesser's client, satisfying FR-006.

**Alternatives considered**:
- Client-side filtering — violates security principle; word would still be in the
  network response and visible in DevTools.
- Separate "drawer-only" endpoint — adds surface area for no benefit.

---

## Decision 4 — RoomSnapshot Shape for `currentWord`

**Decision**: Add `currentWord?: string` as an optional field to `RoomSnapshot` (both
backend `models/game.ts` and frontend `services/api.ts`). Present when viewer is the
drawer; absent otherwise.

**Rationale**: Optional field keeps the type honest — callers must check for it before
using it, which naturally enforces the drawer-only display rule on the frontend. A
non-optional `null` would silently pass truthiness checks.

**Alternatives considered**:
- Two distinct snapshot types (DrawerSnapshot / GuesserSnapshot) — type-safe but
  requires a union type and type guards everywhere; overkill for this scope.

---

## Decision 5 — Game Screen Drawer/Word Display

**Decision**: In `GamePage`, derive `isDrawer = participantId === room.drawerId` from
the store state. Render the secret word block only when `isDrawer && room.currentWord`.
Always render the drawer's name to all players (from `room.participants` filtered by
`room.drawerId`).

**Rationale**: `participantId` is already in `RoomStore` state. `room.drawerId` comes
from the snapshot. No new store methods needed — pure derived state in the component.

**Alternatives considered**:
- Store `isDrawer` in `RoomStore` — unnecessary; it's a trivial derived comparison.
