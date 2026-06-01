# Contract: Canvas Strokes

## POST `/api/rooms/:code/strokes`

Submit drawing strokes (append) or clear the canvas.

**Request Body**:

```json
{
  "participantId": "string",
  "action": "append" | "clear",
  "strokes": [  // Required only when action="append"
    {
      "color": "#000000",
      "width": 3,
      "points": [{ "x": 10, "y": 20 }, { "x": 15, "y": 25 }]
    }
  ]
}
```

**Validation**:
- `participantId` must exist in the room
- Only the drawer can submit strokes/clear
- Room must be in `"playing"` status
- `action="append"`: strokes array must be non-empty, max 1MB serialized
- `action="clear"`: strokes field ignored

**Success Response** (200):

```json
{
  "strokes": [ /* all current DrawingStroke objects */ ],
  "clearVersion": 0
}
```

**Error Responses**:
- 403: Not the drawer
- 400: Room not in playing state
- 400: Validation error (empty strokes, too large)

## GET `/api/rooms/:code/strokes`

Fetch current canvas state (used for polling).

**Query Parameters**: `?participantId=string`

**Success Response** (200):

```json
{
  "strokes": [ /* DrawingStroke[] */ ],
  "clearVersion": 0
}
```

**Error Responses**:
- 404: Room not found

**Polling Behavior**: Clients compare `clearVersion` with their last-known value. If different, the canvas was cleared and all previous strokes should be discarded before rendering the new stroke array.
