# API Contract: Result, Restart & Final Validation

This document specifies the endpoints, request/response payloads, and validation constraints for Feature Group 4.

## Endpoints

### 1. Restart Game
Triggers a restart of the game, transitioning it back to the lobby state. Only permitted for the host of the room.

* **URL**: `/rooms/:code/restart`
* **Method**: `POST`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "participantId": "string"
  }
  ```

#### Request Schema (Zod)
```typescript
export const restartRoomSchema = z.object({
  participantId: z.string().trim().min(1, "Participant ID is required")
});
```

#### Success Response
* **Status**: `200 OK`
* **Body**: `roomResponseSchema`
  ```json
  {
    "room": {
      "code": "ABCD",
      "status": "lobby",
      "hostParticipantId": "host-uuid-1234",
      "participants": [
        { "id": "host-uuid-1234", "name": "Alice", "joinedAt": "2026-05-31T05:00:00Z", "score": 0 },
        { "id": "player-uuid-5678", "name": "Bob", "joinedAt": "2026-05-31T05:01:00Z", "score": 0 }
      ],
      "availableWords": ["rocket", "cookie", "laptop"],
      "roles": ["drawer", "guesser"],
      "guessHistory": []
    }
  }
  ```

#### Error Responses

* **Room Not Found**
  * **Status**: `404 Not Found`
  * **Body**:
    ```json
    {
      "error": {
        "code": "ROOM_NOT_FOUND",
        "message": "Room could not be found or joined."
      }
    }
    ```

* **Not Host**
  * **Status**: `403 Forbidden`
  * **Body**:
    ```json
    {
      "error": {
        "code": "RESTART_REQUIRES_HOST",
        "message": "Only the host can restart the game."
      }
    }
    ```

* **Game Not in Result State**
  * **Status**: `400 Bad Request`
  * **Body**:
    ```json
    {
      "error": {
        "code": "GAME_NOT_IN_RESULT",
        "message": "Game is not in result state."
      }
    }
    ```

### 2. Guesses During Result State
Any guess submitted via `POST /rooms/:code/guesses` when the room status is `"result"` MUST be rejected.

* **Status**: `400 Bad Request`
* **Body**:
  ```json
  {
    "error": {
      "code": "GAME_ALREADY_ENDED",
      "message": "Guesses can only be submitted during active gameplay"
    }
  }
  ```

---

## Shared Schema Updates

### 1. `roomStatusSchema`
Updated to include `"result"` state:
```typescript
export const roomStatusSchema = z.enum(["lobby", "in-game", "result"]);
```

### 2. `roomSnapshotSchema`
Updated to include `correctGuesserId` field:
```typescript
export const roomSnapshotSchema = z.object({
  code: z.string(),
  status: roomStatusSchema,
  hostParticipantId: z.string(),
  participants: z.array(participantSchema),
  availableWords: z.array(z.string()),
  roles: z.array(z.enum(["drawer", "guesser"])),
  roundState: z.object({
    drawerId: z.string(),
    secretWord: z.string().optional()
  }).optional(),
  guessHistory: z.array(guessEntrySchema),
  correctGuesserId: z.string().nullable().optional() // Returns z.string() in result state, null/undefined in lobby/in-game states
});
```
