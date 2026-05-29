# Rooms API Contract: Result Restart Flow

All result and restart endpoints are scoped to an existing room and use JSON request and response bodies. Existing centralized error handling returns predictable error messages for rejected requests.

## Shared Snapshot Shape

Room responses continue to use the existing `room` wrapper. The room `status` determines which lifecycle fields are present.

### Result-State Response

```json
{
  "room": {
    "code": "ABCD",
    "status": "result",
    "participants": [],
    "hostParticipantId": "participant-host",
    "viewerParticipantId": "participant-viewer",
    "isHost": true,
    "canStart": false,
    "completedRound": {
      "roundNumber": 1,
      "drawerParticipantId": "participant-host",
      "drawerName": "Alice",
      "secretWord": "rocket",
      "canvas": {
        "strokes": [],
        "updatedAt": "2026-05-29T09:30:00.000Z"
      },
      "guesses": [],
      "scores": [
        {
          "participantId": "participant-guesser",
          "participantName": "Bob",
          "score": 100
        }
      ],
      "startedAt": "2026-05-29T09:25:00.000Z",
      "endedAt": "2026-05-29T09:35:00.000Z"
    },
    "scores": [
      {
        "participantId": "participant-guesser",
        "participantName": "Bob",
        "score": 100
      }
    ]
  }
}
```

The completed round `secretWord` is visible to all room participants only while status is `result`.

### Restarted Lobby Response

```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [],
    "hostParticipantId": "participant-host",
    "viewerParticipantId": "participant-host",
    "isHost": true,
    "canStart": true
  }
}
```

After restart, the response must not include active round, completed round, canvas, guesses, secret word, drawer assignment, or completed-round scores.

## GET /rooms/:code

Fetches the current room snapshot for polling across lobby, playing, and result states.

### Query

- `participantId` optional string, used to derive viewer role, host status, and result/restart controls.

### Success

- `200 OK`
- Returns the shared room snapshot.
- When status is `result`, includes revealed completed-round result data.
- When status is `lobby` after restart, omits all round-specific result data.

### Errors

- `400 Bad Request`: Invalid room code or malformed participant query.
- `404 Not Found`: Room cannot be loaded.

## POST /rooms/:code/round/end

Transitions an active room from playing to result state.

### Body

```json
{
  "participantId": "participant-host"
}
```

### Success

- `200 OK`
- Returns the shared result-state snapshot.
- Gameplay mutations are no longer accepted after this transition.

### Validation and Errors

- `400 Bad Request`: Invalid room code, missing participant ID, or room is not playing.
- `404 Not Found`: Room or participant cannot be found.

## POST /rooms/:code/restart

Restarts a result-state room back to lobby while preserving the room code, host, and current participants.

### Body

```json
{
  "participantId": "participant-host"
}
```

### Success

- `200 OK`
- Returns the shared lobby-state snapshot.
- Clears active round, completed round, secret word, drawer assignment, canvas, guesses, scores, and correctness tracking.

### Validation and Errors

- `400 Bad Request`: Invalid room code, missing participant ID, or room is not in result state.
- `403 Forbidden`: Participant is not the host.
- `404 Not Found`: Room or participant cannot be found.

## Gameplay Endpoint Behavior in Result State

The existing drawing, clear, and guess endpoints must reject requests after the room enters result state.

### Errors

- `400 Bad Request`: Room is not actively playing.
- `403 Forbidden`: Participant role is not allowed for the requested action.
- `404 Not Found`: Room or participant cannot be found.

## Polling Data Flow

1. A valid end-round action changes the room snapshot from playing to result.
2. The initiating client receives the result snapshot immediately.
3. Other clients continue polling `GET /rooms/:code?participantId=...` and render result on the next successful response.
4. The host submits restart from result state.
5. The host receives the lobby snapshot immediately.
6. Other clients continue polling and render the lobby with the same room code and preserved players on the next successful response.
7. Polling failures keep the latest successful snapshot visible and recover on the next successful poll.
