# Quickstart: Drawing & Guessing

## Prerequisites

- Node.js 18+ and npm 9+
- Three browser tabs (for testing drawer + 2 guessers)
- Game Start & Role Assignment feature must be fully implemented and running

## Start the Backend

```bash
cd backend
npm run dev
```

Backend on `http://localhost:3001`.

## Start the Frontend

```bash
cd frontend
npm run dev
```

Frontend on `http://localhost:5173`.

## Verify the Feature

### Setup: Create a Room with Three Players

1. Open Tab A → Create Room as "Sketch Captain" → note room code
2. Open Tab B → Join Room as "Second Pencil" → enter room code
3. Open Tab C → Join Room as "Third Eye" → enter room code

### Verify Drawer Can Draw on Canvas

1. In Tab A (host), click **Start Game**
2. Identify which tab is the drawer (Tab A, B, or C)
3. In the drawer's tab, select a word from the 3 options
4. Verify a white drawing canvas appears with a pen cursor
5. Click and drag on the canvas to draw a line
6. Verify the stroke appears immediately on the drawer's canvas as you draw

### Verify Guessers See the Drawing

1. Look at the guessers' tabs (the non-drawer tabs)
2. Verify they see a white canvas (empty initially)
3. On the drawer's tab, draw several distinct strokes
4. Wait up to 2 seconds on the guessers' tabs
5. Verify the guessers' canvases show the same strokes as the drawer's canvas

### Verify Guess Submission — Incorrect Guess

1. On a guesser's tab, type a wrong word (e.g., if secret word is "cat", type "dog") in the guess input
2. Click **Submit Guess**
3. Verify the response shows the guess was incorrect
4. Verify the guess appears in the guesses list for all players

### Verify Guess Submission — Correct Guess

1. On a guesser's tab, type the exact secret word (e.g., "cat")
2. Click **Submit Guess**
3. Verify the response shows the guess was correct
4. Verify the guess appears in the guesses list for all players
5. Verify the drawer CANNOT see which guess was correct

### Verify Already-Correct Rejection

1. On the guesser who already guessed correctly, try to submit another guess
2. Verify error: "You have already guessed correctly"

### Verify Drawer Cannot Guess

1. On the drawer's tab, attempt to submit a guess
2. Verify error: "The drawer cannot submit guesses" (or guess input is hidden)

### Verify Canvas Clear

1. On the drawer's tab, draw several strokes on the canvas
2. Verify strokes are visible on guessers' canvases
3. On the drawer's tab, click **Clear Canvas**
4. Verify the drawer's canvas is now blank (all strokes removed)
5. Wait up to 2 seconds on guessers' tabs
6. Verify guessers' canvases are also blank (cleared via polling)

### Verify Strokes Persist Across Polls

1. On a guesser's tab, draw a few strokes on the drawer's tab
2. Wait for polling cycle, verify guesser sees strokes
3. Refresh the guesser's tab, navigate back to the game
4. Verify strokes are still rendered (they persist on the server)

## Build Validation

```bash
cd backend && npm run build
cd frontend && npm run build
```

Both must pass without errors.
