# API Contracts: Result & Restart

**Branch**: `004-result-restart` | **Date**: 2026-05-31

## Endpoints

### 1. Return to Lobby

**Route**: `POST /api/rooms/:roomId/reset`
**Description**: Triggered manually by the host to transition the room from `results` back to `lobby` and clear all round data.

**Request Body**:
```json
{
  "playerId": "string" // Must match the host's ID
}
```

**Response (Success)**:
```json
{
  "success": true,
  "roomState": {
    "roomId": "string",
    "phase": "lobby",
    "players": [ ... ], // Scores reset to 0
    "targetWord": "",
    "canvasState": []
  }
}
```

**Errors**:
- `400 Bad Request`: If room is not in `results` phase (optional strictness).
- `403 Forbidden`: If `playerId` does not belong to the host.
- `404 Not Found`: If room does not exist.
