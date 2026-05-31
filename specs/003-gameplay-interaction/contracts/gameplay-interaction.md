# API Contract: Guess Submission

## POST /rooms/:code/guesses

Submits a guess for the secret word.

### Path Parameters
- `code` (string): The 4-character unique code of the room (e.g. `ABCD`).

### Request Body
Validated on the backend using Zod.
- `participantId` (string, required): The ID of the participant submitting the guess. Must be a non-empty trimmed string.
- `guessText` (string, required): The guess text. Must be a non-empty trimmed string.

```json
{
  "participantId": "345be11b-10ea-4c4f-9556-9b62f4007b8a",
  "guessText": "rocket"
}
```

### Response Payload Validation (Zod Schemas)

API boundaries are validated on the backend using Zod:

```typescript
export const participantSchema = z.object({
  id: z.string(),
  name: z.string(),
  joinedAt: z.string(),
  score: z.number()
});

export const guessEntrySchema = z.object({
  id: z.string(),
  participantId: z.string(),
  playerName: z.string(),
  guessText: z.string(),
  isCorrect: z.boolean(),
  createdAt: z.string()
});

export const roomSnapshotSchema = z.object({
  code: z.string(),
  status: z.enum(["lobby", "in-game"]),
  hostParticipantId: z.string(),
  participants: z.array(participantSchema),
  availableWords: z.array(z.string()),
  roles: z.array(z.enum(["drawer", "guesser"])),
  roundState: z.object({
    drawerId: z.string(),
    secretWord: z.string().optional()
  }).optional(),
  guessHistory: z.array(guessEntrySchema)
});
```

---

### Responses

#### 200 OK
Returned when the guess is successfully processed (whether correct or incorrect). Returns the updated `RoomSnapshot`.

```json
{
  "room": {
    "code": "ABCD",
    "status": "in-game",
    "hostParticipantId": "345be11b-10ea-4c4f-9556-9b62f4007b8a",
    "participants": [
      {
        "id": "345be11b-10ea-4c4f-9556-9b62f4007b8a",
        "name": "Alice",
        "joinedAt": "2026-05-31T10:00:00.000Z",
        "score": 0
      },
      {
        "id": "789fa12b-34ea-4c4f-9556-9b62f4007b8b",
        "name": "Bob",
        "joinedAt": "2026-05-31T10:01:00.000Z",
        "score": 100
      }
    ],
    "availableWords": ["rocket", "apple", "banana"],
    "roles": ["drawer", "guesser"],
    "roundState": {
      "drawerId": "345be11b-10ea-4c4f-9556-9b62f4007b8a"
    },
    "guessHistory": [
      {
        "id": "99fca12b-34ea-4c4f-9556-9b62f4007b8c",
        "participantId": "789fa12b-34ea-4c4f-9556-9b62f4007b8b",
        "playerName": "Bob",
        "guessText": "apple",
        "isCorrect": false,
        "createdAt": "2026-05-31T10:05:00.000Z"
      },
      {
        "id": "88fca12b-34ea-4c4f-9556-9b62f4007b8d",
        "participantId": "789fa12b-34ea-4c4f-9556-9b62f4007b8b",
        "playerName": "Bob",
        "guessText": "rocket",
        "isCorrect": true,
        "createdAt": "2026-05-31T10:06:00.000Z"
      }
    ]
  }
}
```

#### 400 Bad Request
Returned when validation fails (e.g. empty guess, drawer trying to guess, or game not started).

- **Empty Guess**:
  ```json
  {
    "error": {
      "code": "INVALID_REQUEST",
      "message": "Guess cannot be empty"
    }
  }
  ```
- **Drawer Guess Attempt**:
  ```json
  {
    "error": {
      "code": "DRAWER_CANNOT_GUESS",
      "message": "The drawer is not permitted to submit guesses"
    }
  }
  ```
- **Game Not Started (Lobby state guess attempt)**:
  ```json
  {
    "error": {
      "code": "GAME_NOT_STARTED",
      "message": "Guesses can only be submitted when the game is in progress"
    }
  }
  ```

#### 404 Not Found
Returned when the room code does not exist.

```json
{
  "error": {
    "code": "ROOM_NOT_FOUND",
    "message": "Room could not be found or joined."
  }
}
```
