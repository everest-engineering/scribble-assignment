# API Contract: Gameplay Interaction

## POST /api/rooms/:roomId/guess
Submits a guess for the current round.

**Request Body**
```json
{
  "playerId": "string",
  "guess": "string"
}
```

**Response**
```json
{
  "success": "boolean",
  "isCorrect": "boolean",
  "pointsAwarded": "number"
}
```

## POST /api/rooms/:roomId/canvas
Updates canvas state.

**Request Body**
```json
{
  "playerId": "string",
  "drawingEvents": "JSON object"
}
```

**Response**
```json
{
  "success": "boolean"
}
```
