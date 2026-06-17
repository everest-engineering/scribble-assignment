# Phase 0 Research: Game Start & Drawer Flow

Open decisions were resolved in `/speckit.clarify` (Session 2026-06-17). This file records the resulting
technical decisions with rationale and rejected alternatives.

## D1 — Deterministic secret-word selection

**Decision**: On start, `secretWord = STARTER_WORDS[hash(code) % STARTER_WORDS.length]`, where `hash` is a
stable function of the room code (e.g., sum of `code` char codes). Computed once at start and stored on the room.

**Rationale**: Deterministic and stable per room (FR-008), yet varies across rooms for better demos. Reuses
the existing seed list; no randomness, so it's trivially testable (same code → same word).

**Alternatives considered**: Always first word ("rocket") — deterministic but identical every game (poor demo).
Random-frozen-at-start — violates FR-008's "deterministic, not random".

## D2 — Drawer identity

**Decision**: `drawerId = room.hostId`. The host (creator) is the drawer.

**Rationale**: Reuses Group 1's `hostId`; in this lab host = first player = creator, so "host or first player"
is unambiguous (clarified). One field, no new role table.

**Alternatives considered**: "first participant by join order" — identical here, adds a redundant concept.

## D3 — Viewer-aware snapshot (drawer-only word)

**Decision**: Make `toRoomSnapshot(room, viewerParticipantId)` actually use its viewer argument:
always include `drawerId`; include the viewer's `role` (`"drawer"` if `viewerId === drawerId`, else
`"guesser"`); include `word` **only** when `viewerId === drawerId`. The word is omitted from the object
entirely for guessers (and its length is therefore not derivable).

**Rationale**: This is the seam Group 1 intentionally left (`void viewerParticipantId`). Enforcing secrecy in
the projected data (not just the UI) satisfies FR-009/FR-010 — a guesser literally never receives the word.

**Alternatives considered**: Send the word to everyone and hide in the UI — fails FR-010 (discoverable in
network payload). Send a masked length hint to guessers — rejected in clarification (exposes length; extra scope).

## D4 — Player-name validation placement

**Decision**: Enforce **server-side** (authoritative) by trimming and rejecting blank names in the create and
join schemas/store, returning a 400 with a clear message; **guard client-side** in CreateRoomPage/JoinRoomPage
(trim, reject blank with a message, skip the API call) for instant UX.

**Rationale**: Mirrors the Group 1 join-validation pattern (server authoritative + client guard). The starter
silently coerced blank → "Player"; this removes that coercion (FR-001/FR-002/FR-003).

**Alternatives considered**: Client-only validation — a crafted request could still create a blank/"Player"
participant. Server-only — works but worse UX (round-trip for an obvious error).

## D5 — Where the round state lives

**Decision**: Store `drawerId` and `secretWord` directly on the `Room` (optional fields, set on start, unset
while in `lobby`). No separate Round object.

**Rationale**: Single round, in-memory, brownfield — extending `Room` is the smallest change and matches how
`status`/`hostId` were added in Group 1. A dedicated Round entity would be over-engineering for one round
(Principle IV).

**Alternatives considered**: A separate `rounds` map — unnecessary for a single non-rotating round; deferred
unless later groups need it.

## Summary of resulting changes

| Decision | Backend | Frontend | FRs |
|----------|---------|----------|-----|
| D1 word | `roomStore.ts` (`selectWord`, `startGame`) | — | FR-007, FR-008 |
| D2 drawer | `models/game.ts`, `roomStore.ts` | `GamePage.tsx` | FR-004, FR-005 |
| D3 viewer snapshot | `models/game.ts`, `roomStore.ts` | `api.ts` type, `GamePage.tsx` | FR-005/006/009/010 |
| D4 name validation | `schemas.ts`, `roomStore.ts` | `CreateRoomPage.tsx`, `JoinRoomPage.tsx` | FR-001/002/003 |
| D5 round state | `models/game.ts`, `roomStore.ts` | — | FR-004/007 |
