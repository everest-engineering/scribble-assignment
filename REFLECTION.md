# Reflection Report

A brief reflection on completing the Scribble brownfield lab using the Spec Kit
workflow. Spec Kit was the focus; the game was the vehicle.

## What did the starter app already have?

The starter was a runnable but intentionally incomplete scaffold:

- **Frontend** (Vite + React 18 + TypeScript): app shell, routing for Start,
  Create Room, Join Room, Lobby, and Game; a class-based store
  (`state/roomStore.ts`) using `useSyncExternalStore`; an API client
  (`services/api.ts`); and placeholder game components (canvas, guess form,
  scoreboard, result panel) that rendered static markup only.
- **Backend** (Node + Express + TypeScript + Zod): in-memory room store
  (`Map<string, Room>`), and three endpoints — `POST /rooms`,
  `POST /rooms/:code/join`, `GET /rooms/:code` — plus `GET /health`.
- **Seed data**: five words (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`)
  and two roles (`drawer`, `guesser`).
- **Tests**: a handful of Vitest unit tests for the store, schemas, and API
  client.

What it did **not** have: any host concept, automatic lobby polling, a start-game
flow, drawer assignment, secret-word visibility rules, drawing/clear, guess
submission/validation/scoring, a result state, or restart. The lobby refreshed
only via a manual button, and the "Start Game" button navigated unconditionally.
It also shipped one planted bug — the API base URL defaulted to
`http://localhost:3001/bug` — documented and fixed in `DISCOVERY.md`.

## What did you add?

All four business scenarios, each delivered through a full Spec Kit cycle
(`specify → clarify → plan → checklist → tasks → analyze → implement`):

- **Scenario 1 — Room setup & lobby**: `hostId` on the room and snapshot; creator
  becomes host; client-side join validation with specific messages
  ("Room code is required", "Room not found — check your code and try again");
  automatic ~2s lobby polling with cleanup and resilient (non-fatal) failures;
  a "(Host)" indicator; host-only Start enabled at ≥2 players, with non-hosts
  shown a "Waiting for host to start…" message.
- **Scenario 2 — Game start & drawer flow**: trimmed, non-empty name validation on
  both client and backend (Zod); `status` extended to `playing`; a host-only
  `POST /rooms/:code/start`; drawer = host; **deterministic** word selection via a
  room-creation counter (`STARTER_WORDS[(count-1) % length]`, never `Math.random()`);
  and drawer-only word visibility (the snapshot omits `word` for guessers).
- **Scenario 3 — Gameplay interaction**: a new `DrawingCanvas` component using
  normalized (0–1) vector strokes synced through the snapshot; drawer-only
  `POST /strokes` and `POST /clear-canvas`; guess submission
  (`POST /guess`) with trim, empty-reject, drawer-reject, and case-insensitive
  matching; fixed scoring (correct = 100 once, incorrect = 0); a shared guess
  history; and a real scoreboard sorted by score.
- **Scenario 4 — Result, restart & final validation**: `status` extended to
  `finished`; the round ends on the first correct guess; the word becomes public
  to everyone in the result state alongside final scores and full history; a
  host-only `POST /restart` that clears strokes/guesses, zeroes scores, clears the
  drawer, advances the deterministic word, preserves participants, and returns
  everyone to the lobby via polling.

Supporting artifacts: `DISCOVERY.md`, a six-principle constitution
(`.specify/memory/constitution.md`), and per-scenario `spec.md`, `plan.md`,
`checklist.md`, `tasks.md`, and `analysis.md` under `specs/00N-*/`.

## How did you use AI assistance?

AI (Claude Code) drove the Spec Kit workflow end to end: reading the starter
before writing, drafting each artifact, and implementing each slice. The process
was deliberately incremental — one scenario at a time, each validated by builds
and Vitest before the next. Ambiguities that genuinely affected behavior were
surfaced as structured clarifications and decided explicitly (e.g. hiding the
Start control from non-hosts, where the empty-code check lives, how polling
handles transient failures, how the round ends, and how strokes sync). Every
generated change was reviewed against the spec and the constitution before being
accepted, and a self-review caught a missed slice (client-side name validation on
the Create page) before final validation. AI usage is disclosed here per the
constitution's AI Review Discipline principle.

## What tradeoffs did you make?

- **Vector strokes over raster images**: strokes are stored as normalized point
  lists and the drawer POSTs a complete stroke on pointer-up. This keeps polling
  payloads small and avoids new dependencies, at the cost of not streaming each
  pointer move in real time — acceptable under a ~2s polling model.
- **First correct guess ends the round**: with a single round and no timer, this
  is the natural terminal condition and keeps Scenario 3/4 boundaries clean.
- **Deterministic, advancing word**: word selection is index-based (and advances
  on restart) rather than random, satisfying the constitution's deterministic
  rule and making behavior reproducible and testable.
- **Polling over push**: all synchronization uses the existing 2s `GET /rooms/:code`
  poll — no WebSockets — per scope. A failed poll is non-fatal (keeps the last
  roster) to stay robust against backend blips.
- **Minimal, brownfield changes**: existing files, patterns (the class store,
  React Router v6), and styling were extended rather than rewritten; no new
  top-level dependencies were added. The one starter bug was fixed only because it
  blocked delivery, and it was documented.
- **Single PR branch**: all four scenarios were kept on `scribble-lab` with spec
  directories numbered `001`–`004` instead of per-scenario git branches, to keep
  the review as one coherent diff.

> Each change traces back to a numbered requirement in its scenario's `spec.md`,
> and each commit is meant to be explainable on its own.
