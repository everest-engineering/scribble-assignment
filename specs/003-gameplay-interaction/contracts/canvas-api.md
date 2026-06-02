# Canvas API

## GET /rooms/:code/canvas

Fetch current canvas strokes. Polled by all players at 1s interval.

**Response** `200 OK`:
```json
{
  "strokes": [
    [{"x": 10, "y": 20}, {"x": 15, "y": 25}],
    [{"x": 100, "y": 200}]
  ]
}
```

**Errors**: `404` if room not found.

---

## POST /rooms/:code/canvas

Save current canvas strokes. Called by drawer on each drawing action.

**Request**:
```json
{
  "participantId": "uuid",
  "strokes": [
    [{"x": 10, "y": 20}, {"x": 15, "y": 25}]
  ]
}
```

**Response** `200 OK`:
```json
{
  "ok": true
}
```

**Errors**: `403` if participant is not the drawer, `404` if room not found.

---

## POST /rooms/:code/canvas/clear

Clear the canvas. Called by drawer.

**Request**:
```json
{
  "participantId": "uuid"
}
```

**Response** `200 OK`:
```json
{
  "ok": true
}
```

**Errors**: `403` if participant is not the drawer, `404` if room not found.
