# API Contract: Gameplay (Canvas, Guesses, Poll)

**Base path**: `/rooms`  
**Feature**: `003-round-draw-guess`  
**Depends on**: `002-first-round-drawer` (`status: drawing`, roles, `secretWord`)

## PUT /rooms/:code/canvas

Replace full canvas state (drawer only).

**Query**: `?participantId=<uuid>`

**Body**

```json
{ "strokes": [{ "points": [{ "x": 10, "y": 20 }], "color": "#000", "width": 2 }] }
```

**Success `200`**: `{ "room": <RoomSnapshot> }`

**Errors**: 403 non-drawer; 400 invalid body; 404 room not found

## POST /rooms/:code/guesses

Submit a guess (guessers only).

**Query**: `?participantId=<uuid>`

**Body**

```json
{ "text": "  Rocket  " }
```

**Success `200`**: `{ "room": <RoomSnapshot> }` with updated `guesses` and `participants[].score`

**Errors**:

| Status | Condition |
|--------|-----------|
| 400 | Empty/whitespace guess — “Guess cannot be empty” |
| 403 | Drawer attempts guess |
| 404 | Room not found |

## GET /rooms/:code

Poll full game state (existing route). During `drawing` includes `canvasStrokes`, `guesses`, scores. **No `secretWord` for guessers.**
