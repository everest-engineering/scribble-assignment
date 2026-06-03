# API Contracts: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-03

All schemas are defined in `shared/schemas/room.ts` (Zod) and must be updated before any implementation begins (Constitution Principle VI).

---

## Updated: `RoomStatus`

```typescript
// shared/schemas/room.ts
export const roomStatusSchema = z.enum(["lobby", "in-progress", "finished"]);
```

---

## New: `GuessSnapshot`

```typescript
// shared/schemas/room.ts
export const guessSnapshotSchema = z.object({
  id: z.string(),
  participantId: z.string(),
  participantName: z.string(),
  text: z.string(),
  correct: z.boolean(),
  submittedAt: z.string()
});

export type GuessSnapshot = z.infer<typeof guessSnapshotSchema>;
```

---

## Updated: `RoomSnapshot`

Adds five new fields. All existing fields are unchanged.

```typescript
// shared/schemas/room.ts
export const roomSnapshotSchema = z.object({
  code: z.string(),
  status: roomStatusSchema,
  hostId: z.string(),
  participants: z.array(participantSnapshotSchema),
  availableWords: z.array(z.string()),
  roles: z.array(participantRoleSchema),
  drawerId: z.string().nullable(),
  currentWord: z.string().nullable(),
  // NEW:
  canvasDataUrl: z.string().nullable(),
  guesses: z.array(guessSnapshotSchema),
  scores: z.record(z.string(), z.number()),
  roundEndsAt: z.string().nullable(),
  hasGuessedCorrectly: z.boolean()
});
```

---

## New: `PUT /rooms/:code/canvas`

Update the canvas with a new drawing state (drawer only).

### Request

```http
PUT /rooms/:code/canvas
Content-Type: application/json

{
  "participantId": "string (uuid)",
  "canvasDataUrl": "string (base64 PNG data URL)"
}
```

### Response — 204 No Content

```http
HTTP/1.1 204 No Content
```

### Error Responses

| Status | Reason | Message |
|--------|--------|---------|
| 400 | `not_active` | "Round is not active" |
| 403 | `not_drawer` | "Only the drawer can update the canvas" |
| 404 | `not_found` | "Room not found" |

---

## New: `DELETE /rooms/:code/canvas`

Clear the canvas (drawer only).

### Request

```http
DELETE /rooms/:code/canvas
Content-Type: application/json

{
  "participantId": "string (uuid)"
}
```

### Response — 204 No Content

```http
HTTP/1.1 204 No Content
```

### Error Responses

| Status | Reason | Message |
|--------|--------|---------|
| 400 | `not_active` | "Round is not active" |
| 403 | `not_drawer` | "Only the drawer can clear the canvas" |
| 404 | `not_found` | "Room not found" |

---

## New: `POST /rooms/:code/guesses`

Submit a guess (guessers only).

### Request

```http
POST /rooms/:code/guesses
Content-Type: application/json

{
  "participantId": "string (uuid)",
  "text": "string (raw guess input)"
}
```

### Response — 201 Created

```json
{
  "guess": {
    "id": "uuid",
    "participantId": "uuid",
    "participantName": "Bob",
    "text": "rocket",
    "correct": true,
    "submittedAt": "2026-06-03T10:05:00.000Z"
  }
}
```

### Error Responses

| Status | Reason | Message |
|--------|--------|---------|
| 400 | `empty_guess` | "Guess cannot be empty" |
| 400 | `not_active` | "Round is not active" |
| 403 | `is_drawer` | "The drawer cannot submit guesses" |
| 404 | `not_found` | "Room not found" |
| 409 | `already_correct` | "You have already guessed correctly this round" |

---

## Updated: `GET /rooms/:code`

**No change to request shape.** Response gains new `RoomSnapshot` fields from the schema update above.

### Example Response — in-progress (guesser perspective)

```json
{
  "room": {
    "code": "ABCD",
    "status": "in-progress",
    "hostId": "uuid-host",
    "participants": [
      { "id": "uuid-host",  "name": "Alice", "joinedAt": "2026-06-03T10:00:00.000Z" },
      { "id": "uuid-guest", "name": "Bob",   "joinedAt": "2026-06-03T10:00:05.000Z" }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "drawerId": "uuid-host",
    "currentWord": null,
    "canvasDataUrl": "data:image/png;base64,iVBORw0KGgo...",
    "guesses": [
      {
        "id": "uuid-guess-1",
        "participantId": "uuid-guest",
        "participantName": "Bob",
        "text": "rocket",
        "correct": true,
        "submittedAt": "2026-06-03T10:05:00.000Z"
      }
    ],
    "scores": {
      "uuid-host":  0,
      "uuid-guest": 100
    },
    "roundEndsAt": "2026-06-03T10:01:30.000Z",
    "hasGuessedCorrectly": true
  }
}
```

### Example Response — finished state

```json
{
  "room": {
    "code": "ABCD",
    "status": "finished",
    ...
    "roundEndsAt": null,
    "hasGuessedCorrectly": true
  }
}
```

---

## Backward Compatibility

The five new fields added to `RoomSnapshot` are additive. Existing clients that do not read them are unaffected. The Zod schemas on both sides are updated together before implementation begins (Contract First, Constitution Principle VI).

The `"finished"` addition to `RoomStatus` is also additive — existing `if (status === "in-progress")` guards in the frontend correctly fall through when status is `"finished"`, producing the correct disabled-input behaviour required by FR-018/FR-019 without additional changes.
