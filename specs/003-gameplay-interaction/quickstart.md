# Quickstart: Gameplay Interaction Implementation

## Prerequisites

- Spec and clarifications finalized (`spec.md`, `Clarifications` section)
- Data model reviewed (`data-model.md`)
- API contracts reviewed (`contracts/`)
- Backend and frontend dev servers running (`npm run dev` in each)

## Implementation Order

### Step 1: Backend Models (game.ts)

Add `DrawingStroke`, `Point`, `Guess`, `PlayerScore` interfaces. Extend `RoomStatus` to `"lobby" | "playing" | "round_ended"`. Add new fields to `Room` and `RoomSnapshot` types.

### Step 2: Backend Schemas (schemas.ts)

Add Zod schemas for:
- `submitStrokesSchema` — validates action, strokes array, participantId
- `submitGuessSchema` — validates text (1-200 chars, trimmed), participantId
- `revealWordSchema` — validates participantId

### Step 3: Backend Store Logic (roomStore.ts)

Add functions to:
- Initialize game state (strokes, guesses, scores) when round starts
- `submitStrokes(participantId, strokes)` — append strokes, validate drawer
- `clearCanvas(participantId)` — reset strokes, increment clearVersion
- `submitGuess(participantId, text)` — validate, compare word, return result
- `revealWord(participantId)` — transition to round_ended
- Check `allGuessersCorrect()` — return true when every non-drawer has correct guess
- Extend `toRoomSnapshot()` to include new fields

### Step 4: Backend Routes (rooms.ts, router.ts)

Add route handlers for:
- `POST /rooms/:code/strokes` — submit/clear strokes
- `GET /rooms/:code/strokes` — fetch current strokes
- `POST /rooms/:code/guesses` — submit guess
- `POST /rooms/:code/reveal` — drawer reveals word

Mount new routes in `router.ts`.

### Step 5: Backend Tests

Write tests for:
- Stroke submission validation (drawer-only, playing-only, empty strokes rejected)
- Canvas clear (drawer-only, state reset)
- Guess validation (case-insensitive match, empty/long rejection, drawer rejection)
- Correct guesser subsequent guess suppression
- All-guessers-correct auto round-end
- Drawer manual reveal
- Round isolation (multi-room)

### Step 6: Frontend API Client (api.ts)

Add functions:
- `submitStrokes(roomCode, participantId, strokes)` / `clearCanvas(roomCode, participantId)`
- `submitGuess(roomCode, participantId, text)`
- `revealWord(roomCode, participantId)`

### Step 7: Frontend DrawingCanvas Component

Build interactive `<canvas>` component:
- Mouse event handlers (mousedown, mousemove, mouseup) for freehand drawing
- Color picker (8-12 color palette)
- Width picker (3-4 sizes)
- Clear button (drawer only)
- Stroke serialization (JSON to send to backend)
- Canvas rendering from received stroke data (polling)
- Clear-version detection (discard old strokes on clear)

### Step 8: Frontend GuessForm

Wire existing `GuessForm` to the API:
- Call `submitGuess()` on form submit
- Show loading state while submitting
- Display "Correct!" or "Incorrect" feedback on response
- Disable input after correct guess

### Step 9: Frontend GamePage Integration

Update `GamePage` to:
- Replace canvas placeholder with `DrawingCanvas` component
- Pass polling canvas state to DrawingCanvas
- Show reveal button when viewer is drawer and round is playing
- Wire `ResultPanel` to real guess data from snapshot
- Wire `Scoreboard` to real score data from snapshot
- Handle `round_ended` state (show word, final scores, final drawing)

### Step 10: Frontend RoomStore

Update store to include:
- Strokes array and clearVersion in room state
- Array of guesses in room state
- Scores array in room state
- allGuessersCorrect flag
- Functions for submitting guesses/strokes/reveal
- Auto-polling picks up all new fields from snapshot

### Step 11: Frontend Tests

Write tests for:
- DrawingCanvas rendering and interaction
- GuessForm submission flow
- ResultPanel rendering of guess history
- Scoreboard rendering of scores
- API client functions

### Step 12: Two-Browser Manual Testing

- Open two browser sessions in the same room
- Start game (drawer is first player, guesser is second)
- Drawer draws on canvas — verify guesser sees strokes within 2s
- Drawer clears canvas — verify guesser sees empty canvas
- Guesser submits correct guess — verify "Correct" feedback
- Guesser submits incorrect guess — verify "Incorrect" feedback
- Drawer sees all guesses in activity panel
- Second guesser joins mid-round — verify they see full state
- All guessers correct → verify round auto-ends
- Drawer reveals → verify secret word shown to all
- After round ends, verify no new strokes/guesses accepted
