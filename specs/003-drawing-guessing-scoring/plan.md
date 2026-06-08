# Implementation Plan: Active Round Drawing, Guessing & Scoring

**Branch**: `003-drawing-guessing-scoring` | **Date**: 2026-06-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-drawing-guessing-scoring/spec.md`

## Summary

With a round in progress (drawer + guessers, all scores 0 — feature 002), guessers submit guesses to a **new `POST /rooms/:code/guess`** action. The server **trims** the guess, **rejects empty** (`400`), refuses the drawer (`403`) and inactive rounds (`409`), then compares it to the round's secret word **case-insensitively**. A correct guess awards **100 points once per player per round** (FR-005, FR-007); incorrect adds 0. Every accepted guess is appended to a server-held, ordered **guess history** on the round. The existing ~2s `GET /rooms/:code` poll carries the history and scores to all players (no new transport — Constitution III). In the viewer-aware snapshot, **correct guesses are masked** (player name + "guessed the word!" only, never the word text) so the answer never leaks (FR-011, SC-008) — the same server-boundary technique feature 002 uses for the secret word. A correct guess does **not** end the round; everyone can keep scoring (FR-016). The drawer gets a **drawer-local HTML5 canvas** (draw + clear) that renders only on their screen and is **not** synced to guessers (FR-015) — no streaming, honoring "polling, not real-time." All state stays in the in-memory `roomStore`; the pre-scaffolded `GuessForm`, `Scoreboard`, and `ResultPanel` components are wired to real data, and `GamePage` gains the missing poll loop. No new dependencies.

## Technical Context

**Language/Version**: TypeScript — Node.js (Express) backend, React 18 frontend; versions per existing `package.json`. No upgrades.

**Primary Dependencies**: Backend — Express, Zod (existing). Frontend — React, React Router, Vite (existing). **No new dependencies.** Canvas uses the native HTML `<canvas>` 2D API.

**Storage**: In-memory `Map<code, Room>` in `backend/src/services/roomStore.ts` only (Constitution IV). Guess history and scores live on the in-memory `Round`/`Participant`. No DB/file/cache.

**Testing**: Vitest (backend unit tests for `roomStore` guess/score logic; the pure guess-evaluation helper; frontend `api.test.ts` for the new `submitGuess` call). Manual two-browser acceptance is the primary gate (Constitution: Technology Constraints).

**Target Platform**: Local dev — backend `http://localhost:3001`, frontend Vite dev server; modern browsers (HTML5 canvas + Pointer Events).

**Project Type**: Web application (separate `backend/` + `frontend/`).

**Performance Goals**: A guess appears in every other player's history within one poll cycle (~2s, SC-004). Canvas strokes/clear render on the drawer's screen within 1s (SC-007).

**Constraints**: REST polling only — guess history and scores propagate via the existing `GET /rooms/:code` poll (Constitution III). No WebSockets/streaming/push; the canvas is **drawer-local** and never streamed (FR-015). No server-side timers (the round does not auto-end; FR-016). The secret word must never appear in any guesser's response body, including the guess feed (FR-011, SC-008).

**Scale/Scope**: Small party game — up to 8 players/room. Single active round; single-process in-memory store. Guess history bounded by play duration (no pagination needed at this scale).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield Respect | ✅ PASS | Extends `roomStore`, `Round`/`Participant`/snapshot models, `api.ts`, `state/roomStore.ts`, and `GamePage`. **Wires up the existing scaffold** components `GuessForm`, `Scoreboard`, `ResultPanel` (currently placeholders) rather than replacing them. One new frontend component (`Canvas.tsx`) for US3. No rewrite. |
| II. Spec-Driven Increments | ✅ PASS | specify → clarify → plan for one business scenario (**Gameplay Interaction** — the 3rd scenario in the constitution's order). Every change traces to an FR. |
| III. Polling, Not Real-Time | ✅ PASS | Guess history + scores sync through the existing ~2s `GET /rooms/:code` poll. `POST /rooms/:code/guess` is an action endpoint (peer of the existing `POST .../start`), not a new transport. Canvas is drawer-local — **not** streamed — so no real-time mechanism is introduced. No server timers. |
| IV. Strict Scope Discipline | ✅ PASS | In-memory only; no auth; no new dependency. Explicitly NOT building: canvas sync to guessers, round timers, round end/rotation, speed/drawer bonuses. Single round; correct guess does not end it. |
| V. Self-Review Before Commit | ✅ PASS | Core of the feature is input validation (trim, empty-reject, case-insensitive compare — Constitution V.2). Reuses feature 002's snapshot-boundary secrecy pattern for masking correct guesses. No regression to 001/002 endpoints (guess is additive). |

**Gate result: PASS.** No constitution violations → Complexity Tracking table intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/003-drawing-guessing-scoring/
├── plan.md              # This file
├── research.md          # Phase 0 — technical decisions
├── data-model.md        # Phase 1 — entities, fields, guess/score flow
├── quickstart.md        # Phase 1 — run & two-browser validation
├── contracts/
│   └── rooms-api.md     # Phase 1 — REST deltas (new POST .../guess; snapshot guesses/scores)
├── checklists/
│   └── requirements.md  # Spec quality checklist (from /speckit-specify + /speckit-clarify)
└── tasks.md             # Phase 2 — created by /speckit-tasks (NOT here)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts          # MODIFY: add POST /:code/guess route (400 empty, 403 drawer, 409 no round/started, 404)
│   │   ├── schemas.ts        # MODIFY: add submitGuessSchema { participantId, text } (text trimmed)
│   │   └── router.ts         # (unchanged) existing HttpError/ZodError handlers reused
│   ├── models/
│   │   └── game.ts           # MODIFY: add Guess + GuessSnapshot; Round.guesses + Round.correctPlayerIds; Participant.score; RoundSnapshot.guesses
│   ├── services/
│   │   ├── roomStore.ts      # MODIFY: submitGuess(code, pid, text); init scores=0 on startGame; project guesses (mask correct) in toRoundSnapshot
│   │   └── guessEvaluation.ts# NEW (small pure helper): normalizeGuess(text) + isCorrect(guess, word) — case-insensitive, trimmed
│   └── seed/starterData.ts   # (unchanged)
└── src/**/*.test.ts          # EXTEND: roomStore (correct=100, incorrect=0, empty reject, once-per-round, drawer blocked, history order, mask), guessEvaluation

frontend/
├── src/
│   ├── components/
│   │   ├── GuessForm.tsx      # MODIFY: submit via store; show empty-rejection message; disable after viewer guessed correctly
│   │   ├── Scoreboard.tsx     # MODIFY: render participants by score (desc); 0 by default
│   │   ├── ResultPanel.tsx    # MODIFY: render ordered guess feed (masked correct guesses → "✅ {name} guessed the word!")
│   │   └── Canvas.tsx         # NEW: drawer-local <canvas> (Pointer Events) + Clear; read-only placeholder for guessers
│   ├── pages/
│   │   └── GamePage.tsx       # MODIFY: add ~2s poll loop (missing today); mount Canvas; pass round/guess data to children
│   ├── services/api.ts        # MODIFY: types (Participant.score, RoundSnapshot.guesses, GuessSnapshot); add api.submitGuess
│   └── state/roomStore.ts     # MODIFY: add submitGuess(text) method (calls api, sets snapshot)
└── src/**/*.test.ts           # EXTEND: api.test.ts (submitGuess POST shape)

CLAUDE.md                      # MODIFY: SPECKIT block → point to this plan
```

**Structure Decision**: Web application (Option 2). Reuse the existing `backend/` + `frontend/` layout and the State Boundary (all room/game state in `roomStore.ts`; frontend derived from polling). Two small new files — backend `guessEvaluation.ts` (pure, dependency-free, so the trim + case-insensitive compare is independently unit-testable, mirroring how `wordSelection.ts` isolates determinism) and frontend `Canvas.tsx` (a component, not a dependency). Neither is a new top-level directory or package.

## Complexity Tracking

> No constitution violations — no entries required.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _(none)_ | — | — |

## Phase 0 — Research

See [research.md](./research.md). Decisions: new `POST /rooms/:code/guess` action endpoint (peer of `/start`) with sync still via the existing GET poll; case-insensitive trimmed equality for correctness; score stored on `Participant` and reset to 0 at round start; `correctPlayerIds` on the round to enforce the once-per-round 100-point award; **server-side masking** of correct guesses in the snapshot (reusing feature 002's word-secrecy boundary) so the feed can never leak the word; drawer-local canvas via native HTML5 `<canvas>` + Pointer Events (no sync, no library); and adding the missing poll loop to `GamePage`. No remaining NEEDS CLARIFICATION.

## Phase 1 — Design & Contracts

- [data-model.md](./data-model.md) — `Guess` + `GuessSnapshot` entities, `Round.guesses`/`Round.correctPlayerIds`, `Participant.score`, the viewer-aware `RoundSnapshot.guesses` (correct entries masked), guess-evaluation + scoring rules, and the guess/score state flow with FR traceability.
- [contracts/rooms-api.md](./contracts/rooms-api.md) — REST deltas: new `POST /rooms/:code/guess` (request/response + `400`/`403`/`409`/`404`), and the extended snapshot (`participants[].score`, `round.guesses[]` with masked correct entries) returned by `GET /rooms/:code` and the guess response.
- [quickstart.md](./quickstart.md) — run both servers + two-browser acceptance script mapped to US1/US2/US3 (correct/incorrect/empty guesses, 100-point scoring, history sync within ~2s, masked correct entries, drawer-local canvas draw/clear).
- Agent context: `CLAUDE.md` SPECKIT block updated to reference this plan.

**Post-Design Constitution Re-Check: PASS** — design adds no dependencies, no transport, no persistence, no timers; sync stays on the existing GET poll; the action endpoint mirrors the existing `/start`; correct-guess secrecy is enforced at the snapshot boundary; the canvas is drawer-local.
