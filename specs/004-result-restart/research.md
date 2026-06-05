# Phase 0 Research: Result, Restart & Final Validation

The spec carried no open `[NEEDS CLARIFICATION]` markers; it recorded one product decision (the
round-end trigger) as an assumption. This document turns that plus the starter gaps into concrete
design choices.

## D1 — Result status & end-round action

- **Decision**: Extend `RoomStatus` to `"lobby" | "playing" | "result"`. Add `POST /rooms/:code/end`
  with body `{ participantId }`. The handler requires the room to exist, the requester to be the
  host, and `status === "playing"`, then sets `status = "result"` (retaining the round's word,
  scores, and guesses for display). Errors: `404` (no room), `403` (not host), `409` (not playing).
- **Rationale**: A named status is the same signal every polling client already reads, so the
  result transition needs no new mechanism. Host-controlled end matches the assumption (no timer,
  no first-correct auto-end) and the host-only lifecycle from Scenario 1.
- **Alternatives considered**: Auto-end on all-guessers-correct — rejected; Scenario 3 lets
  guessers score independently and there is no "all correct" notion. Timer-based end — out of
  scope. Ending into a boolean flag instead of a status — rejected; a named status reads clearly
  and round-trips through the snapshot like `lobby`/`playing`.

## D2 — Restart action & state clearing

- **Decision**: Add `POST /rooms/:code/restart` with body `{ participantId }`. Require host +
  `status === "result"`. Set `status = "lobby"`; clear `drawerId = null`, `secretWord = null`,
  `guesses = []`, `drawing = null`; reset `scores[p.id] = 0` for every participant. Keep
  `participants` and `hostId` exactly as-is. Errors: `404`/`403`/`409` as above.
- **Rationale**: Explicitly resetting each round field guarantees "all round state cleared"
  (FR-009) deterministically, while preserving participants/host (FR-008) closes the loop into a
  fresh lobby where the Scenario 1 `canStart` rules apply unchanged.
- **Alternatives considered**: Recreating the room — rejected; it would change the code and drop
  the participant ids that clients hold. Restarting directly from `playing` — deferred; the spec
  restarts from the result state, and keeping a single legal source state is simpler and testable.

## D3 — Word & guess-text reveal at result

- **Decision**: In `toRoomSnapshot`, reveal `secretWord` to **all** viewers when
  `status === "result"` (in addition to the drawer during play). Likewise, show a correct guess's
  `text` to everyone when `status === "result"`. During `playing` the Scenario 2/3 secrecy is
  unchanged.
- **Rationale**: The result must show the correct word to all players (FR-003) and a complete
  history (FR-005). Once the round is over the word is public, so the prior drawer-only stripping
  no longer applies. Gating the reveal on the status keeps the during-round secrecy intact.
- **Alternatives considered**: A separate `resultWord` field — redundant with `secretWord` once it
  is public; reusing `secretWord` keeps the snapshot lean. Revealing client-side only — rejected;
  the word must actually be present in every viewer's data at result, mirroring how it was stripped
  server-side before.

## D4 — Host-only gating flags

- **Decision**: Add `canEndRound` (`isHost && status === "playing"`) and `canRestart`
  (`isHost && status === "result"`) to the snapshot, mirroring the existing `canStart`. The UI
  shows the End-Round control only when `canEndRound` and the Restart control only when
  `canRestart`; the endpoints independently enforce host-only.
- **Rationale**: Consistency with Scenario 1's `canStart` keeps the client dumb and the rule
  server-authoritative (defense in depth: hidden control + server check).
- **Alternatives considered**: Deriving the flags purely in the UI from `isHost` + `status` —
  workable but less consistent with the established pattern and duplicates the rule client-side.

## D5 — Synced transitions & result screen

- **Decision**: Reuse the ~2s poller. GamePage navigates to `/result` when it sees
  `status === "result"` and to `/lobby` when `lobby`. A new `ResultPage` runs the poller, renders
  the revealed word + final scoreboard + full guess history, offers the host a Restart control, and
  navigates to `/lobby` when `status === "lobby"` (or `/game` if a new round somehow starts).
- **Rationale**: No new real-time mechanism (constitution II); the poller already carries status to
  every client (as it did for lobby→game in Scenario 2). A dedicated page keeps the result view
  clean and reusable.
- **Alternatives considered**: Rendering the result inline on GamePage by status — viable but mixes
  two distinct views; a separate route is clearer and matches the existing page-per-state layout.
