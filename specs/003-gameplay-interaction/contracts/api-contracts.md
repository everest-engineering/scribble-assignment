# API Contracts: Gameplay Interaction

## POST /rooms/:code/stroke

**Authorization**: Only the drawer (`room.drawerId === participantId`)

**Request Body**:
```json
{
  "participantId": "uuid",
  "stroke": {
    "points": [{ "x": 10, "y": 20 }, { "x": 15, "y": 25 }],
    "color": "#000000",
    "lineWidth": 4
  }
}
```

**Response 200**: `{ "room": RoomSnapshot }`
**Response 403**: "Only the drawer can draw"
**Response 404**: Room not found

## POST /rooms/:code/clear

**Authorization**: Only the drawer

**Request Body**: `{ "participantId": "uuid" }`

**Response 200**: `{ "room": RoomSnapshot }` — strokes array empty
**Response 403**: "Only the drawer can clear the canvas"
**Response 404**: Room not found

## POST /rooms/:code/guess

**Authorization**: Any participant except the drawer

**Request Body**:
```json
{
  "participantId": "uuid",
  "text": "rocket"
}
```

**Response 200**: `{ "room": RoomSnapshot, "correct": true }`
**Response 400**: "Guess cannot be empty"
**Response 403**: "The drawer cannot submit guesses"
**Response 404**: Room not found

## RoomSnapshot (updated fields)

```json
{
  "strokes": [
    {
      "id": "stroke-uuid",
      "playerId": "drawer-uuid",
      "points": [{ "x": 10, "y": 20 }],
      "color": "#000000",
      "lineWidth": 4
    }
  ],
  "guesses": [
    {
      "id": "guess-uuid",
      "playerId": "guesser-uuid",
      "playerName": "Bob",
      "text": "rocket",
      "correct": true,
      "timestamp": "2026-06-03T12:00:00.000Z"
    }
  ],
  "playerScores": [
    { "playerId": "uuid-1", "score": 100, "name": "Alice" },
    { "playerId": "uuid-2", "score": 0, "name": "Bob" }
  ]
}
```
