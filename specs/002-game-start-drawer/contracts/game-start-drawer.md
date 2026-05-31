# API Contracts: Game Start & Drawer Flow

## Schema Validation Updates

In `backend/src/api/schemas.ts`:

- `createRoomSchema` & `joinRoomSchema`: The `playerName` field must be updated to trim whitespace and reject empty results.

```typescript
playerName: z.string().trim().min(1, "Player name is required")
```

## Room Snapshot Changes

When the `status` is `"in-game"`, the `RoomSnapshot` returned by all endpoints (join, create, poll, start) will include `roundState`. The snapshot is viewer-specific to ensure word secrecy.

- **For the Drawer (requesting participantId == drawerId)**:
  ```json
  "roundState": {
    "drawerId": "participant-uuid-123",
    "secretWord": "rocket"
  }
  ```

- **For Guessers (requesting participantId != drawerId)**:
  ```json
  "roundState": {
    "drawerId": "participant-uuid-123"
  }
  ```
  *(Note: `secretWord` is completely omitted from the payload)*
