# API Contracts: Game Start and Drawer Flow

## POST /rooms/:code/start

### Request

```json
{ "participantId": "host-uuid" }
```

### Drawer Response 200

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostId": "host-uuid",
    "drawerId": "host-uuid",
    "secretWord": "rocket"
  }
}
```

### Guesser Poll Response 200

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostId": "host-uuid",
    "drawerId": "host-uuid",
    "secretWord": null
  }
}
```

### Errors

- `403` when participant is not host.
- `409` when fewer than two players are present.
- `404` when room is missing.
