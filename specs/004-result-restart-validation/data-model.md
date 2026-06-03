# Data Model: Result and Restart

**Feature**: Scenario 4 | **Date**: 2026-06-03

## Snapshot behavior change

### secretWord visibility

| Room status | Viewer | `currentRound.secretWord` in snapshot |
|-------------|--------|--------------------------------------|
| `playing` | drawer | actual word |
| `playing` | guesser | `null` |
| `result` | any | actual word |
| `lobby` | any | field absent (no currentRound) |

## Restart transition

```text
result --restartRoom (host)--> lobby
  - delete currentRound
  - participants unchanged
  - hostParticipantId unchanged
```

Invalid:

```text
lobby --restartRoom--> rejected 409
playing --restartRoom--> rejected 409
result --restartRoom (non-host)--> rejected 403
```

## Service function

### `restartRoom(code, participantId)`

| Step | Action |
|------|--------|
| 1 | Load room; null → return null |
| 2 | Verify `participantId === hostParticipantId` else throw `RestartNotHostError` |
| 3 | Verify `status === "result"` else throw `RestartInvalidStateError` |
| 4 | Set `status = "lobby"`, `currentRound = undefined`, `updatedAt = now()` |
| 5 | Save and return clone |

## Error classes

| Class | HTTP | Message |
|-------|------|---------|
| `RestartNotHostError` | 403 | `"Only the host can restart the game"` |
| `RestartInvalidStateError` | 409 | `"Game is not in result state"` |

## API schema

```typescript
restartRoomSchema = z.object({
  participantId: z.string().min(1)
});
```

## Frontend state

| Action | Effect |
|--------|--------|
| `restartGame()` | POST restart; set snapshot; host navigates to `/lobby` |
| Poll on GamePage | If `status === "lobby"` → navigate `/lobby` |

## RoomSnapshot in lobby after restart

```json
{
  "code": "ABCD",
  "status": "lobby",
  "hostParticipantId": "...",
  "participants": [ /* unchanged */ ],
  "currentRound": undefined
}
```
