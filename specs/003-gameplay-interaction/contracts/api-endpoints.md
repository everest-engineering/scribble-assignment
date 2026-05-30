# API Contracts: Gameplay Interaction

## PUT /rooms/:code/drawing

### Request

```json
{ "participantId": "drawer-uuid", "drawing": { "paths": [] } }
```

### Response 200

```json
{ "room": { "code": "ABCD", "status": "playing", "drawing": { "paths": [] } } }
```

### Errors

- `403` when participant is not drawer.
- `409` when room is not playing.

## POST /rooms/:code/drawing/clear

### Request

```json
{ "participantId": "drawer-uuid" }
```

### Response 200

```json
{ "room": { "code": "ABCD", "drawing": { "paths": [] } } }
```

## POST /rooms/:code/guesses

### Request

```json
{ "participantId": "guesser-uuid", "text": "rocket" }
```

### Response 200

```json
{
  "room": {
    "code": "ABCD",
    "guesses": [],
    "scores": []
  }
}
```

### Errors

- `400` when guess is empty after trimming.
- `403` when drawer submits a guess.
- `409` when room is not playing.

## GET /rooms/:code?participantId=<id>

Returns drawing, guess history, and scores for polling sync.
