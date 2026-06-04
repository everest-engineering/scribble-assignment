# Room Result and Restart API

## Room snapshot polling

`GET /rooms/:code?participantId=...`

Returns the current room snapshot for polling.

### Snapshot shape

- room metadata: code, status, host, drawer
- participants with scores and roles
- drawing strokes for the active round
- guess history for the active or completed round
- current word visible to all players in `result`, and to the drawer during `game`

## Restart room

`POST /rooms/:code/restart`

### Request

- `participantId`

### Response

- updated room snapshot in `lobby`

### Rules

- Only the host may restart the room.
- Restart is allowed only from the result state.
- Restart clears the drawing canvas, guess history, current word, current drawer, and round score state.
- Restart preserves the existing participant list and room membership.
- Restart resets all participant scores to `0`.
- All connected players should see the lobby again on the next poll.
