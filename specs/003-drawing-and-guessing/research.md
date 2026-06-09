# Research: Drawing & Guessing

**Feature**: Drawing & Guessing | **Date**: 2026-06-09 | **Plan**: `specs/003-drawing-and-guessing/plan.md`

## Decisions

### 1. Canvas Sync Mechanism

**Decision**: Drawer submits strokes incrementally to the server. Each stroke is an independent unit submitted on mouse-up and periodically flushed (every 1s) for long, continuous strokes. Guessers receive all strokes via the room polling endpoint and re-render from scratch on each poll.

**Rationale**:
- Incremental submission is simpler than full-canvas snapshots
- Re-rendering from scratch avoids complex delta/patch logic
- Polling at 500ms provides acceptable visual latency (below the 2s constitution max)
- Each stroke is immutable once finalized, making the model easy to reason about

**Alternatives considered**:
- *Full canvas snapshot*: Submitting the entire canvas as a base64 image. Simpler to render but larger payloads and harder to support undo/clear features.
- *WebSockets*: Rejected by constitution.

### 2. Stroke Data Format

**Decision**: Points normalized to [0, 1] range relative to canvas dimensions. This ensures resolution-independent rendering across varying display sizes.

```typescript
interface Point {
  x: number;  // 0-1 normalized
  y: number;  // 0-1 normalized
}

interface Stroke {
  points: Point[];
  color: string;   // hex color e.g. "#000000"
  width: number;   // normalized width 0-1
}
```

**Rationale**: Canvas rendering must work on different screen sizes (desktop, tablet). Normalized coordinates let each client scale to its actual canvas pixel dimensions.

**Alternatives considered**:
- *Absolute pixel coordinates*: Simpler but breaks on different canvas sizes. Guessers might have differently-sized canvas elements.
- *SVG paths*: Over-engineered for freehand lines.

### 3. Drawing Input Method

**Decision**: HTML5 Canvas 2D API with pointer events (`pointerdown`, `pointermove`, `pointerup`). Single black pen with fixed 0.008 normalized width (~3px on a 400px canvas).

**Rationale**: Pointer events unify mouse and touch. Canvas 2D API is well-supported and performant for freehand drawing. Single pen keeps the initial implementation simple.

**Alternatives considered**:
- *SVG*: More DOM nodes for complex drawings, slower for many strokes.
- *Multiple colors/brush sizes*: Out of scope for this feature per spec assumptions.

### 4. Polling Strategy

**Decision**: 500ms polling interval during the "drawing" phase. Lobby and word-selection phases remain at 2s.

```typescript
const POLL_INTERVAL = phase === "drawing" ? 500 : 2000;
```

**Rationale**: The 2s constitution limit is a maximum ceiling, not a target. Drawing is time-sensitive; 500ms provides a responsive feel. Server payload includes stroke data only when strokes have changed (clients can compare stroke count or use an `updatedAt` timestamp).

**Alternatives considered**:
- *100ms polling*: Too aggressive for HTTP, would generate excessive server load.
- *2s polling throughout*: Too slow for drawing — guessers would see strokes with frustrating delay.

### 5. Guess Validation

**Decision**: Case-insensitive exact string match against the secret word. Zod validates input (trimmed, non-empty, max 100 chars). Only guessers can submit. Already-correct guessers are rejected.

```typescript
function isGuessCorrect(guess: string, secretWord: string): boolean {
  return guess.trim().toLowerCase() === secretWord.trim().toLowerCase();
}
```

**Rationale**: Simple, deterministic, and unambiguous. Case-insensitive matching accommodates normal player behavior.

**Alternatives considered**:
- *Levenshtein distance / fuzzy matching*: Would accept near-misses, which undermines the game's challenge.
- *Substring matching*: Could leak partial word information.

### 6. Guess Visibility Model

**Decision**:
- The guesser who submitted learns correctness from the POST response body (`{ correct: boolean }`).
- The room polling endpoint returns all guesses with `text`, `participantName`, and `participantId` — but NOT `isCorrect` for guesses by other players.
- The drawer receives guesses via polling with `isCorrect` **always set to `null`** (they never learn who guessed correctly during the round).

**Rationale**: Preserves game fairness — guessers can't piggyback on others' correct answers. The drawer shouldn't know who's close, which keeps the drawing engaging.

**Alternatives considered**:
- *Show all correctness to all players*: Makes the game trivial for guessers (they'd know when someone else got it right).
- *Hide all correctness from everyone*: Guessers wouldn't know if they personally were correct, which removes the satisfaction and feedback.

### 7. Canvas Rendering Approach

**Decision**: On each poll, the frontend clears the canvas and redraws all strokes from scratch. A canvas ref prevents unnecessary re-creations.

```typescript
function renderStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[], width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
  for (const stroke of strokes) {
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width * Math.min(width, height);
    // ... draw polyline
  }
}
```

**Rationale**: Simple, deterministic, and immune to sync issues. For party-game scale (tens to low hundreds of strokes per round), performance is not a concern.

**Alternatives considered**:
- *Incremental rendering*: Requires comparing old and new stroke arrays. More complex, little performance benefit at this scale.

### 8. Backend Storage Pattern

**Decision**: Strokes and guesses stored as plain arrays on the `RoundState` object. No separate collection or indexed lookup needed at this scale.

```typescript
interface RoundState {
  // ... existing fields ...
  strokes: Stroke[];
  guesses: Guess[];
}
```

**Rationale**: In-memory, flat arrays are the simplest possible storage. Room lifecycle management (cleanup) is already handled by the existing roomStore.
