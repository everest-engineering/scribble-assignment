# Reflection Report

## What the starter app already had

The starter was a working skeleton but not a playable game:

- A React + react-router frontend with create/join/lobby/game pages and a
  `useSyncExternalStore`-based room store, plus an Express + TypeScript backend
  with an in-memory `Map` of rooms.
- Create/join/get room endpoints and a `toRoomSnapshot` projection — but the
  snapshot ignored the viewer (`void viewerParticipantId`), so everyone received
  identical data.
- Seed data (`availableWords`, `roles`) that was sent in every snapshot but never
  used to assign roles or pick a word.
- A placeholder game screen: the canvas was a static `<div>`, the guess form only
  called `preventDefault()`, the scoreboard showed a hard-coded `0`, and "Start
  Game" was pure client-side navigation.

I captured these gaps and my carrying assumptions up front in `discovery.md`
(no host concept, no polling, no name validation, placeholder game screen,
client-only start, unused roles/words).

## What I added

I worked through four feature groups, one per business scenario, keeping each
commit traceable to its spec:

1. **Room Setup & Lobby** — host tracking (`Room.hostId`/`isHost`), ~2s lobby
   polling, host-only Start gated on a 2-player minimum, `RoomStatus` widened to
   `started`.
2. **Game Start & Drawer Flow** — player-name validation (trim + reject empty) on
   client and server, host-as-drawer role assignment, deterministic secret-word
   selection (`wordSelection.ts`), and viewer-aware snapshots so only the drawer
   sees the word during play.
3. **Gameplay Interaction** — interactive `<canvas>` drawing synced via strokes, a
   clear-canvas endpoint, guess submission with validation, deterministic scoring
   (correct = 100) via pure `gameRules.ts`, shared guess history, and game-screen
   polling.
4. **Result, Restart & Final Validation** — reveal the word to everyone once
   `round.ended`, a result view with final scores/history, host-only restart that
   resets to a clean lobby while preserving players, and auto-navigation of all
   tabs back to the lobby.

## Key decisions and tradeoffs

- **Polling over WebSockets.** The brief lists WebSockets as out of scope, so both
  lobby and game sync through periodic `GET /rooms/:code`. Simpler and consistent
  with the in-memory model, at the cost of ~2s latency — acceptable for a
  turn-based drawing game.
- **Determinism everywhere testable.** Word selection is derived deterministically
  rather than random, and scoring is fixed (100/0). This made the behavior
  repeatable and unit-testable without mocking randomness.
- **Server-authoritative, viewer-scoped snapshots.** Rather than add per-field
  endpoints, I kept one snapshot projection that hides `secretWord` from guessers
  during play and reveals it to all once the round ends. This localized the
  "who-sees-what" rule in a single function.
- **Behavior-only changes for Group 4.** Restart and reveal reused existing
  `Room`/`RoundState`/`RoomSnapshot` shapes — no new models — which kept the diff
  small and the risk low.
- **Validation messaging.** Backend uses generic Zod 400s while the client shows
  the friendly message. I documented this deliberately rather than duplicating
  copy across layers.

## How I used AI and Spec Kit

Spec Kit was the backbone. For each group I ran
Discovery → Specify → Clarify → Plan → Tasks → Implement → Analyze, committing the
artifacts (`spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/rooms-api.md`, `tasks.md`, checklists) alongside the code. The Clarify
step was the highest-leverage part — it forced explicit decisions (start outcome,
word visibility, stroke representation, the `round.ended` flag, restart API shape,
post-round reveal) before any code was written, which kept implementation
mechanical. I used AI to draft and cross-check artifacts for internal consistency,
to generate task breakdowns, and to keep terminology aligned across documents. I
verified every step by running the backend/frontend builds and the `vitest`
suites (55 tests total) rather than trusting generated code blindly.

## What I'd do differently

- Add a small set of API-level integration tests (supertest) in addition to the
  unit tests, to cover the route → store wiring end to end.
- Introduce a lightweight shared types package so backend and frontend snapshot
  types can't drift.
- Run the two-tab manual quickstarts earlier per group instead of batching the
  manual validation at the end.
