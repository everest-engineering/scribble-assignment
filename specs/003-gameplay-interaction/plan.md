# Technical Implementation Plan - Gameplay Interaction (Slice 3)

## Overview
This document describes the technical plan for Slice 3: interactive canvas drawing, guess submission, synchronized guess history, and deterministic scoring.

---

## Proposed Changes

### 1. Model Updates (Shared)

#### [MODIFY] `backend/src/models/game.ts`
- Add new types:
  ```typescript
  export interface Point { x: number; y: number; }
  export interface DrawingStroke { points: Point[]; }
  export interface Guess {
    participantId: string;
    participantName: string;
    text: string;
    correct: boolean;
    timestamp: string;
  }
  ```
- Add to `Room`:
  - `guesses: Guess[]`
  - `scores: Record<string, number>`
  - `drawing: DrawingStroke[]`
  - `correctGuessers: string[]`
- Add to `RoomSnapshot`:
  - `guesses: Guess[]`
  - `scores: Record<string, number>`
  - `drawing: DrawingStroke[]`

#### [MODIFY] `frontend/src/services/api.ts`
- Align `RoomSnapshot` with backend additions.
- Add types: `Point`, `DrawingStroke`, `Guess`.

---

### 2. Validation Schemas

#### [MODIFY] `backend/src/api/schemas.ts`
- Add `submitGuessSchema`:
  ```typescript
  export const submitGuessSchema = z.object({
    participantId: z.string().min(1),
    text: z.string().trim().min(1, "Guess cannot be empty")
  });
  ```
- Add `drawingUpdateSchema`:
  ```typescript
  export const drawingUpdateSchema = z.object({
    participantId: z.string().min(1),
    strokes: z.array(z.object({
      points: z.array(z.object({ x: z.number(), y: z.number() }))
    }))
  });
  ```

---

### 3. Backend Logic & Services

#### [MODIFY] `backend/src/services/roomStore.ts`
- **`createRoom(playerName)`**: Initialize `guesses: []`, `scores: {}`, `drawing: []`, `correctGuessers: []`.
- **`submitGuess(code, participantId, text)`**:
  - Validate room exists (404 if not).
  - Validate game is active (400 if not).
  - Validate participant is not the drawer (403 if they are).
  - Trim text. If empty reject (400).
  - Compare `text.toLowerCase() === room.secretWord.toLowerCase()`.
  - Create `Guess` entry with `correct` boolean and `timestamp`.
  - If correct and participant not already in `correctGuessers`, add 100 to their score and push to `correctGuessers`.
  - Append guess to `guesses` array.
  - Save and return updated room.
- **`updateDrawing(code, participantId, strokes)`**:
  - Validate room exists and game is active.
  - Validate participant is the drawer (403 if not).
  - Replace `room.drawing` with provided strokes.
  - Save and return updated room.
- **`clearDrawing(code, participantId)`**:
  - Validate room exists and game is active.
  - Validate participant is the drawer (403 if not).
  - Set `room.drawing = []`.
  - Save and return updated room.
- **`toRoomSnapshot(room, viewerParticipantId)`**: Include `guesses`, `scores`, `drawing` in snapshot.

#### [MODIFY] `backend/src/api/rooms.ts`
- Add route `POST /rooms/:code/guess`:
  - Parse code from params, body with `submitGuessSchema`.
  - Call `submitGuess(code, participantId, text)`.
  - Return updated room snapshot.
- Add route `POST /rooms/:code/draw`:
  - Parse code from params, body with `drawingUpdateSchema`.
  - Call `updateDrawing(code, participantId, strokes)`.
  - Return updated room snapshot.
- Add route `POST /rooms/:code/clear`:
  - Parse code from params, body with `{ participantId }`.
  - Call `clearDrawing(code, participantId)`.
  - Return updated room snapshot.

---

### 4. Frontend API & Store Integrations

#### [MODIFY] `frontend/src/services/api.ts`
- Add `submitGuess(code, participantId, text)`:
  ```typescript
  submitGuess(code: string, participantId: string, text: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/guess`, {
      method: "POST",
      body: JSON.stringify({ participantId, text })
    });
  }
  ```
- Add `updateDrawing(code, participantId, strokes)`:
  ```typescript
  updateDrawing(code: string, participantId: string, strokes: DrawingStroke[]) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/draw`, {
      method: "POST",
      body: JSON.stringify({ participantId, strokes })
    });
  }
  ```
- Add `clearDrawing(code, participantId)`:
  ```typescript
  clearDrawing(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/clear`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  }
  ```

#### [MODIFY] `frontend/src/state/roomStore.ts`
- Add `submitGuess(text: string)` method that calls API and updates snapshot.
- Add `updateDrawing(strokes: DrawingStroke[])` method that calls API and updates snapshot.
- Add `clearDrawing()` method that calls API and updates snapshot.

---

### 5. Frontend UI Components

#### [MODIFY] `frontend/src/pages/GamePage.tsx`
- **Drawing Canvas**:
  - When `isDrawer`, render an interactive `<canvas>` element.
  - Track mouse events (mousedown, mousemove, mouseup) to build strokes.
  - Debounce or batch stroke submission to avoid excessive API calls (submit on mouseup).
  - Provide a "Clear Canvas" button that calls `clearDrawing()`.
  - Render the canvas drawing on a 2D context.
- **Viewing Canvas**:
  - When `!isDrawer`, render a read-only canvas that renders strokes from `room.drawing`.
  - Poll for drawing updates via the existing 2s polling loop.

#### [MODIFY] `frontend/src/components/GuessForm.tsx`
- Accept `roomStore` and `room` as props (or use store directly).
- On submit: call `roomStore.submitGuess(guessText)`.
- Clear the input on successful submission.
- Disable the input when `isDrawer === true`.
- Disable the input when `guessCorrect === true` (already guessed correctly).

#### [MODIFY] `frontend/src/components/Scoreboard.tsx`
- Accept `participants` and `scores` as props (or read from room snapshot).
- Render a list of participants with their scores from `room.scores`.
- Show "0" for participants not yet in the scores map.

#### [MODIFY] `frontend/src/components/ResultPanel.tsx`
- Rename or repurpose to show guess history / activity.
- Accept `guesses` as prop.
- Render each guess as a list item showing: participant name, guess text, correct/incorrect indicator.
- Style correct guesses green, incorrect grey.

---

## Verification Plan

### Automated Tests
- Run `npm test` in both backend and frontend.
- Write tests in `backend/src/services/roomStore.test.ts` for:
  - Guess submission: empty rejection, case-insensitive match, drawer rejection.
  - Scoring: correct guess awards 100, duplicate awards 0.
  - Drawing: drawer can update/clear, non-drawer rejected.
  - Snapshot includes scores, guesses, drawing.

### Manual Verification Flow (2 Browser Tabs)
1. **Setup**: Host Tab A and Guest Tab B in lobby. Host starts game.
2. **Drawing**:
   - Tab A (drawer) can draw on canvas and see strokes appear.
   - Tab B (guesser) sees the same strokes within ~2 seconds.
   - Drawer clicks "Clear Canvas" → both tabs show blank canvas.
3. **Guessing**:
   - Tab B types a guess and submits → guess appears in history.
   - Tab B submits the correct word in different case → marked correct, gets 100 points.
   - Tab B submits the same correct word again → recorded but no extra points.
   - Tab A (drawer) cannot submit guesses.
4. **Scoreboard**:
   - Both tabs show updated scores after correct guesses.
