# API Contracts: Scribble Game Result, Restart & Final Validation

**Branch**: `004-result-restart-validation` | **Date**: 2026-06-03

All schemas defined as Zod schemas in `shared/schemas/` before implementation (Constitution Principle VI).

---

## Modified Contract: GET /rooms/:code

**Purpose**: Existing polling endpoint — now also used to drive the results screen and detect auto-advance.

**No change to request shape.**

### Response body change (additive)

```typescript
// shared/schemas/room.ts — roomSnapshotSchema addition
resultExpiresAt: z.string().nullable()
```

`resultExpiresAt` is an ISO 8601 timestamp 30 seconds after the round ended. It is `null` when `status !== "finished"`. Clients use this to render the countdown display and detect when to navigate back to lobby.

**Zod schema location**: `shared/schemas/room.ts` → `roomSnapshotSchema`

---

## Modified Contract: GET /rooms/:code — currentWord reveal

`currentWord` in the response is now non-null for **all** viewers when `room.status === "finished"` (previously only the drawer received it). No schema change required — the field is already `z.string().nullable()`.

---

## New Contract: POST /rooms/:code/restart

**Purpose**: Host triggers an early return-to-lobby from the results screen.

### Request

```http
POST /rooms/{code}/restart
Content-Type: application/json
```

```typescript
// backend/src/api/schemas.ts
export const restartRoomSchema = z.object({
  participantId: z.string().min(1, "participantId is required")
});
```

**Body**:
```json
{ "participantId": "<host's participant UUID>" }
```

### Success Response `200 OK`

```typescript
// Reuses existing roomResponseSchema
{ "room": RoomSnapshot }
```

The returned `RoomSnapshot` will have `status: "lobby"`, empty `guesses`, zeroed `scores`, `currentWord: null`, `canvasDataUrl: null`, and `resultExpiresAt: null`. `participants` is preserved.

### Error Responses

| Status | Condition | `message` |
|--------|-----------|-----------|
| 404 | Room not found | `"Room not found"` |
| 403 | Caller is not the host | `"Only the host can restart the game"` |
| 400 | Room is not in finished state | `"Game has not finished yet"` |

**Zod schema location**: `backend/src/api/schemas.ts` → `restartRoomSchema`

---

## Frontend API Client Addition (frontend/src/services/api.ts)

```typescript
async restartGame(code: string, participantId: string): Promise<RoomResponse> {
  const raw = await request<unknown>(`/rooms/${encodeURIComponent(code)}/restart`, {
    method: "POST",
    body: JSON.stringify({ participantId })
  });
  return roomResponseSchema.parse(raw);
}
```

---

## Shared Schema Summary

| Schema | Location | Change |
|--------|----------|--------|
| `roomSnapshotSchema` | `shared/schemas/room.ts` | Add `resultExpiresAt: z.string().nullable()` |
| `restartRoomSchema` | `backend/src/api/schemas.ts` | New: `{ participantId: z.string().min(1) }` |

No new shared schemas required — `roomResponseSchema` already covers the restart success response.
