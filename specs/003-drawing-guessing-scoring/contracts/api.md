# API Contracts: Drawing, Guessing, and Scoring

## New Endpoints

### POST /rooms/:code/strokes
Updates the visual data for the room.

- **Request Body**:
  ```json
  {
    "participantId": "string",
    "strokes": [ { "points": [], "color": "string", "width": 2 } ]
  }
  ```
- **Responses**:
  - `200 OK`: Strokes updated.
  - `403 Forbidden`: Requester is not the drawer.
  - `404 Not Found`: Room invalid.

### POST /rooms/:code/guesses
Submits a new guess.

- **Request Body**:
  ```json
  {
    "participantId": "string",
    "text": "string"
  }
  ```
- **Responses**:
  - `200 OK`: Guess processed. Returns `RoomSnapshot`.
  - `403 Forbidden`: Requester is the drawer (drawers cannot guess).
  - `400 Bad Request`: Empty or whitespace guess.

## Updated Snapshot

### GET /rooms/:code
Now includes `strokes` and `guesses`.

- **Response `200 OK`**:
  ```json
  {
    "room": {
      "strokes": [],
      "guesses": [],
      "participants": [ { "id": "uuid", "score": 100 } ]
    }
  }
  ```
