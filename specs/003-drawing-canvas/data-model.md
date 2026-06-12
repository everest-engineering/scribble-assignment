# Data Model: Drawing Canvas

## Entities

### Point

Represents a single sampled point within a stroke.

| Field | Type | Description |
|-------|------|-------------|
| `x` | `number` | X-coordinate relative to canvas width (0–1 normalized) |
| `y` | `number` | Y-coordinate relative to canvas height (0–1 normalized) |

**Validation**: Both `x` and `y` must be finite numbers between 0 and 1. At least 2 points per stroke (start + end).

### Stroke

Represents a single completed drawing stroke.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Client-generated unique identifier |
| `points` | `Point[]` | Ordered array of sampled points |
| `colour` | `string` | Hex colour code (e.g., `#000000`) |
| `width` | `number` | Brush width in pixels (thin=2, medium=4, thick=8) |
| `createdAt` | `string` (ISO 8601) | Timestamp when stroke was completed |

**Validation**:
- `id` must be a valid UUID v4
- `points` must contain at least 2 entries
- `colour` must match `/^#[0-9a-fA-F]{6}$/`
- `width` must be one of `2`, `4`, `8`
- `createdAt` must be a valid ISO 8601 string

### CanvasState

Represents the complete drawing for the current round.

| Field | Type | Description |
|-------|------|-------------|
| `strokes` | `Stroke[]` | All strokes drawn so far in the current round, ordered by creation time |
| `roundNumber` | `number` | The round this canvas belongs to |

**Validation**: Strokes array may be empty (fresh canvas). Round number must match the current game round.

### DrawingAction

Payload for client-to-server drawing operations.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"add_stroke" \| "clear"` | The action to perform |
| `stroke` | `Stroke \| null` | Present when type is `add_stroke` |
| `participantId` | `string` | The participant performing the action |

**Validation**: Only the current drawer may send `add_stroke` or `clear` actions.

## State Transitions

```
Round Start → CanvasState created (empty strokes[])
                ↓
         Drawer draws → POST add_stroke → stroke appended
                ↓
         Drawer clears → POST clear → strokes[] emptied
                ↓
         Round End → CanvasState discarded
```

## Backend Storage

CanvasState is stored as a field on the Room model:

```typescript
interface Room {
  // ... existing fields
  canvasState: CanvasState | null; // null when no active round
}
```

**Lifecycle**:
- Created: when a round starts (roundNumber set)
- Mutated: on `add_stroke` (append) or `clear` (empty array)
- Discarded: on round transition (set to null, memory freed)

## API Payloads

See [contracts/api.md](./contracts/api.md) for full request/response schemas.
