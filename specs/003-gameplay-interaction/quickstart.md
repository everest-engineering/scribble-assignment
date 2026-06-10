# Quickstart: Gameplay Interaction - Drawing, Guessing & Scoring

## Prerequisites

- Node.js 20+
- npm

## Setup

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

## Running

```bash
# Terminal 1: Start backend (port 3001)
cd backend && npm run dev

# Terminal 2: Start frontend (port 5173)
cd frontend && npm run dev
```

## Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Manual Testing Flow

### Drawing

1. Open two browser tabs to `http://localhost:5173`
2. **Tab 1**: Create a room, wait for **Tab 2** to join
3. **Tab 2**: Join the room
4. **Tab 1** (host) clicks "Start Game"
5. **Tab 1** is the drawer — draw on the canvas with mouse/touch
6. **Tab 2** sees the drawing appear within ~2s (next poll cycle)
7. **Tab 1** clicks "Clear" — canvas resets on both screens within ~2s

### Guessing

1. With a game in progress and a drawing visible on screen
2. **Tab 2** (guesser) types a guess in the GuessForm and submits
3. If correct (+100): scoreboard updates, guess history shows correct entry
4. If incorrect (+0): guess history shows incorrect entry, score unchanged
5. Try empty guess → rejected with error message
6. Try case-different correct guess → still accepted (case-insensitive)

### Scoring

1. With two guessers (Tab 2, Tab 3) and one drawer (Tab 1)
2. **Tab 2** guesses correctly → score becomes 100
3. **Tab 2** submits again → rejected (already scored)
4. **Tab 3** guesses correctly → score becomes 100
5. All guessers at 100 → `roundOver` flag set in snapshot

## Key Implementation Notes

- Canvas uses native HTML5 Canvas API — no external drawing library
- Strokes stored as point arrays and replayed on guessers' canvases
- Guess comparison: trim + case-insensitive exact match
- Scores: 100 for correct, 0 for incorrect, no partial credit
- Already-scored guessers: further submissions rejected with 400
- Drawer cannot submit guesses — rejected with 403
- Round ends when all guessers have scored 100 (signaled by `roundOver` flag)
- New endpoints: `POST /rooms/:code/canvas?playerId=<id>`, `POST /rooms/:code/guess?playerId=<id>`
- All new state (canvas, guesses, scores) included in existing `GET /rooms/:code` poll response
- Canvas clear does not affect scores, guess history, or secret word
- Client-side button cooldown ~500ms (no server-side rate limiting)
