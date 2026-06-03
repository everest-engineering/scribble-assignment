# Contract: Snapshot Visibility Rules (extended for the result state)

**Feature**: 004-result-restart
**Purpose**: Extend Scenarios 2 + 3's snapshot-visibility contracts with
the result-state full-reveal override.
**Maps to**: US1, FR-005, FR-007, SC-002, SC-004.

## Scope

This contract supplements:

- `specs/002-game-start-drawer/contracts/snapshot-visibility-rules.md` (drawer-only `secretWord` rule)
- `specs/003-gameplay-interaction/contracts/snapshot-visibility-rules.md` (per-entry `guess.text` redaction rule)

The Scenario 2 and Scenario 3 rules continue to apply during the
`"playing"` state. This document adds a single override that fires when
`room.status === "result"`.

It applies to **every** endpoint that returns a `room` field of type
`RoomSnapshot`:

- `POST /rooms` (Scenario 1) — never returns result state; rule never fires.
- `POST /rooms/:code/join` (Scenario 1) — same.
- `GET /rooms/:code` (Scenario 1) — applies the override below.
- `POST /rooms/:code/start` (Scenario 2) — never returns result state.
- `POST /rooms/:code/guess` (Scenario 3) — never returns result state (guesses are rejected outside `playing`).
- `POST /rooms/:code/end` (this feature) — first endpoint to ever return result state.
- `POST /rooms/:code/restart` (this feature) — returns lobby state on success; rule does not fire on the response itself but the next `GET` from a polling tab does see lobby.

## The override

When `room.status === "result"`:

- `snapshot.currentRound.secretWord` MUST be the real value for every
  viewer, regardless of `viewerParticipantId`.
- For every entry in `snapshot.guesses`, `snapshot.guesses[i].text` MUST
  be the real trimmed text for every viewer, regardless of
  `viewerParticipantId` and regardless of whether the entry was correct.

When `room.status === "playing"`:

- Scenario 2 and Scenario 3 rules apply unchanged. The result-state
  override does NOT short-circuit `playing`-state filtering.

When `room.status === "lobby"`:

- `snapshot.currentRound === null` and `snapshot.guesses === []`. No
  visibility question to answer.

## What MUST appear in a result-state snapshot

For every viewer:

- `room.currentRound.secretWord` as a literal string from
  `STARTER_WORDS`.
- For every `entry` in `room.guesses`: `entry.text` as the original
  trimmed string the guesser submitted.

## What MUST NOT appear in a result-state snapshot

- `null` for `currentRound.secretWord` — this is a regression of FR-005
  if it ever happens.
- `null` for any `guesses[i].text` whose corresponding `Guess.text` is
  non-null on the server — this is a regression of FR-007.

## Tests that lock this rule in

- Backend `roomStore.test.ts`:
  - With a room in `status === "result"`,
    `toRoomSnapshot(room, anyViewerId).currentRound.secretWord ===
    room.currentRound.secretWord` for every viewer id, including the
    drawer, every guesser, and an unknown id.
  - With the same room, `toRoomSnapshot(room, anyViewerId).guesses[i].text
    === room.guesses[i].text` for every entry and every viewer id —
    explicitly including entries that were `isCorrect: true` (which
    Scenario 3 would have redacted for third-party viewers during
    `playing`).
- Regression: with a room in `status === "playing"`, the existing
  Scenario 2 + Scenario 3 redactions MUST continue to apply (this is
  why we explicitly assert both states in the same test block).

## Backward compatibility

- All Scenario 1, 2, and 3 snapshots in `lobby` or `playing` state are
  unaffected. Existing tests pass.
- Clients that hard-code the existing redaction client behaviour (the
  `"<correct guess>"` placeholder for `text === null`) still work: in
  result state, `text` is always non-null and the placeholder branch
  never fires.
