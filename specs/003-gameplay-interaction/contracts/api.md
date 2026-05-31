# API Contracts: Gameplay Interaction (003)

**Base URL**: `http://localhost:3001` (dev)  
**Content-Type**: `application/json`

---

## Existing Endpoints (unchanged from Scenario 2)

`POST /rooms`, `POST /rooms/:code/join`, `POST /rooms/:code/start`, `GET /rooms/:code` —
all unchanged. `GET /rooms/:code` now returns `guesses` and `scores` in every snapshot
(see updated `RoomSnapshot` shape below).

---

## New Endpoint: Submit Guess

### `POST /rooms/:code/guess`

Submit a guess from a non-drawer participant during an active game.

**Path Parameters**:

| Parameter | Type   | Description                          |
|-----------|--------|--------------------------------------|
| `code`    | string | Room code (case-insensitive; canonicalized to uppercase internally) |

**Request Body**:

```json
{
  "participantId": "uuid-string",
  "text": "elephant"
}
```

| Field           | Type   | Required | Constraints                        |
|-----------------|--------|----------|------------------------------------|
| `participantId` | string | yes      | Valid UUID; must be a participant in the room; must not be the drawer |
| `text`          | string | yes      | Any string (trimmed server-side; empty after trim is rejected) |

**Success Response — 200 OK**:

```json
{
  "room": {
    "code": "AB3X",
    "hostId": "uuid-alice",
    "status": "active",
    "participants": [
      { "id": "uuid-alice", "name": "Alice", "joinedAt": "2026-05-31T10:00:00.000Z" },
      { "id": "uuid-bob",   "name": "Bob",   "joinedAt": "2026-05-31T10:00:05.000Z" }
    ],
    "availableWords": [],
    "roles": ["drawer", "guesser"],
    "drawerId": "uuid-alice",
    "wordPlaceholder": "_ _ _ _ _ _ _ _",
    "guesses": [
      {
        "participantId": "uuid-bob",
        "participantName": "Bob",
        "text": "elephant",
        "correct": false,
        "index": 0
      }
    ],
    "scores": {
      "uuid-alice": 0,
      "uuid-bob": 0
    }
  }
}
```

Note: response is viewer-scoped to the submitter (`participantId`). Above shows Bob's view
(guesser): no `secretWord`, `wordPlaceholder` present.

**Success Response — 200 OK (correct guess, game ends)**:

```json
{
  "room": {
    "code": "AB3X",
    "status": "ended",
    "drawerId": "uuid-alice",
    "secretWord": "umbrella",
    "guesses": [
      {
        "participantId": "uuid-bob",
        "participantName": "Bob",
        "text": "umbrella",
        "correct": true,
        "index": 0
      }
    ],
    "scores": {
      "uuid-alice": 0,
      "uuid-bob": 100
    }
  }
}
```

Note: when `status === "ended"`, `secretWord` is present for all viewers; no `wordPlaceholder`.

**Error Responses**:

| Status | Condition | Example message |
|--------|-----------|-----------------|
| 400    | `text` is empty or whitespace-only after trim | `"Guess cannot be empty"` |
| 403    | `participantId` is not in the room | `"Participant not in room"` |
| 403    | `participantId` equals `drawerId` | `"Drawer cannot guess"` |
| 404    | Room code not found | `"Room not found"` |
| 409    | Room status is not `"active"` | `"Game is not active"` |

**Error response body shape** (all errors, existing format):

```json
{ "message": "Drawer cannot guess" }
```

---

## Updated `RoomSnapshot` Shape

All four existing endpoints now include `guesses` and `scores` in every response. Fields are
present in all room states (empty array / empty object in `lobby`; populated when `active` or
`ended`).

```typescript
interface RoomSnapshot {
  code: string;
  hostId: string;
  status: "lobby" | "active" | "ended";
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  drawerId: string;
  secretWord?: string;        // present: drawer (active), all (ended)
  wordPlaceholder?: string;   // present: guessers only (active)
  guesses: Guess[];           // always present
  scores: Record<string, number>; // always present
}

interface Guess {
  participantId: string;
  participantName: string;
  text: string;
  correct: boolean;
  index: number;
}
```

---

## Polling Behavior (unchanged)

`GET /rooms/:code?participantId={uuid}` continues to be called at ~2s cadence from
`GamePage.tsx`. After a correct guess transitions the room to `"ended"`, the next poll
response reflects `status: "ended"`, `secretWord`, full `guesses` array with the winning
entry, and updated `scores`. No new endpoint or polling channel is needed.
