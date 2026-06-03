# Contract: Snapshot Visibility Rules

**Feature**: 002-game-start-drawer
**Purpose**: Define how the `secretWord` field is filtered on every endpoint
that returns a `RoomSnapshot`, so the same rule applies regardless of which
endpoint produced the snapshot.
**Maps to**: US1, FR-006, FR-007, FR-008, SC-002, SC-003, SC-008.

## Scope

This contract applies to **every** endpoint that returns a `room` field of
type `RoomSnapshot`:

- `POST /rooms` (Scenario 1)
- `POST /rooms/:code/join` (Scenario 1)
- `GET /rooms/:code` (Scenario 1)
- `POST /rooms/:code/start` (this feature)

It does not introduce a new endpoint; it formalises how the existing
endpoints behave once `currentRound` ships.

## The rule

Every snapshot returned by the server is filtered through
`toRoomSnapshot(room, viewerParticipantId)`:

- If `room.currentRound === null` (status is `"lobby"`):
  → the snapshot's `currentRound` is `null`.
- If `room.currentRound !== null` (status is `"playing"`):
  → the snapshot's `currentRound` is
  `{ drawerParticipantId, secretWord: <word or null> }`, where `<word or null>`
  is the real word **if and only if** `viewerParticipantId === room.currentRound.drawerParticipantId`,
  and `null` otherwise.

## Viewer identification by endpoint

| Endpoint | How `viewerParticipantId` is sourced |
|---|---|
| `POST /rooms` | The freshly issued participant id (the creator is always the drawer if a round were active — irrelevant here since the response is always pre-round) |
| `POST /rooms/:code/join` | The freshly issued participant id for the new joiner. **A late join can only succeed while the room is `lobby` (FR-012); the join itself flips an error before reaching the snapshot when status is `playing`.** |
| `GET /rooms/:code?participantId=…` | The `participantId` query parameter, as already implemented in Scenario 1 |
| `POST /rooms/:code/start` | The `participantId` from the request body |

## What MUST never appear in a non-drawer snapshot

- The substring of the `secretWord` (no full or partial reveal).
- The length of the `secretWord`.
- Any encoding of the word's length (e.g., the count of underscores in a
  placeholder string).
- Any field on `Participant` that reveals the word indirectly.

The placeholder text the client renders to non-drawers is a fixed string
(e.g., `"Waiting for the drawer to begin…"`), with no per-room or per-word
variation.

## What MAY appear in a non-drawer snapshot

- `currentRound.drawerParticipantId` — needed so the client can render the
  drawer's name from the existing `participants` list.
- The `participants` array (full, including the drawer).
- `availableWords` — this is the static `STARTER_WORDS` list; it is not
  per-round word information.

## Tests that lock this rule in

- Backend `roomStore.test.ts`:
  - `toRoomSnapshot(room, drawerId).currentRound.secretWord` is non-null and
    is the real word.
  - `toRoomSnapshot(room, nonDrawerId).currentRound.secretWord` is `null`.
  - `toRoomSnapshot(room, undefined).currentRound.secretWord` is `null`.
  - `toRoomSnapshot(room, "no-such-id").currentRound.secretWord` is `null`.
  - `toRoomSnapshot(roomWithNoRound, anyId).currentRound` is `null`.
- Frontend integration test (`GamePage.test.tsx`):
  - When the snapshot reports `secretWord: "rocket"`, the rendered DOM
    contains the string `"rocket"` exactly once in the drawer's view.
  - When the snapshot reports `secretWord: null`, the rendered DOM does NOT
    contain any STARTER_WORDS string and shows only the fixed placeholder.

## Backward compatibility

The rule is additive: existing Scenario-1 callers see `currentRound: null`
on every snapshot until a successful `POST /:code/start`. Scenario-1 tests
that don't reference `currentRound` continue to pass; tests that compare
the full snapshot object MUST be updated to include the new field.
