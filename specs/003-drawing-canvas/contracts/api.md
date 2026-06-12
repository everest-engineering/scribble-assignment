# API Contracts: Drawing Canvas

All endpoints extend the base `RoomSessionResponse` pattern. All request bodies validated with Zod.

## POST /api/rooms/:code/canvas/strokes

Add a completed stroke to the current round's canvas.

**Request**:
```typescript
{
  participantId: string;   // Must be the current drawer
  stroke: {
    id: string;            // UUID v4, client-generated
    points: Array<{ x: number; y: number }>;  // 2–1000 points
    colour: string;        // Hex: /^#[0-9a-fA-F]{6}$/
    width: 2 | 4 | 8;     // Brush width in pixels
    createdAt: string;     // ISO 8601
  }
}
```

**Response (200)**:
```typescript
{
  canvasState: {
    strokes: Stroke[];     // Updated full stroke list
    roundNumber: number;
  }
}
```

**Errors**:
- `403`: Participant is not the current drawer
- `400`: Invalid stroke data (validation error)
- `404`: Room not found or no active round

---

## POST /api/rooms/:code/canvas/clear

Clear all strokes from the current round's canvas. Available only to the drawer.

**Request**:
```typescript
{
  participantId: string;   // Must be the current drawer
}
```

**Response (200)**:
```typescript
{
  canvasState: {
    strokes: [];           // Empty array
    roundNumber: number;
  }
}
```

**Errors**:
- `403`: Participant is not the current drawer
- `404`: Room not found or no active round

---

## GET /api/rooms/:code/canvas

Fetch the current canvas state. Used by guessers for polling and by mid-round joiners.

**Query Parameters**: (none)

**Response (200)**:
```typescript
{
  canvasState: {
    strokes: Stroke[];
    roundNumber: number;
  } | null;  // null if no active round
}
```

**Errors**:
- `404`: Room not found

---

## State Machine

```
No active round (canvasState = null)
       │
       ▼  Round starts
CanvasState created (strokes = [])
       │
       ├── POST /strokes ──► stroke appended
       ├── POST /clear   ──► strokes = []
       │
       ▼  Round ends
CanvasState discarded (set to null)
```
