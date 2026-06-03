# API Contracts

## Room State Payload (GET /api/rooms/:roomId)

The backend scrubs the `secretWord` from the payload based on the requester's ID.

### Response for Drawer
```json
{
  "id": "room123",
  "status": "playing",
  "roundNumber": 1,
  "drawerId": "player1-id",
  "secretWord": "apple",
  "wordLength": 5,
  "players": [
    {
      "id": "player1-id",
      "name": "HostName",
      "isDrawer": true
    },
    {
      "id": "player2-id",
      "name": "OtherPlayer",
      "isDrawer": false
    }
  ]
}
```

### Response for Non-Drawer
```json
{
  "id": "room123",
  "status": "playing",
  "roundNumber": 1,
  "drawerId": "player1-id",
  "secretWord": null,
  "wordLength": 5,
  "players": [ ... ]
}
```
