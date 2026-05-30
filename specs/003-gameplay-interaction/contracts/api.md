# API Contracts

## 1. Sync Game State (Polling)
- **Method**: `GET`
- **Endpoint**: `/api/rooms/:roomId/state`
- **Response** (200 OK):
```json
{
  "currentDrawerId": "user123",
  "strokes": [{...}],
  "guesses": [{...}],
  "scores": { "user123": 50, "user456": 20 },
  "timeRemaining": 45
}
```
*(Note: `currentWord` is omitted from the payload if the user is a guesser.)*

## 2. Submit Stroke
- **Method**: `POST`
- **Endpoint**: `/api/rooms/:roomId/strokes`
- **Payload**:
```json
{
  "userId": "user123",
  "stroke": {
    "id": "stroke-uuid",
    "color": "#000000",
    "brushSize": 5,
    "points": [{"x": 10, "y": 15}, {"x": 12, "y": 18}],
    "isComplete": false
  }
}
```
- **Response** (200 OK): `{ "success": true }`

## 3. Submit Guess
- **Method**: `POST`
- **Endpoint**: `/api/rooms/:roomId/guesses`
- **Payload**:
```json
{
  "userId": "user456",
  "guess": "apple"
}
```
- **Response** (200 OK):
```json
{
  "success": true,
  "isCorrect": false,
  "message": "Incorrect guess"
}
```
- **Error Responses**:
  - `429 Too Many Requests`: Rate limit exceeded (1 guess/sec).
  - `403 Forbidden`: If the Drawer tries to guess.
