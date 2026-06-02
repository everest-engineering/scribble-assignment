# Quickstart: Gameplay Interaction

## Backend

```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:3001`.

## Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Manual Validation

1. Open two browser tabs at `http://localhost:5173`
2. Tab 1: Create a room → copy room code
3. Tab 2: Join the room
4. Tab 1: Start the game → both tabs auto-navigate to game view
5. Tab 1 (drawer): Draw on canvas → Tab 2 sees strokes within 1s
6. Tab 2 (guesser): Submit a guess → score reflects within 2s
7. Both tabs see guess history appearing
8. Tab 1: Clear canvas → both see blank within 1s

## Build

```bash
cd backend && npm run build
cd frontend && npm run build
```
