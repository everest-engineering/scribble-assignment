# Quickstart — Gameplay Interaction

## Run Locally

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev
# → http://localhost:3001

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

## Two-Browser Testing

1. **Tab 1** → Open `http://localhost:5173` → Create a room → Note the room code
2. **Tab 2** → Open `http://localhost:5173` → Join with the room code
3. **Tab 1** → Start game (host only, 2+ players needed)
4. **Tab 1** → You are the drawer. See the secret word. Draw on the canvas.
5. **Tab 2** → Guess. Type a guess and submit. See guess history update.
6. **Tab 1** → Clear canvas with the "Clear Canvas" button.
7. Both tabs see updated scores and guess history via polling (~2s).

## Key Files

| Path | Purpose |
|------|---------|
| `backend/src/services/roomStore.ts` | `submitGuess()`, `addCanvasStroke()`, `clearCanvas()` |
| `backend/src/api/rooms.ts` | `POST /:code/guess`, `POST /:code/canvas` |
| `frontend/src/components/Canvas.tsx` | Drawing canvas (HTML Canvas 2D API) |
| `frontend/src/components/GuessForm.tsx` | Guess input with validation + loading/error/success states |
| `frontend/src/components/ResultPanel.tsx` | Guess history display |
| `frontend/src/pages/GamePage.tsx` | Game page with auto-polling and canvas integration |

## Verify

```bash
cd backend && npm test    # 14 tests pass (was 14)
cd frontend && npm test   # 2 tests pass (was 2)
cd backend && npm run build   # passes
cd frontend && npm run build  # passes
```
