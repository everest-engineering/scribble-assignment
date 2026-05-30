# Research: Game Start — Drawer Assignment and Word Reveal

**Branch**: `003-drawer-word-reveal` | **Date**: 2026-05-30

## Drawer Identity

**Decision**: Derive the drawer on the frontend from the existing `room.hostId` field. No new backend data is needed. A participant whose `id === room.hostId` is the drawer; all others are guessers.

**Rationale**: The constitution (Principle III) mandates "Drawer assignment MUST follow a defined rule (host or first player for the first round)." The `hostId` field was established in feature 002 and is already included in every `RoomSnapshot`. The frontend already has access to both `room.hostId` and `participantId` (the current viewer's ID) in `useRoomState()`, so the role can be computed with a single comparison — no additional API field or endpoint is required.

**Alternatives considered**: Adding an explicit `drawerId` field to `RoomSnapshot` — rejected as redundant; `hostId` already encodes this for round 1. Adding a separate `/game` API endpoint — rejected; all required data is already in the room snapshot.

---

## Secret Word Selection

**Decision**: Use `room.availableWords[0]` as the secret word. This is always the first entry in the starter list ("rocket"). The frontend renders it only when `participantId === room.hostId`; guessers see a neutral placeholder.

**Rationale**: The spec requires deterministic word selection from the starter list, with "rocket" (first word) as the testable value. `availableWords` is already returned in every `RoomSnapshot` and contains the full list. Selecting index 0 is the simplest deterministic rule — no sorting, no hashing, no server-side randomness.

**Alternatives considered**: Selecting the word server-side and storing it on the `Room` model — rejected as over-engineering for a single-round, in-memory game with a fixed word list. Omitting `availableWords` from guesser responses — a valid network-level hardening option, but the spec explicitly scopes this feature to what is *displayed*, not what is *transmitted*, so this is deferred to a later hardening task.

---

## Backend Changes Required

**Decision**: None. This feature is purely a frontend rendering concern.

**Rationale**: All data needed to determine the drawer (via `hostId`) and the word (via `availableWords[0]`) is already present in the `RoomSnapshot` returned by `GET /rooms/:code`. The backend does not need to be changed.

**Alternatives considered**: Adding a `/game/:code` endpoint with role-specific responses (word visible to drawer only) — rejected as out of scope per constitution Principle V (no new endpoints beyond what the spec requires, and the spec delegates network-level hiding to implementation detail).

---

## Frontend Rendering Pattern

**Decision**: In `GamePage.tsx`, compute `isDrawer = participantId === room.hostId` and use it to branch the JSX: (1) show the secret word in a prominent "Word to Draw" card if `isDrawer`; (2) show a neutral placeholder "Waiting for the drawer…" card if not `isDrawer`. Display the drawer's name and "Drawer" label in the Player Info sidebar for all participants. Display "Guesser" for non-drawing participants.

**Rationale**: The existing `GamePage.tsx` already receives `room` and `participantId` from `useRoomState()` and renders a Player Info card. Extending it with role logic is a minimal, contained change. No new components or hooks are required.

**Alternatives considered**: Separate `DrawerView` and `GuesserView` components — rejected as premature abstraction; the branching is simple enough to live inline.
