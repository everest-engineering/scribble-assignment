# Quickstart: Drawing Canvas

## Prerequisites

- Backend and frontend running per project README
- A game room created with at least 2 participants
- Game round started (host clicks "Start Game")

## Validation Scenarios

### Scenario 1: Drawer Can Draw on Canvas

1. Open the game as the drawer (host who started)
2. Verify the canvas is visible and interactive
3. Select a colour from the palette (8+ colours)
4. Select a brush width (thin/medium/thick)
5. Click and drag on the canvas
6. **Expected**: Freehand strokes appear following the mouse path in the selected colour and width

### Scenario 2: Strokes Sync to Guessers

1. Open the game as the drawer in one browser window
2. Open the game as a guesser in another browser window (or incognito)
3. Draw a stroke on the drawer's canvas
4. Wait up to 2 seconds (polling interval)
5. **Expected**: The stroke appears on the guesser's canvas

### Scenario 3: Guesser Canvas Is Read-Only

1. Open the game as a guesser
2. Attempt to click/drag on the canvas
3. **Expected**: No drawing occurs; canvas is non-interactive

### Scenario 4: Drawer Clears Canvas

1. Draw several strokes on the canvas
2. Click the "Clear Canvas" button
3. **Expected**: Canvas is empty for both drawer and all guessers

### Scenario 5: Mid-Round Joiner Sees Current Drawing

1. Have the drawer draw several strokes
2. Join the room as a new participant (if late join allowed) or refresh the guesser page
3. **Expected**: The full current drawing is visible within 2 seconds

### Scenario 6: Canvas Clears on New Round

1. Play through a round (drawing appears on canvas)
2. When the round ends and a new round begins
3. **Expected**: Canvas is automatically blank for all participants

## Running Tests

```bash
# Backend canvas tests
cd backend && npx vitest run src/tests/canvas.test.ts

# Frontend canvas component tests
cd frontend && npx vitest run src/tests/Canvas.test.tsx

# Full build validation
cd backend && npm run build
cd frontend && npm run build
```

## API Reference

See [contracts/api.md](./contracts/api.md) for endpoint schemas.
