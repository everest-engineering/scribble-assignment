# Contract: Snapshot Visibility Rules (extended)

**Feature**: 003-gameplay-interaction
**Purpose**: Extend Scenario 2's snapshot-visibility contract with the
per-entry guess-text redaction rule (FR-016, SC-010).
**Maps to**: US1, US2, FR-006, FR-007, FR-016, SC-002, SC-010.

## Scope

This contract supplements `specs/002-game-start-drawer/contracts/snapshot-visibility-rules.md`.
The Scenario 2 rule (filter `currentRound.secretWord` per viewer) continues
to apply unchanged. This document adds a second filter that runs on the
same `toRoomSnapshot(room, viewerParticipantId)` function for the new
`room.guesses[]` field.

It applies to **every** endpoint that returns a `room` field of type
`RoomSnapshot`:

- `POST /rooms` (Scenario 1) — returns empty `guesses: []` since `status === "lobby"`.
- `POST /rooms/:code/join` (Scenario 1) — same.
- `GET /rooms/:code` (Scenario 1) — applies the filter described below.
- `POST /rooms/:code/start` (Scenario 2) — returns `guesses: []` at the moment of transition.
- `POST /rooms/:code/guess` (this feature) — applies the filter described below; the just-submitted entry's text is always real for the submitter because they are the original guesser.

## The rule (additional to Scenario 2's secretWord filter)

For each `entry` in `room.guesses`:

- If `entry.isCorrect === false` → the snapshot's entry has `text: <real trimmed string>`.
- If `entry.isCorrect === true` → the snapshot's entry has `text: <real trimmed string>` ONLY when ONE of these is true:
  - `viewerParticipantId === entry.guesserParticipantId` (the original guesser sees their own text), OR
  - `viewerParticipantId === room.currentRound.drawerParticipantId` (the current drawer sees all correct text).
  Otherwise the entry has `text: null`.

The server NEVER emits a placeholder string. The frontend chooses the
placeholder to render when `text === null`. This ensures the placeholder
cannot leak the word's length or content.

## Viewer identification by endpoint

| Endpoint | How `viewerParticipantId` is sourced |
|---|---|
| `POST /rooms` | The newly issued participant id (no guesses to filter; `guesses === []`) |
| `POST /rooms/:code/join` | The newly issued participant id (no guesses to filter; `guesses === []`) |
| `GET /rooms/:code?participantId=…` | The `participantId` query parameter |
| `POST /rooms/:code/start` | The `participantId` from the request body |
| `POST /rooms/:code/guess` | The `participantId` from the request body |

## What MUST never appear in a non-privileged snapshot

For a viewer who is neither the original guesser of an entry nor the
current drawer, and for any entry where `isCorrect === true`:

- The substring of the secret word (no partial reveal).
- The length of the secret word.
- Any encoding of the word's length (e.g., the count of characters in the
  delivered `text` value).
- Any side-channel that varies with the word (the placeholder rendered by
  the client is a fixed string regardless of which word the round chose).

## What MAY appear

- `entry.id` — opaque.
- `entry.guesserParticipantId` — so the client can render the guesser's
  name (looked up from `participants`).
- `entry.isCorrect` — explicit boolean. Required so the client can render
  a "correct" or "incorrect" badge without the text.
- `entry.submittedAt` and `entry.order` — required for stable ordering.

## Tests that lock this rule in

- Backend `roomStore.test.ts`:
  - `toRoomSnapshot(room, originalGuesserId).guesses[i].text === originalText`
    for the entry where `entry.guesserParticipantId === originalGuesserId`,
    regardless of `entry.isCorrect`.
  - `toRoomSnapshot(room, drawerId).guesses[i].text === originalText` for
    every entry in `room.guesses` (drawer is fully privileged).
  - `toRoomSnapshot(room, thirdPartyId).guesses[i].text === null` for every
    entry where `entry.isCorrect === true && entry.guesserParticipantId !== thirdPartyId`.
  - `toRoomSnapshot(room, thirdPartyId).guesses[i].text === originalText`
    for every entry where `entry.isCorrect === false`.
  - `toRoomSnapshot(room, undefined).guesses[i].text === null` for every
    correct entry (an unidentified viewer is treated as non-privileged).
- Frontend integration test (`GamePage.test.tsx`):
  - When the snapshot reports `text: "rocket"` for an entry, the rendered
    DOM contains `"rocket"` next to that history row.
  - When the snapshot reports `text: null` for a correct entry, the
    rendered DOM does NOT contain any STARTER_WORDS string in that row
    and instead contains the chosen placeholder.

## Backward compatibility

- Scenario 1 callers that ignored `guesses` continue to ignore the field;
  the empty array adds negligible payload size.
- Scenario 2 callers see `guesses: []` until the new
  `POST /:code/guess` endpoint is exercised. Existing Scenario 2 tests
  that compare snapshot objects must be updated to expect the new field.
