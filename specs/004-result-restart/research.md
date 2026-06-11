# Phase 0 — Research & Decisions

**Feature**: Result, Restart & Final Validation (`004-result-restart`)

**Status**: All decisions resolved. **0** `[NEEDS CLARIFICATION]` markers in `spec.md`. This document records the reasoning behind each choice for the reviewer.

---

## D1 — Round-end is host-triggered (explicit), not auto-on-first-correct-guess

- **Decision**: Add a host-only `POST /rooms/:code/end` endpoint. The round ends **only** when the host clicks **End Round**.
- **Rationale**:
  - The README's Scenario 4 wording says "Given a round has ended" without specifying *what* ends it. The README's "Explicitly Out Of Scope" list also rules out timers/countdowns.
  - Host-triggered end keeps the state machine deterministic and reviewable: every transition is a single explicit HTTP call. No race conditions between "Bob's correct guess" and "Carol's correct guess arriving 30 ms later".
  - Auto-end-on-first-correct would couple round-end to the guess-handler logic, increasing the blast radius of feature 003. Keeping End Round as its own endpoint is the minimum that delivers Scenario 4 without re-touching feature 003.
- **Alternatives considered**:
  - **Auto-end on first correct guess**: rejected — out of scope per the README ("no rotation, no timers") and would force feature 003's `submitGuess` to know about lifecycle transitions.
  - **Auto-end when every non-drawer has guessed correctly**: rejected — adds a participant-count-dependent branch with no spec demand and ambiguous semantics if a guesser joins mid-round.
  - **Host's `Start Game` doubles as restart from `result`**: rejected — overloads one endpoint with two transitions (`lobby→round` and `result→lobby`), making the contract harder to test and the UI ambiguous about which action it's performing.

## D2 — Result-state word reveal is full and final

- **Decision**: When `room.status === "result"`, `toRoomSnapshot` returns `round.secretWord` to **every** viewer (drawer, guessers, anonymous), not just the drawer.
- **Rationale**:
  - The Scenario 4 user wording requires "all players see the correct word". The simplest way to deliver this is to drop the drawer-only filter at exactly the state that no longer needs hiding.
  - Pushing the reveal server-side keeps the rule auditable from the wire (a `curl` against `?participantId=<guesser>` shows the word) and removes any risk of client-side filtering drift.
- **Alternatives considered**:
  - **Add a separate `revealedWord` field**: rejected — pure duplication of `secretWord` and would require all clients to know about two fields meaning the same thing.
  - **Keep `secretWord` drawer-only and ship the cleartext word only in the End Round response**: rejected — would break the "rejoin after refresh sees the reveal" requirement (FR-003 + edge case 5).

## D3 — Restart wipes round state; participants + host are preserved

- **Decision**: `restartRoom(code, hostId)` sets `room.round = null`, `room.status = "lobby"`, and leaves `participants` (including `hostParticipantId`) untouched.
- **Rationale**:
  - The user wording is explicit: "everyone returns to the lobby with players preserved and all round state cleared".
  - Discarding `round` (and with it `scores`, `guesses`, `lockedParticipantIds`, `secretWord`, `drawerParticipantId`) is the minimal cleanup that gets the room back to a state that the existing `startRoom` (feature 002) can run against unchanged.
  - Cumulative scoring across rounds is explicitly out of scope per the Constitution §I.
- **Alternatives considered**:
  - **Keep `scores` to support cumulative scoring across rounds**: rejected — out of scope (Constitution §I — "no multiple rounds, drawer rotation, timers").
  - **Reset participants list (kick everyone)**: rejected — contradicts the user wording ("players preserved") and would force every guesser to rejoin.

## D4 — Both new endpoints are idempotent in their terminal state

- **Decision**:
  - A second `POST /end` while the room is already in `"result"` returns `200` with the unchanged snapshot. The `round` data is **not** mutated (no re-shuffle of guesses, no re-stamp of timestamps).
  - A second `POST /restart` while the room is already in `"lobby"` returns `200` with the unchanged snapshot.
- **Rationale**:
  - Matches the idempotency contract already established by `POST /rooms/:code/start` (feature 002): "starting an already-started room is `200` with the unchanged snapshot". Consistency across the API surface beats strict 409-on-repeat.
  - Makes the frontend's retry logic trivial — a transient network failure on Restart can be safely retried by the user without surfacing a confusing 409.
- **Alternatives considered**:
  - **Strict `409` on repeat**: rejected — inconsistent with `startRoom`'s established idempotency.
  - **`204 No Content` on repeat**: rejected — frontend already expects the room snapshot envelope; an empty body would force a separate refetch.

## D5 — Server is authoritative; UI buttons are decorative

- **Decision**: The frontend hides the **End Round** and **Restart** buttons from non-host viewers and from rooms in the wrong status, but the server independently enforces both gates via `participantId === hostParticipantId` and `status === <expected>` checks. A direct `curl` from any non-host `participantId` returns `403`; a `curl` from the host against a wrong-status room returns `409`.
- **Rationale**:
  - Per Constitution §II, identity is the opaque `participantId` and there is no auth layer; server-side gating is the only enforcement.
  - Matches the existing pattern from `POST /rooms/:code/start` (feature 002), which already does the same dual host + status check.
- **Alternatives considered**:
  - **Client-side enforcement only**: rejected — trivially bypassed via `curl`, violates §II.
  - **Embed the host check inside `toRoomSnapshot` and rely on the viewer flag**: rejected — `toRoomSnapshot` is a pure projection helper; mutating semantics belong in the service functions.

## D6 — Submit-guess endpoint refuses guesses in `"result"` state

- **Decision**: `submitGuess` returns `{ ok: false, reason: "no_round" }` (which the route maps to `409 "No round in progress"`) when `room.status !== "round"`. This is a small extension of the current `room.round === null` check — the new check is `room.status !== "round"`, which also covers the `"result"` case (where `room.round` is still populated for the snapshot's reveal but is no longer accepting guesses).
- **Rationale**:
  - FR-004 requires the guess endpoint to reject submissions in `"result"`. Reusing the existing `no_round` reason keeps the error envelope contract identical from the client's perspective.
- **Alternatives considered**:
  - **New `"round_ended"` reason and a different message**: rejected — adds a new branch in the route for no observable client benefit. The current "No round in progress" message is accurate for both `lobby` and `result` states.

## D7 — Test strategy

- **Decision**: Mirror the test layout from feature 003 — service-layer unit tests in `roomStore.test.ts`, HTTP integration tests in `rooms.test.ts`, schema tests in `schemas.test.ts`, component tests in `ResultView.test.tsx`. New behavior must trace to at least one new test per FR.
- **Rationale**: Constitution §V requires tests for spec-mandated behavior; the existing 136-test suite is the reference pattern; adding ~20 new tests keeps coverage proportional to the feature's surface area.
- **Anti-patterns to avoid**:
  - Don't delete or weaken existing snapshot tests when extending `toRoomSnapshot`.
  - Don't rely on the `RoomStoreProvider` in component tests — pass callbacks/state as props (the pattern established by `RoundView` after feature 003).

---

## Open questions

**None.** All policy decisions are pinned in `spec.md`'s *Assumptions* section and the corresponding FR-### rows in *Requirements*. Ready for Phase 1 (data-model, contracts, quickstart).
