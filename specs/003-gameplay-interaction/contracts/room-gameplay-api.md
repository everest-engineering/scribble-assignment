# Room Gameplay API

## Room snapshot polling

`GET /rooms/:code?participantId=...`

Returns the current room snapshot for polling.

### Snapshot shape

- room metadata: code, status, host, drawer
- participants with scores and roles
- drawing strokes
- guess history
- current word only for the drawer

## Submit drawing

`POST /rooms/:code/drawing`

### Request

- `participantId`
- `action`: `stroke` or `clear`
- `stroke`: present when `action = stroke`

### Response

- updated room snapshot

### Rules

- Only the drawer may submit drawing updates.
- `clear` resets the drawing list to empty.
- Draw updates must be visible on the next poll.

## Submit guess

`POST /rooms/:code/guess`

### Request

- `participantId`
- `guess`

### Response

- updated room snapshot
- guess result reflected in the response state

### Rules

- The client trims before submit.
- The server trims again and rejects empty guesses.
- Only server-accepted guesses are added to the shared guess history.
- Correct guesses add exactly 100 points.
- A participant who already guessed correctly cannot submit again.
