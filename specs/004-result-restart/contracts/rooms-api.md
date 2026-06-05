# Contract: Rooms REST API (Scenario 4)

Base URL: `http://localhost:3001`. JSON over HTTP. No auth. **Bold** marks additions for this
feature. Builds on the Scenario 1–3 contract.

## Shared shape: RoomSnapshot (extended)

```jsonc
{
  // ...Scenario 1–3 fields: participants, hostId, isHost, canStart, drawerId,
  //    isDrawer, guesses, scores, drawing...
  "status": "result",                 // NEW value: "lobby" | "playing" | "result"
  "secretWord": "castle",             // REVEALED to all viewers when status === "result"
  "guesses": [
    { "id": "…", "participantName": "Bob", "correct": true, "text": "castle", "createdAt": "…" }
    //                              correct-guess text is shown to ALL at result
  ],
  "canEndRound": false,               // NEW — isHost && status === "playing"
  "canRestart": true                  // NEW — isHost && status === "result"
}
```

- During `playing`, `secretWord` and correct-guess `text` keep their Scenario 2/3 secrecy
  (drawer-only / author-or-drawer). At `result`, both are revealed to everyone.

## POST /rooms/:code/end — end the round (NEW)

Moves the active round into the result state. Host only.

Request:
```json
{ "participantId": "uuid-host" }
```

Responses:
| Status | When | Body |
|--------|------|------|
| `200` | Host ends an active round | `{ "room": { /* result snapshot */ } }` |
| `400` | Missing `participantId` | `{ "message": "Invalid request payload" }` |
| `403` | Requester is not the host | `{ "message": "Only the host can end the round" }` |
| `404` | No room for code | `{ "message": "Room not found" }` |
| `409` | Room is not in an active round (`status != "playing"`) | `{ "message": "The round is not active" }` |

On success: `status = "result"`; word/scores/history retained and revealed.

## POST /rooms/:code/restart — restart to the lobby (NEW)

Returns the room to the lobby with players preserved and round state cleared. Host only.

Request:
```json
{ "participantId": "uuid-host" }
```

Responses:
| Status | When | Body |
|--------|------|------|
| `200` | Host restarts from the result state | `{ "room": { /* fresh lobby snapshot */ } }` |
| `400` | Missing `participantId` | `{ "message": "Invalid request payload" }` |
| `403` | Requester is not the host | `{ "message": "Only the host can restart the game" }` |
| `404` | No room for code | `{ "message": "Room not found" }` |
| `409` | Room is not in the result state (`status != "result"`) | `{ "message": "Restart is only available after a round" }` |

On success: `status = "lobby"`; `drawerId`/`secretWord`/`drawing` cleared, `guesses` emptied,
every `score` reset to `0`; `participants` and `hostId` preserved.

## GET /rooms/:code — fetch snapshot (now carries result state)

Query: `participantId` (expected for per-viewer roles/secrecy).

- Polled every ~2s by the game and result views; this is how the result and the restart-to-lobby
  transitions reach all players.
- When `status === "result"`, every viewer's snapshot includes the revealed `secretWord`, the full
  `guesses` (correct text shown), and final `scores`.

## Lifecycle summary

```text
lobby --POST /start--> playing --POST /end--> result --POST /restart--> lobby
```

All transitions are host-only and ride the existing snapshot poll; state is in memory only.
