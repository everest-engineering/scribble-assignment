# Phase 1 Data Model: Scribble Guessing Game

Extends the existing in-memory model in `backend/src/models/game.ts` and `roomStore.ts`. New/changed
fields are marked **NEW**. Mirror the response-facing shapes in `frontend/src/services/api.ts`.

## RoomStatus (changed)

```
RoomStatus = "lobby" | "active" | "result"   // NEW: was "lobby" only
```

State transitions:

```
lobby  --startGame (host, participants ≥ 2)-->  active
active --round ends (correct guess or end trigger)--> result
result --restart (host)-->  lobby   (roster preserved; round state cleared)
```

## Participant (extended)

| Field | Type | Notes |
|-------|------|-------|
| id | string (uuid) | existing |
| name | string | existing; MUST be trimmed, non-empty (FR-008) |
| joinedAt | string (ISO) | existing |
| score | number | **NEW** — starts at 0; +100 on correct guess (FR-017) |

## Room (extended)

| Field | Type | Notes |
|-------|------|-------|
| code | string | existing; unique join code (FR-001) |
| status | RoomStatus | existing field, expanded union (R6) |
| participants | Participant[] | existing |
| hostId | string | **NEW** — creator's participant id (FR-002, R3) |
| round | Round \| null | **NEW** — null in lobby; populated when active/result |
| createdAt / updatedAt | string (ISO) | existing |

## Round (new entity)

| Field | Type | Notes |
|-------|------|-------|
| drawerId | string | participant id of the drawer (FR-009) |
| word | string | secret word, deterministic from STARTER_WORDS (FR-010, R2) |
| guesses | Guess[] | shared history, synced via polling (FR-016) |
| status | "active" \| "result" | mirrors room round phase |

## Guess (new entity)

| Field | Type | Notes |
|-------|------|-------|
| id | string (uuid) | unique |
| participantId | string | author |
| playerName | string | denormalized for display |
| text | string | trimmed, non-empty (FR-014) |
| correct | boolean | `text.toLowerCase() === word.toLowerCase()` (FR-015) |
| createdAt | string (ISO) | ordering |

## RoomSnapshot (response shape, extended)

Returned by every room endpoint. Word visibility is viewer-dependent (R4).

| Field | Type | Notes |
|-------|------|-------|
| code | string | |
| status | RoomStatus | |
| participants | Participant[] | includes `score` |
| hostId | string | client derives `isHost = participantId === hostId` |
| drawerId | string \| null | null in lobby |
| word | string \| null | **present only when `viewerParticipantId === drawerId`** (FR-011) |
| hasWord | boolean | true once a round is active (guessers know a word exists, not its value) |
| guesses | Guess[] | shared history |
| availableWords | string[] | existing (kept for reference) |
| roles | ParticipantRole[] | existing |

## Validation Rules (from Requirements)

- Player name: trim; reject empty/whitespace-only (FR-008).
- Room code on join: reject empty/malformed/non-existent (FR-004).
- Start game: only host (`hostId`), only when `participants.length >= 2` (FR-007).
- Guess: trim; reject empty/whitespace-only (FR-014); compare case-insensitively (FR-015).
- Scoring: start 0; correct +100; incorrect +0 (FR-017).
- Restart: only host; clears `round` and resets every `participant.score` to 0; keeps roster
  and `status` → `lobby` (FR-019, FR-020).
- Room isolation: all mutations operate on a single `Map` entry keyed by code (FR-005).
