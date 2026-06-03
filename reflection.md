# Reflection Report

## What the starter app already had

The starter was a runnable but intentionally incomplete Scribble-style app:

- **Frontend** (Vite + React + TS): app shell, routing across Start / Create /
  Join / Lobby / Game, branded landing page, a create-room and join-by-code flow,
  a lobby that rendered the last fetched participant list behind a **manual**
  refresh button, and static placeholders for the canvas, scoreboard, guess form,
  and result panel.
- **Backend** (Express + TS + Zod): an in-memory room map with `POST /rooms`,
  `POST /rooms/:code/join`, `GET /rooms/:code`, and a unique 4-char code generator.

Everything beyond the basic room flow was missing: no host concept, no automatic
polling, no name validation, no start-game gating, no drawer/word assignment, no
viewer-specific responses, and no gameplay (drawing, guessing, scoring, results,
restart). I also found a **planted defect**: the frontend API client defaulted to
`http://localhost:3001/bug`, so every request 404'd out of the box.

## What I added

Worked in four feature groups, each with its own `specs/NNN-*/` spec → plan →
tasks and committed as a traceable slice:

1. **Room setup & lobby** — `hostId` on creation; viewer-aware snapshots
   (`isHost`/`isDrawer`/`viewer`); 4-char room-code validation with clear errors;
   404 `Room not found`; a reusable `useRoomPolling(2s)` hook; host-only Start
   gated on a 2-player minimum (enforced server-side: 403/400/409). Fixed the
   `/bug` base-URL defect.
2. **Game start & drawer flow** — player-name validation (trim, reject
   empty/whitespace, ≤24 chars); host becomes the drawer; **deterministic** word
   selection (`pickWord` = function of the room code); the secret word is exposed
   only to the drawer during play.
3. **Gameplay interaction** — an interactive `<canvas>` (local authority for the
   drawer, read-only synced render for guessers via polling), clear-canvas, guess
   submission with trim + empty rejection + case-insensitive compare, synced guess
   history, and deterministic scoring (first correct guess +100, ends the round).
4. **Result, restart & final validation** — a shared result state (word revealed
   to all, final scores, full history, winner) and a host-only restart that clears
   the round, resets all scores to 0, and returns everyone to the lobby with
   players preserved.

## Decisions, tradeoffs, and AI usage

- **Single round, drawer = host.** The scenarios describe one round; I made the
  round end on the first correct guess and reach a `results` state, then restart.
  This keeps the state machine small (`lobby → playing → results → lobby`) and
  avoids out-of-scope rotation/timers.
- **Determinism over randomness.** Word choice is a pure function of the room
  code so reviewers can reproduce it and it is unit-testable, per the constitution.
- **Server is the source of truth.** Every rule (host-only start/restart,
  drawer-only canvas, drawer-cannot-guess, empty/format validation, scoring, word
  visibility) is enforced in `roomStore`; the client mirrors checks only for UX.
  Word visibility is computed per-viewer so the secret never leaks via polling.
- **Polling, not WebSockets.** Canvas strokes and guess history sync through the
  same 2s poll, staying inside the lab's constraints (in-memory, HTTP-only, no DB/
  auth/new libraries).
- **AI usage.** I used the assistant to inspect the codebase, draft the Spec Kit
  artifacts, and implement each slice, but constrained it with the constitution:
  spec-before-code, scope discipline (refused out-of-scope features), no new
  dependencies, and self-review of each diff against acceptance criteria. Each
  group was validated with backend unit tests plus live API smoke tests before
  committing.
- **Tradeoff: drawing fidelity.** Strokes sync on stroke-end (not continuously)
  to keep polling payloads bounded; guessers see the drawing update within ~2s
  rather than in real time — an accepted consequence of the no-WebSocket rule.

## Validation

`npm run build` and `npm test` pass for both `backend` (18 tests) and `frontend`.
Backend behavior was exercised end-to-end via API smoke tests for all four
scenarios (host gating, validation, word visibility, drawing, scoring, results,
restart). Known limitation: a full browser reload drops the in-memory client
session (no persistence), consistent with the no-auth/no-storage scope.
