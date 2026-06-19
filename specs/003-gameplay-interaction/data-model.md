# Phase 1 Data Model: Gameplay Interaction

Additive changes to the Group 1–2 in-memory model. New marked **new**.

## Entities

### Participant

| Field | Type | Change | Notes |
|-------|------|--------|-------|
| `id`, `name`, `joinedAt` | — | unchanged | From Groups 1–2 (name trimmed/non-empty). |
| `score` | `number` | **new** | Round points; **default 0**; set to 100 on this participant's first correct guess (FR-009, FR-010). |

### Guess *(new entity)*

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Unique guess id. |
| `participantId` | `string` | Who guessed. |
| `name` | `string` | Guesser's display name (denormalized for easy rendering). |
| `text` | `string` | The trimmed guess text (shown verbatim to all). |
| `correct` | `boolean` | Whether it matched the secret word (case-insensitive). |
| `at` | `string` (ISO) | Timestamp for ordering. |

### Room

| Field | Type | Change | Notes |
|-------|------|--------|-------|
| existing fields | — | unchanged | `code`, `status`, `hostId`, `drawerId?`, `secretWord?`, `participants`, timestamps. |
| `guesses` | `Guess[]` | **new** | Ordered shared history for the round; appended on each accepted guess (FR-007). |

### RoomSnapshot

| Field | Type | Change | Notes |
|-------|------|--------|-------|
| existing fields | — | unchanged | incl. `word` drawer-only, `drawerId`, `role`. |
| `participants` | `Participant[]` | now carries `score` | Scoreboard source (FR-012). |
| `guesses` | `Guess[]` | **new** | Same history for **all** viewers, verbatim (FR-008). |

> Drawing strokes are NOT modeled server-side (drawer-local per clarification) — no fields added for the canvas.

## Guess handling (server) — traced to FRs

```text
submitGuess(code, participantId, text):
    room        ← rooms.get(code)            else 404 "Unable to load room"
    if not active                            → (only meaningful in active round)
    if participantId == room.drawerId        → 403 "The drawer cannot guess."        (FR-004)
    trimmed = text.trim()
    if trimmed == ""                          → 400 "Enter a guess."                  (FR-005)
    guesser ← participant by id
    if guesser.score == 100                   → 409 "You already guessed the word."   (FR-011a)
    correct = trimmed.toLowerCase() == room.secretWord.toLowerCase()                   (FR-006)
    append { id, participantId, name, text: trimmed, correct, at } to room.guesses     (FR-007)
    if correct: guesser.score = 100                                                    (FR-010, FR-011)
    return snapshot
```

## Validation rules (traced to FRs)

| Rule | Where | FR |
|------|-------|----|
| Drawer has interactive canvas + clear; guessers can't draw | `DrawingCanvas` / `GamePage` | FR-001/002/003 |
| Only guessers submit; drawer refused | `submitGuess` 403 + GuessForm hidden/disabled for drawer | FR-004 |
| Trim + reject empty guess | client guard + `submitGuess` 400 | FR-005 |
| Case-insensitive correctness | `submitGuess` compare | FR-006 |
| Record guess in shared history | `room.guesses.push(...)` | FR-007 |
| History synced to all (no dupes, ordered) | `guesses` in snapshot via poll | FR-008 |
| Scores start at 0 | `createParticipant` score 0 | FR-009 |
| Correct = 100, incorrect = 0 | `submitGuess` sets score 100 on correct | FR-010 |
| Score once only | guard `score == 100` | FR-011 |
| Input disabled after correct | 409 server + GuessForm disabled | FR-011a |
| Scores visible to all | `participants[].score` in snapshot | FR-012 |
| No Group 1–2 regression | no changes to host/start/word logic | FR-013 |
