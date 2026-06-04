# API Endpoint Contracts: Scribble Multiplayer Drawing Game

All endpoints return JSON content.

---

## 1. Create Room
Creates a new game room session.
- **URL**: `POST /rooms`
- **Request Body**:
  ```json
  {
    "playerName": "Alice"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "participantId": "uuid-string-for-player",
    "room": {
      "code": "ABCD",
      "status": "lobby",
      "hostId": "uuid-string-for-player",
      "participants": [
        {
          "id": "uuid-string-for-player",
          "name": "Alice",
          "joinedAt": "2026-06-04T12:00:00.000Z"
        }
      ],
      "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
      "roles": ["drawer", "guesser"],
      "drawerId": null,
      "secretWord": null,
      "canvasData": "[]",
      "guesses": [],
      "scores": {
        "uuid-string-for-player": 0
      },
      "viewerRole": null
    }
  }
  ```

---

## 2. Join Room
Adds a new participant to an existing room.
- **URL**: `POST /rooms/:code/join`
- **Request Body**:
  ```json
  {
    "playerName": "Bob"
  }
  ```
- **Response** (`200 OK`):
  Same format as Create Room, with the new player added to `participants` and their score initialized to 0.

---

## 3. Fetch Room Snapshot (Polling)
Retrieves the latest room state.
- **URL**: `GET /rooms/:code?participantId=uuid-string`
- **Response** (`200 OK`):
  ```json
  {
    "room": {
      "code": "ABCD",
      "status": "playing",
      "hostId": "uuid-host-id",
      "participants": [...],
      "availableWords": [...],
      "roles": [...],
      "drawerId": "uuid-host-id",
      "secretWord": "guitar", // Visible ONLY if participantId matches drawerId OR if status is "result"
      "canvasData": "[]",
      "guesses": [],
      "scores": {...},
      "viewerRole": "drawer" // "drawer", "guesser", or null
    }
  }
  ```

---

## 4. Start Game
Transitions room from lobby to gameplay status.
- **URL**: `POST /rooms/:code/start?participantId=uuid-string`
- **Response** (`200 OK`):
  Returns the updated `RoomSnapshot`.

---

## 5. Submit Canvas Update
Saves the latest drawing strokes.
- **URL**: `POST /rooms/:code/draw`
- **Request Body**:
  ```json
  {
    "canvasData": "[]" // JSON serialized array of Line objects
  }
  ```
- **Response** (`200 OK`):
  Returns the updated `RoomSnapshot`.

---

## 6. Submit Guess
Submits a player's guess.
- **URL**: `POST /rooms/:code/guess`
- **Request Body**:
  ```json
  {
    "text": "guitar"
  }
  ```
- **Response** (`200 OK`):
  Returns the updated `RoomSnapshot` (with status changed to `"result"` if correct).

---

## 7. Restart Game
Resets the game state back to `"lobby"` while preserving player connections.
- **URL**: `POST /rooms/:code/restart?participantId=uuid-string`
- **Response** (`200 OK`):
  Returns the updated `RoomSnapshot` in `"lobby"` status.
