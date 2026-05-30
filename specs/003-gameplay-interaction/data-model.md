# Data Model: Gameplay Interaction

**Feature**: 003-gameplay-interaction | **Date**: 2026-05-30

**Builds on**: [002-game-start-drawer-flow/data-model.md](../002-game-start-drawer-flow/data-model.md)

## Entity Relationship

```text
Room 1──* Participant
Room 1──* Stroke          (canvas drawing; ordered)
Room 1──* Guess           (guess history; ordered)
Room ── scoredParticipantIds ──> Set<participantId>  (first correct score tracking)
Participant ── score ──> number (per round)
Guess ── participantId ──> Participant
Stroke ── (owned by drawer actions only)
```

## Stroke

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | yes | Stable stroke identifier |
| `points` | `{ x: number; y: number }[]` | yes | Polyline in canvas coordinates (≥ 2 points) |
| `color` | `string` | yes | Stroke color (lab default: `#111827`) |
| `width` | `number` | yes | Line width in px (lab default: `3`) |

### Validation rules

- `points` MUST contain at least two coordinates
- Coordinates MUST be finite numbers within canvas bounds (0–width, 0–height)
- Only drawer may append strokes or trigger clear

## Guess

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | yes | Unique guess record id |
| `participantId` | `string` | yes | Submitter participant id |
| `participantName` | `string` | yes | Denormalized trimmed name at submit time |
| `text` | `string` | yes | Trimmed guess text |
| `isCorrect` | `boolean` | yes | Case-insensitive match vs `secretWord` |
| `submittedAt` | `string` (ISO) | yes | Server timestamp |

### Validation rules

- `text` MUST be non-empty after trim before record creation
- Submitter MUST NOT be the drawer
- Submitter MUST be a participant in the room
- Room MUST be in `playing` status

## Room (internal — backend) — new/extended fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `strokes` | `Stroke[]` | yes | Current canvas strokes; `[]` at start and after clear |
| `guesses` | `Guess[]` | yes | Chronological guess history; `[]` at start |
| `scoredParticipantIds` | `string[]` | yes | Participants who received +100 for correct guess |

### Participant extension

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `score` | `number` | yes | Round score; init `0` on `startRoom`; non-negative |

### Validation rules

- `strokes`, `guesses`, `scoredParticipantIds` initialized empty on `startRoom`
- Each participant `score` set to `0` on `startRoom`
- `clearCanvas` sets `strokes = []` without mutating guesses or scores
- Correct guess: if `guess.text.toLowerCase() === secretWord.toLowerCase()` and
  `participantId ∉ scoredParticipantIds`, then `score += 100` and append id to
  `scoredParticipantIds`

### State transitions (Scenario 3 scope)

```text
playing (start) ── strokes=[], guesses=[], scores=0
playing ──(drawer add stroke)──> playing (strokes appended)
playing ──(drawer clear)──> playing (strokes cleared)
playing ──(guesser guess)──> playing (guess appended; score maybe +100)
```

Round end / restart clearing is Scenario 4.

## RoomSnapshot (API response — extended)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `strokes` | `Stroke[]` | when playing | Full canvas state; `[]` or omitted in lobby |
| `guesses` | `Guess[]` | when playing | Full guess history; `[]` or omitted in lobby |
| `participants[].score` | `number` | yes | Current score (0 in lobby) |

`secretWord` remains viewer-filtered (Scenario 2); unchanged.

## ParticipantSnapshot (API response — extended)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `score` | `number` | yes | Participant round score |

## Frontend session state (`RoomState`)

Extended snapshot fields consumed by game components.

### Derived game UI values

| Derived | Logic |
|---------|-------|
| `strokes` | `room.strokes ?? []` |
| `guesses` | `room.guesses ?? []` |
| `scoresByParticipant` | Map from `participants[].id` to `score` |
| `canDraw` | `viewer?.role === "drawer"` |
| `canGuess` | `viewer?.role === "guesser"` |

## Mapping spec requirements to model

| Requirement | Model support |
|-------------|---------------|
| FR-001–FR-005 | `Stroke[]` on Room; snapshot `strokes`; drawer POST endpoints |
| FR-006 | `Participant.score = 0` on start |
| FR-007–FR-011 | `Guess` + `submitGuess()` with trim and case-insensitive compare |
| FR-012–FR-014 | Score increment + `scoredParticipantIds` cap |
| FR-015–FR-016 | `guesses[]` chronological append |
| FR-017–FR-020 | Extended snapshot on existing GET poll |
| FR-018–FR-019 | `Scoreboard` reads `participants[].score`; `ResultPanel` reads `guesses` |
