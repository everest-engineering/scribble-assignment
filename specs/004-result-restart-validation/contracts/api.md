# API Contracts: Result, Restart & Final Validation

**Branch**: `004-result-restart-validation` | **Date**: 2026-06-05

All existing endpoints are unchanged. This document defines the two new endpoints only.

---

## POST /rooms/:code/end

**Purpose**: Host ends the active round, transitioning the room to `"result"` status.

**Authorization**: Host only — requests from non-host participants return 403.

### Request

```
POST /rooms/:code/end
Content-Type: application/json
```

**URL params**:
| Param | Type | Description |
|-------|------|-------------|
| `code` | string | 4-character room code (case-insensitive, uppercased by server) |

**Body**:
```json
{
  "participantId": "string"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `participantId` | string | ✅ | ID of the requesting participant (must be host) |

### Responses

**200 OK** — round ended; full room snapshot returned with `status: "result"` and
`secretWord` visible for all participants.

```json
{
  "room": {
    "code": "ABCD",
    "status": "result",
    "participants": [...],
    "hostId": "uuid",
    "drawerId": "uuid",
    "secretWord": "rocket",
    "guesses": [...],
    "scores": { "uuid": 100, "uuid2": 0 },
    "canvasData": "data:image/png;base64,...",
    "availableWords": [...],
    "roles": [...]
  }
}
```

**403 Forbidden** — requester is not the host.
```json
{ "message": "Only the host can end the round" }
```

**404 Not Found** — room does not exist.
```json
{ "message": "Unable to load room" }
```

---

## POST /rooms/:code/restart

**Purpose**: Host restarts the room, transitioning back to `"lobby"` status with all
round state cleared and all participants preserved.

**Authorization**: Host only — requests from non-host participants return 403.

### Request

```
POST /rooms/:code/restart
Content-Type: application/json
```

**URL params**:
| Param | Type | Description |
|-------|------|-------------|
| `code` | string | 4-character room code (case-insensitive, uppercased by server) |

**Body**:
```json
{
  "participantId": "string"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `participantId` | string | ✅ | ID of the requesting participant (must be host) |

### Responses

**200 OK** — room restarted; full room snapshot returned with `status: "lobby"`,
empty `guesses`, empty `scores`, null `canvasData`, and all participants preserved.

```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [...],
    "hostId": "uuid",
    "drawerId": undefined,
    "secretWord": undefined,
    "guesses": [],
    "scores": {},
    "canvasData": null,
    "availableWords": [...],
    "roles": [...]
  }
}
```

**403 Forbidden** — requester is not the host.
```json
{ "message": "Only the host can restart the game" }
```

**404 Not Found** — room does not exist.
```json
{ "message": "Unable to load room" }
```

---

## Modified Behaviour: GET /rooms/:code

The existing `GET /rooms/:code?participantId=` endpoint is unchanged in signature.
Its response changes in one way for Scenario 4:

When `status = "result"`, the `secretWord` field is included for **all** viewers,
not just the drawer. This is handled server-side in `toRoomSnapshot`.

---

## Schema additions (`backend/src/api/schemas.ts`)

```ts
export const endRoomSchema = z.object({
  participantId: z.string()
});

export const restartRoomSchema = z.object({
  participantId: z.string()
});
```
