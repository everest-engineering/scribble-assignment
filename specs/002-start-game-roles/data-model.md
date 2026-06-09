# Data Model: Game Start & Role Assignment

This document extends the data model from `specs/001-room-setup-lobby/data-model.md`. Existing entities (Room, Participant, RoomSnapshot) are augmented; new entities are introduced.

## Extended: Room

| Field | Type | Description | Change |
|-------|------|-------------|--------|
| ...all existing fields... | | | Unchanged |
| round | `RoundState \| null` | Current round state, created on game start | **NEW** |

## Extended: RoomSnapshot

| Field | Type | Description | Change |
|-------|------|-------------|--------|
| ...all existing fields... | | | Unchanged |
| drawerId | `string \| null` | UUID of the participant assigned as drawer | **NEW** |
| phase | `"word-selection" \| "drawing" \| null` | Sub-status within in-progress | **NEW** |
| wordOptions | `string[] \| null` | 3 word options for drawer; null for guessers | **NEW** |
| secretWord | `string \| null` | The chosen secret word; null for guessers | **NEW** |

**Constraints**:
- `wordOptions` and `secretWord` are only populated in the snapshot when the requesting `participantId` matches `drawerId`
- `wordOptions` is set immediately after game start (during "word-selection" phase)
- `secretWord` is set after the drawer selects a word (after transition to "drawing" phase)

## New: RoundState

Tracks the state of the current round.

| Field | Type | Description |
|-------|------|-------------|
| drawerId | `string` (UUID) | The participant assigned as drawer |
| guesserIds | `string[]` | UUIDs of all guesser participants |
| wordOptions | `string[]` | 3 word options presented to the drawer |
| secretWord | `string \| null` | The word chosen by the drawer (null until selected) |
| phase | `"word-selection" \| "drawing"` | Current phase within the round |

## New: WordBank

Manages the pool of available words.

| Field | Type | Description |
|-------|------|-------------|
| words | `string[]` | Flat list of 100+ curated words |

**Constraints**:
- Each word is unique within the bank
- Words are age-appropriate and suitable for drawing
- 3 words are selected uniformly at random without replacement for `wordOptions`

## State Transitions

```
lobby ──(host starts game)──> in-progress (word-selection phase)
                                     │
                            (drawer selects word)
                                     │
                                     v
                              in-progress (drawing phase)
```

## Validation Rules

| Input | Rule | Error |
|-------|------|-------|
| Start game | Room must have ≥2 participants | "Need at least 2 players to start" |
| Start game | Caller must be host | "Only the host can start the game" |
| Start game | Room status must be "lobby" | "Game has already started" |
| Word selection | Caller must be the drawer | "Only the drawer can select a word" |
| Word selection | Word must be one of the 3 options | "Invalid word selection" |
| Word selection | Phase must be "word-selection" | "Word already selected" |
