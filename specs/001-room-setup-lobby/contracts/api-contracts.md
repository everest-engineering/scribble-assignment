# API Contracts: Room Setup & Lobby Navigation

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-02

All request/response shapes MUST be defined as Zod schemas in `shared/schemas/room.ts` before implementation. Types are derived with `z.infer<>`.

---

## Shared Types (Zod Schema Location: `shared/schemas/room.ts`)

```typescript
import { z } from "zod";

export const participantRoleSchema = z.enum(["drawer", "guesser"]);

export const participantSnapshotSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  joinedAt: z.string()
});

export const roomStatusSchema = z.enum(["lobby", "in-progress"]);

export const roomSnapshotSchema = z.object({
  code: z.string(),
  status: roomStatusSchema,
  hostId: z.string(),
  participants: z.array(participantSnapshotSchema),
  availableWords: z.array(z.string()),
  roles: z.array(participantRoleSchema)
});

export const roomSessionResponseSchema = z.object({
  participantId: z.string().uuid(),
  room: roomSnapshotSchema
});

export const roomResponseSchema = z.object({
  room: roomSnapshotSchema
});

// Derived TypeScript types
export type ParticipantRole = z.infer<typeof participantRoleSchema>;
export type ParticipantSnapshot = z.infer<typeof participantSnapshotSchema>;
export type RoomStatus = z.infer<typeof roomStatusSchema>;
export type RoomSnapshot = z.infer<typeof roomSnapshotSchema>;
export type RoomSessionResponse = z.infer<typeof roomSessionResponseSchema>;
export type RoomResponse = z.infer<typeof roomResponseSchema>;
```

---

## Endpoints

### POST /rooms — Create Room

**Request**
```typescript
// Zod schema: createRoomRequestSchema
{
  playerName: string  // trimmed, min 1 char
}
```

**Response 201**
```typescript
// Zod schema: roomSessionResponseSchema
{
  participantId: string,  // UUID of the creator
  room: RoomSnapshot      // hostId === participantId
}
```

**Response 400** — `playerName` empty or whitespace
```json
{ "message": "Invalid request payload" }
```

---

### POST /rooms/:code/join — Join Room

**Path param**: `code` — room code (case-insensitive; normalised to uppercase server-side)

**Request**
```typescript
// Zod schema: joinRoomRequestSchema
{
  playerName: string  // trimmed, min 1 char
}
```

**Response 200**
```typescript
// Zod schema: roomSessionResponseSchema
{
  participantId: string,
  room: RoomSnapshot
}
```

**Response 400** — `playerName` empty or whitespace
```json
{ "message": "Invalid request payload" }
```

**Response 404** — room code not found
```json
{ "message": "Room not found" }
```

**Response 409** — room is full (4 participants)
```json
{ "message": "Room is full" }
```

---

### GET /rooms/:code — Fetch Room (Polling)

**Path param**: `code` — room code (uppercase)

**Query param**: `participantId` (optional) — included by clients to identify themselves

**Response 200**
```typescript
// Zod schema: roomResponseSchema
{
  room: RoomSnapshot
}
```

**Response 404** — room not found
```json
{ "message": "Room not found" }
```

---

### POST /rooms/:code/start — Start Game

**Path param**: `code` — room code (uppercase)

**Request**
```typescript
// Zod schema: startRoomRequestSchema
{
  participantId: string  // must match room's hostId
}
```

**Response 200**
```typescript
// Zod schema: roomResponseSchema
{
  room: RoomSnapshot  // room.status === "in-progress"
}
```

**Response 400** — fewer than 2 participants
```json
{ "message": "At least 2 players are required to start" }
```

**Response 403** — participantId is not the host
```json
{ "message": "Only the host can start the game" }
```

**Response 404** — room not found
```json
{ "message": "Room not found" }
```

---

## Frontend Polling Contract

The `LobbyPage` polls `GET /rooms/:code` every ~2000ms. On each successful response:
- Update the participant list from `room.participants`
- If `room.status === "in-progress"`, navigate to `/game` immediately

On error:
- Retain existing participant list
- Show inline non-blocking error message
- Clear error automatically on the next successful poll
- Continue polling (do not stop the interval on error)

---

## Error Response Contract

All errors return JSON with a `message` field:
```typescript
{ message: string }
```

The frontend MUST parse this with a Zod schema (`errorResponseSchema`) and display `message` as a human-readable inline error. Raw status codes or stack traces MUST NOT be shown to users.
