# API Contract: POST /rooms/:code/claim-host

## Summary

Promotes any participant to host. Used when the original host disconnects. Idempotent — calling it when already host is a no-op success.

## Request

**Method**: `POST`
**Path**: `/rooms/:code/claim-host`
**Content-Type**: `application/json`

### Path Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| code | string | yes | Room code (case-insensitive, uppercased server-side) |

### Body (Zod: `claimHostSchema`)

```ts
export const claimHostSchema = z.object({
  participantId: z.string()
});
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| participantId | string | yes | Must exist in room's `participants[]` |

## Response

### 200 OK

```json
{
  "room": RoomSnapshot
}
```

`RoomSnapshot` reflects the new `hostId`. Other fields unchanged.

### 404 Not Found

```json
{ "message": "Participant not found" }
```

Returned when `participantId` does not match any participant in the room.

### 404 Not Found (room)

```json
{ "message": "Room not found" }
```

Returned when room code does not exist.

## Backend Service

```ts
function claimHost(code: string, participantId: string): RoomSnapshot | null
```

### Logic

1. Look up room by code. Return null if not found.
2. Find participant in `room.participants`. Return null if not found (caller returns 404).
3. Set `room.hostId = participantId`.
4. Save room, return snapshot via `toRoomSnapshot()`.

### Notes

- Idempotent: if participant is already host, it's a no-op success.
- Node.js single-threaded event loop serializes concurrent claims. Last write wins.
- Does NOT update `lastSeenAt` for the caller (only GET /:code does that).

## Testing

- Claim host succeeds for any participant
- Claim host is idempotent (already host succeeds)
- Non-existent participant returns 404
- Non-existent room returns 404
- After claim, new host can restart/skip
- Original host (if they return) is demoted to regular participant
