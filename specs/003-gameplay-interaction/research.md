# Phase 0 Research: Gameplay Interaction

The spec carried no open `[NEEDS CLARIFICATION]` markers; it recorded three product decisions as
assumptions. This document turns those plus the starter gaps into concrete design choices.

## D1 — Guess submission & evaluation

- **Decision**: Add `POST /rooms/:code/guess` with body `{ participantId, text }`. The handler
  requires the room to be `playing`, the participant to exist and **not** be the drawer, and the
  text to be non-empty after trimming. Correctness is `normalize(text) === normalize(secretWord)`
  where `normalize = (s) => s.trim().toLowerCase()`.
- **Rationale**: Server-side validation and comparison keep the rule authoritative and
  deterministic (constitution III). Reusing the participant id as identity fits the no-auth model.
- **Alternatives considered**: Client-side comparison — rejected; the word isn't on the guesser's
  client (Scenario 2 strips it) and the server must judge. A generic "action" endpoint — rejected
  as less explicit than a named `guess` action.

## D2 — Scoring (100 / 0, once per player)

- **Decision**: Store `scores: Record<participantId, number>`. Initialize every participant to `0`
  at `startRound`. On a correct guess, if `scores[participantId] < 100`, set it to `100`; otherwise
  leave it. Incorrect guesses change nothing.
- **Rationale**: Matches the spec exactly (correct=100, incorrect=0) and the "score once per round"
  assumption; capping at 100 makes repeat correct guesses idempotent and farming impossible.
  Deterministic and trivially testable.
- **Alternatives considered**: `+100` per correct guess — rejected (unbounded farming, contradicts
  the assumption). A `Set` of correct guessers plus derived scores — equivalent but less direct
  than a numeric map.

## D3 — Guess history & word secrecy

- **Decision**: Store `guesses: Guess[]` in submission order, each with author id/name, `correct`,
  the raw `text`, and a timestamp. In `toRoomSnapshot`, each entry's `text` is withheld (`null`)
  when the guess is **correct** and the viewer is **neither the drawer nor the author**; otherwise
  the text is included. A `correct` flag is always present.
- **Rationale**: A correct guess equals the secret word, so showing its text to other guessers would
  leak the word and undo Scenario 2's drawer-only visibility (FR-009). The author already knows what
  they typed and the drawer knows the word, so they may see it; everyone else sees "correct" only.
  Incorrect guesses never equal the word, so their text is safe to show to all.
- **Alternatives considered**: Hiding all correct guesses entirely (no entry) — rejected; players
  should see *that* someone guessed correctly. Hiding all guess text — rejected; incorrect guesses
  are useful, visible context and don't leak.

## D4 — Drawing shared via polled canvas snapshots (amended 2026-06-05)

- **Decision**: The drawer draws on an HTML5 canvas (pointer events) with a Clear button. On a ~2s
  cadence (and on clear), the drawer serializes the canvas to an image data URL and sends it to a
  new `PUT /rooms/:code/drawing` endpoint; the backend stores it on `room.drawing`. Guessers render
  `room.drawing` read-only from the snapshot they already poll (~2s). Drawing/clear controls remain
  drawer-only.
- **Rationale**: A `/speckit-clarify` decision (2026-06-05) chose to make the drawing visible to
  guessers so the round is playable. Polling a canvas image is still **HTTP polling**, not a push
  protocol, so it satisfies the constitution's "no WebSockets / no real-time push" rule. It reuses
  the existing snapshot poll and needs no new dependency (canvas + `toDataURL` are built in).
- **Superseded decision**: The original "drawer-local, not broadcast" approach is replaced — it
  left guessers guessing blind.
- **Alternatives considered**: Server-Sent Events / WebSockets — forbidden (push). Long polling —
  lower latency but behaves like push (gray area; would need a constitution note). Streaming stroke
  deltas — more efficient but materially more complex; a full-image snapshot at ~2s is simplest and
  meets SC-009.
- **Tradeoff**: A serialized image is heavier than stroke deltas (tens of KB) and lags up to ~2s;
  both are acceptable for a small lab room and are the cost of staying poll-only.

## D5 — Syncing via existing polling

- **Decision**: Carry `guesses` and `scores` in the room snapshot that the game view already polls
  every ~2s (Scenario 1/2). After a guesser submits, the returned snapshot updates their view
  immediately; other players converge on the next poll.
- **Rationale**: No new mechanism (constitution II); the poller is the intended sync channel.
  Submission returning the fresh snapshot gives the author instant feedback.
- **Alternatives considered**: A dedicated history endpoint — redundant with the polled snapshot.
  Long polling for lower latency — deferred; ~2s meets the spec and avoids the push-vs-poll gray
  area (would need a constitution note if ever adopted).

## D6 — Where guess/score state lives & initialization timing

- **Decision**: `guesses`/`scores` live on the `Room` in the in-memory `Map`. They are reset at
  `startRound` (empty history, all scores `0`), so a fresh round always begins clean.
- **Rationale**: Initializing at start guarantees FR-011 ("scores start at 0") and keeps round
  state co-located with the room for easy cleanup in Scenario 4's restart.
- **Alternatives considered**: Lazily creating score entries on first guess — rejected; the spec
  wants all participants visible at 0 from the start of the round.
